-- Habilita retirada gratuita no checkout sem alterar pedidos existentes.

BEGIN;

CREATE OR REPLACE FUNCTION public.reserve_checkout(p_request_id uuid, p_actor_id uuid, p_customer jsonb, p_items jsonb, p_origin text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
 r public.checkout_reservations%ROWTYPE;
 p public.products%ROWTYPE;
 v_request jsonb;
 v_items jsonb;
 v_item jsonb;
 v_lines jsonb := '[]';
 v_sale uuid;
 v_client uuid;
 v_qty integer;
 v_price numeric;
 v_cost numeric;
 v_total numeric := 0;
 v_total_cost numeric := 0;
 v_shipping numeric;
 v_payload jsonb;
BEGIN
 IF p_request_id IS NULL OR jsonb_typeof(p_items) IS DISTINCT FROM 'array' THEN
   RAISE EXCEPTION 'Carrinho inválido.' USING ERRCODE = 'P0001';
 END IF;
 IF jsonb_array_length(p_items) NOT BETWEEN 1 AND 99 OR jsonb_typeof(p_customer) IS DISTINCT FROM 'object' THEN
   RAISE EXCEPTION 'Carrinho inválido.';
 END IF;
 SELECT jsonb_agg(value ORDER BY value->>'id') INTO v_items FROM jsonb_array_elements(p_items);
 v_request := jsonb_build_object('actor', p_actor_id, 'customer', p_customer, 'items', v_items);
 PERFORM pg_advisory_xact_lock(hashtextextended(p_request_id::text, 0));
 IF EXISTS(SELECT 1 FROM public.checkout_abandoned_attempts WHERE request_id=p_request_id) THEN RAISE EXCEPTION 'Tentativa cancelada. Inicie uma nova compra.'; END IF;
 SELECT * INTO r FROM public.checkout_reservations WHERE request_id = p_request_id FOR UPDATE;
 IF FOUND THEN
   IF r.request IS DISTINCT FROM v_request THEN RAISE EXCEPTION 'Tentativa já utilizada com outros dados.'; END IF;
   RETURN jsonb_build_object('sale_id',r.sale_id,'state',r.state,'session_id',r.session_id,'payload',r.stripe_payload,'created_at',r.created_at);
 END IF;
 IF p_origin IS NULL OR p_origin !~ '^https://[^/]+$|^http://(localhost|127[.]0[.]0[.]1)(:[0-9]+)?$' THEN RAISE EXCEPTION 'Origem inválida.'; END IF;
 IF COALESCE(p_customer->>'delivery_method','delivery') NOT IN ('delivery','pickup') THEN RAISE EXCEPTION 'Forma de entrega inválida.'; END IF;
 IF COALESCE(p_customer->>'delivery_method','delivery') = 'delivery' AND (p_customer->>'estado' IS NULL OR p_customer->>'estado' NOT IN ('AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO')) THEN RAISE EXCEPTION 'Estado inválido.'; END IF;
 IF COALESCE(p_customer->>'nome','') = '' OR COALESCE(p_customer->>'email','') = '' THEN RAISE EXCEPTION 'Contato inválido.'; END IF;
 IF p_actor_id IS NOT NULL THEN
   IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id=p_actor_id AND email_confirmed_at IS NOT NULL AND lower(email)=p_customer->>'email') THEN RAISE EXCEPTION 'Identidade inválida.'; END IF;
   INSERT INTO public.clients(full_name,email,phone) VALUES(p_customer->>'nome',p_customer->>'email',p_customer->>'telefone') ON CONFLICT(email) DO NOTHING;
   SELECT id INTO v_client FROM public.clients WHERE email=p_customer->>'email';
 END IF;
 IF COALESCE(p_customer->>'delivery_method','delivery') = 'pickup' THEN
   v_shipping := 0;
 ELSE
   SELECT cost INTO v_shipping FROM public.shipping_rates
   WHERE state IN (p_customer->>'estado','*') ORDER BY (state=p_customer->>'estado') DESC LIMIT 1 FOR SHARE;
 END IF;
 IF v_shipping IS NULL OR v_shipping < 0 OR v_shipping::text IN ('NaN','Infinity','-Infinity') THEN RAISE EXCEPTION 'Frete indisponível.'; END IF;
 v_shipping := round(v_shipping*100);
 IF (SELECT count(DISTINCT value->>'id') FROM jsonb_array_elements(v_items)) <> jsonb_array_length(v_items) THEN RAISE EXCEPTION 'Produtos duplicados.'; END IF;
 -- Ordem consistente de bloqueio evita deadlocks entre carrinhos invertidos.
 FOR v_item IN SELECT value FROM jsonb_array_elements(v_items) LOOP
   IF COALESCE(v_item->>'quantity','') !~ '^[1-9][0-9]*$' THEN RAISE EXCEPTION 'Quantidade inválida.'; END IF;
   v_qty := (v_item->>'quantity')::integer;
   SELECT * INTO p FROM public.products WHERE id=(v_item->>'id')::uuid FOR UPDATE;
   IF NOT FOUND OR p.show_on_site IS NOT TRUE OR p.is_insumo IS TRUE OR p.is_preorder IS TRUE THEN RAISE EXCEPTION 'Produto indisponível.'; END IF;
   IF COALESCE(p.stock,0) < v_qty THEN RAISE EXCEPTION 'Estoque insuficiente. Atualize o carrinho.'; END IF;
   v_price := round(p.price*100); v_cost := round(COALESCE(p.cost,0)*100);
   IF v_price IS NULL OR v_price <= 0 OR v_price::text IN ('NaN','Infinity','-Infinity') OR p.cost < 0 OR v_cost < 0 OR v_cost::text IN ('NaN','Infinity','-Infinity') THEN RAISE EXCEPTION 'Preço inválido.'; END IF;
   IF round((v_item->>'price')::numeric*100) IS DISTINCT FROM v_price THEN RAISE EXCEPTION 'O preço mudou. Atualize o carrinho.'; END IF;
   v_total := v_total + v_price*v_qty; v_total_cost := v_total_cost + v_cost*v_qty;
   v_lines := v_lines || jsonb_build_array(jsonb_build_object('price_data',jsonb_build_object('currency','brl','product_data',jsonb_build_object('name',p.nome),'unit_amount',v_price),'quantity',v_qty));
 END LOOP;
 IF v_total+v_shipping > 99999999 OR v_total_cost > 9007199254740991 THEN RAISE EXCEPTION 'Total inválido.'; END IF;
 INSERT INTO public.sales(client_id,client_name,payment_method,total_amount,total_cost,shipping_cost,shipping_address,status,stock_deducted,checkout_managed)
 VALUES(v_client,p_customer->>'nome','Stripe',(v_total+v_shipping)/100,v_total_cost/100,v_shipping/100,p_customer,'Pendente',true,true) RETURNING id INTO v_sale;
 FOR v_item IN SELECT value FROM jsonb_array_elements(v_items) LOOP
   SELECT * INTO p FROM public.products WHERE id=(v_item->>'id')::uuid;
   v_qty := (v_item->>'quantity')::integer;
   INSERT INTO public.sale_items(sale_id,product_id,quantity,unit_price,unit_cost) VALUES(v_sale,p.id,v_qty,round(p.price*100)/100,round(COALESCE(p.cost,0)*100)/100);
   UPDATE public.products SET stock=stock-v_qty WHERE id=p.id;
   INSERT INTO public.inventory_logs(product_id,quantity_changed,change_type,reason,new_stock_total)
   VALUES(p.id,-v_qty,'Venda no Site','Reserva do pedido #'||v_sale,p.stock-v_qty);
 END LOOP;
 IF v_shipping > 0 THEN v_lines := v_lines || jsonb_build_array(jsonb_build_object('price_data',jsonb_build_object('currency','brl','product_data',jsonb_build_object('name','Frete'),'unit_amount',v_shipping),'quantity',1)); END IF;
 v_payload := jsonb_build_object('payment_method_types',jsonb_build_array('card','pix'),'line_items',v_lines,'mode','payment','customer_email',p_customer->>'email',
   'success_url',p_origin||'/pagamento-sucesso?session_id={CHECKOUT_SESSION_ID}', 'cancel_url',p_origin||'/checkout',
   'metadata',jsonb_build_object('saleId',v_sale,'requestId',p_request_id), 'expires_at',floor(extract(epoch FROM now()+interval '1 hour')));
 INSERT INTO public.checkout_reservations(request_id,sale_id,actor_id,request,stripe_payload) VALUES(p_request_id,v_sale,p_actor_id,v_request,v_payload) RETURNING * INTO r;
 RETURN jsonb_build_object('sale_id',r.sale_id,'state',r.state,'session_id',r.session_id,'payload',r.stripe_payload,'created_at',r.created_at);
END $$;

COMMIT;
