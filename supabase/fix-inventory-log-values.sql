-- ============================================================================
-- Camélia Handcraft — corrige change_type gravado fora do CHECK constraint
-- ============================================================================
-- inventory_logs_change_type_check só aceita:
--   'Entrada', 'Saída Manual', 'Ajuste / Avária', 'Venda no Site'
--
-- handle_inventory_adjustment gravava 'ENTRADA'/'SAIDA' (maiúsculo, sem
-- acento) — nunca bateu com a restrição, então todo ajuste manual de estoque
-- falhava silenciosamente (a função captura o próprio erro e devolve
-- {success:false}). process_sale gravava 'Saída Venda', também fora da
-- lista, quebrando "Nova Venda Manual" do mesmo jeito.
--
-- Rode no SQL Editor do Supabase como transação única.
-- ============================================================================

BEGIN;

CREATE OR REPLACE FUNCTION public.handle_inventory_adjustment(
  p_product_id uuid, p_quantity integer, p_type text, p_notes text DEFAULT ''::text
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_current_stock INTEGER;
  v_new_stock INTEGER;
  v_change_type TEXT;
BEGIN
  IF COALESCE(public.current_admin_level(), 0) < 2 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Não autorizado.');
  END IF;

  SELECT stock INTO v_current_stock FROM public.products WHERE id = p_product_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Produto não encontrado.');
  END IF;

  IF p_type = 'ENTRADA' THEN
    v_change_type := 'Entrada';
    UPDATE public.products SET stock = COALESCE(stock, 0) + p_quantity
    WHERE id = p_product_id RETURNING stock INTO v_new_stock;
  ELSIF p_type = 'SAIDA' THEN
    v_change_type := 'Saída Manual';
    IF v_current_stock < p_quantity THEN
      RETURN jsonb_build_object('success', false, 'error', 'Estoque insuficiente para esta saída.');
    END IF;
    UPDATE public.products SET stock = COALESCE(stock, 0) - p_quantity
    WHERE id = p_product_id RETURNING stock INTO v_new_stock;
  ELSE
    RETURN jsonb_build_object('success', false, 'error', 'Tipo inválido. Use ENTRADA ou SAIDA.');
  END IF;

  INSERT INTO public.inventory_logs (
    product_id, quantity_changed, change_type, reason, new_stock_total, created_at
  ) VALUES (
    p_product_id, CASE WHEN p_type = 'SAIDA' THEN -p_quantity ELSE p_quantity END,
    v_change_type, p_notes, v_new_stock, NOW()
  );

  RETURN jsonb_build_object('success', true, 'new_stock', v_new_stock, 'message', 'Ajuste realizado com sucesso.');

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$function$;

REVOKE ALL ON FUNCTION public.handle_inventory_adjustment(uuid, integer, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.handle_inventory_adjustment(uuid, integer, text, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.process_sale(sale_data jsonb, items_data jsonb)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_sale_id UUID;
  v_stock INTEGER;
  v_product_id UUID;
  v_qty INTEGER;
  item JSONB;
BEGIN
  IF COALESCE(public.current_admin_level(), 0) < 1 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Não autorizado.');
  END IF;

  INSERT INTO public.sales (
    client_id, client_name, payment_method, total_amount, total_cost,
    discount, shipping_cost, status, created_at
  ) VALUES (
    NULLIF((sale_data->>'client_id'), '')::UUID,
    (sale_data->>'client_name'),
    (sale_data->>'payment_method'),
    (sale_data->>'total_amount')::NUMERIC,
    (sale_data->>'total_cost')::NUMERIC,
    COALESCE((sale_data->>'discount')::NUMERIC, 0),
    COALESCE((sale_data->>'shipping_cost')::NUMERIC, 0),
    COALESCE((sale_data->>'status'), 'Paga'),
    COALESCE((sale_data->>'created_at')::TIMESTAMPTZ, NOW())
  ) RETURNING id INTO v_sale_id;

  FOR item IN SELECT * FROM jsonb_array_elements(items_data)
  LOOP
    v_product_id := (item->>'product_id')::UUID;
    v_qty := (item->>'quantity')::INTEGER;

    SELECT stock INTO v_stock FROM public.products WHERE id = v_product_id FOR UPDATE;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Produto % não encontrado.', v_product_id;
    END IF;
    IF COALESCE(v_stock, 0) < v_qty THEN
      RAISE EXCEPTION 'Estoque insuficiente para o produto %.', v_product_id;
    END IF;

    INSERT INTO public.sale_items (sale_id, product_id, quantity, unit_price, unit_cost)
    VALUES (v_sale_id, v_product_id, v_qty, (item->>'unit_price')::NUMERIC, (item->>'unit_cost')::NUMERIC);

    UPDATE public.products SET stock = stock - v_qty WHERE id = v_product_id;

    -- 'Saída Manual' é o valor da lista permitida (inventory_logs_change_type_check)
    -- mais próximo de uma venda registrada manualmente; o motivo abaixo
    -- distingue de um ajuste de estoque comum no histórico.
    INSERT INTO public.inventory_logs (
      product_id, change_type, quantity_changed, new_stock_total, reason, created_at
    )
    SELECT v_product_id, 'Saída Manual', -v_qty, p.stock, 'Venda manual vinculada ID: ' || v_sale_id, NOW()
    FROM public.products p WHERE p.id = v_product_id;
  END LOOP;

  RETURN jsonb_build_object(
    'success', true, 'message', 'Venda e estoque sincronizados!',
    'id', v_sale_id, 'sale_id', v_sale_id
  );

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$function$;

REVOKE ALL ON FUNCTION public.process_sale(jsonb, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.process_sale(jsonb, jsonb) TO authenticated;

COMMIT;
