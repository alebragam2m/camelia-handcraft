-- ============================================================================
-- Camélia Handcraft — ESTADO ATUAL CONSOLIDADO (RLS, funções, triggers)
-- ============================================================================
-- Este arquivo substitui a necessidade de rodar os SQLs incrementais em
-- ordem específica. Ele reflete o estado final e correto de cada policy,
-- função, trigger e coluna, reunidos de:
--   fix-rls.sql, add-signup-and-saved-cards.sql, fix-inventory-log-values.sql,
--   fix-financial-bridge.sql, fix-financial-category.sql,
--   fix-transaction-type-enum.sql, fix-stock-restore-on-delete.sql,
--   fix-client-order-history.sql, fix-sale-cancellation.sql,
--   fix-process-sale-stock-deducted.sql, fix-stock-deducted-column-guard.sql
--
-- Fonte consolidada em evolução. Não reexecutar os SQLs históricos por cima.
-- As seções de ajuste manual e reservas foram testadas/reaplicadas em fixtures
-- locais; isso não certifica instalação limpa nem paridade com produção.
-- Antes de aplicar: auditoria do ambiente real, backup e homologação coordenada
-- com as APIs. Ver docs/EXECUCAO-RESERVA-CHECKOUT.md.
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1. Helper de nível de acesso
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.current_admin_level()
RETURNS integer
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT access_level FROM public.admin_users
  WHERE auth_user_id = auth.uid() AND is_active = true
  LIMIT 1
$$;
GRANT EXECUTE ON FUNCTION public.current_admin_level() TO authenticated;

-- ----------------------------------------------------------------------------
-- 2. products + storefront_products (catálogo público)
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Admin pode atualizar produtos" ON public.products;
DROP POLICY IF EXISTS "Admin pode deletar produtos" ON public.products;
DROP POLICY IF EXISTS "Admin pode inserir produtos" ON public.products;
DROP POLICY IF EXISTS "Allow public read-only" ON public.products;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.products;
DROP POLICY IF EXISTS "Leitura pública de produtos" ON public.products;
DROP POLICY IF EXISTS products_authenticated_write ON public.products;
DROP POLICY IF EXISTS products_delete ON public.products;
DROP POLICY IF EXISTS products_insert ON public.products;
DROP POLICY IF EXISTS products_public_read ON public.products;
DROP POLICY IF EXISTS products_public_read_final ON public.products;
DROP POLICY IF EXISTS products_select ON public.products;
DROP POLICY IF EXISTS products_update ON public.products;
DROP POLICY IF EXISTS products_staff_select ON public.products;
DROP POLICY IF EXISTS products_staff_insert ON public.products;
DROP POLICY IF EXISTS products_staff_update ON public.products;
DROP POLICY IF EXISTS products_staff_delete ON public.products;

CREATE POLICY products_staff_select ON public.products FOR SELECT TO authenticated
  USING (COALESCE(public.current_admin_level(), 0) >= 1);
CREATE POLICY products_staff_insert ON public.products FOR INSERT TO authenticated
  WITH CHECK (COALESCE(public.current_admin_level(), 0) >= 2);
CREATE POLICY products_staff_update ON public.products FOR UPDATE TO authenticated
  USING (COALESCE(public.current_admin_level(), 0) >= 2)
  WITH CHECK (COALESCE(public.current_admin_level(), 0) >= 2);
CREATE POLICY products_staff_delete ON public.products FOR DELETE TO authenticated
  USING (COALESCE(public.current_admin_level(), 0) >= 4);

DROP VIEW IF EXISTS public.storefront_products;
CREATE VIEW public.storefront_products AS
SELECT id, nome, price, stock, category, colecao, description,
       image_url, image_2, image_3, image_4,
       show_on_site, is_preorder, is_insumo, measure_cm, weight_kg
FROM public.products
WHERE show_on_site = true AND is_insumo IS NOT TRUE;
GRANT SELECT ON public.storefront_products TO anon, authenticated;

-- ----------------------------------------------------------------------------
-- 3. clients
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS clients_authenticated_select ON public.clients;
DROP POLICY IF EXISTS clients_delete ON public.clients;
DROP POLICY IF EXISTS clients_insert ON public.clients;
DROP POLICY IF EXISTS clients_insert_authenticated ON public.clients;
DROP POLICY IF EXISTS clients_select ON public.clients;
DROP POLICY IF EXISTS clients_update ON public.clients;
DROP POLICY IF EXISTS clients_staff_select ON public.clients;
DROP POLICY IF EXISTS clients_staff_insert ON public.clients;
DROP POLICY IF EXISTS clients_staff_update ON public.clients;
DROP POLICY IF EXISTS clients_staff_delete ON public.clients;

CREATE POLICY clients_staff_select ON public.clients FOR SELECT TO authenticated
  USING (COALESCE(public.current_admin_level(), 0) >= 1 OR email = auth.email());
CREATE POLICY clients_staff_insert ON public.clients FOR INSERT TO authenticated
  WITH CHECK (COALESCE(public.current_admin_level(), 0) >= 1);
CREATE POLICY clients_staff_update ON public.clients FOR UPDATE TO authenticated
  USING (COALESCE(public.current_admin_level(), 0) >= 1)
  WITH CHECK (COALESCE(public.current_admin_level(), 0) >= 1);
CREATE POLICY clients_staff_delete ON public.clients FOR DELETE TO authenticated
  USING (COALESCE(public.current_admin_level(), 0) >= 3);

ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS stripe_customer_id text;

-- ----------------------------------------------------------------------------
-- 4. sales / sale_items
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS sales_authenticated_all ON public.sales;
DROP POLICY IF EXISTS sales_delete ON public.sales;
DROP POLICY IF EXISTS sales_insert ON public.sales;
DROP POLICY IF EXISTS sales_select ON public.sales;
DROP POLICY IF EXISTS sales_update ON public.sales;
DROP POLICY IF EXISTS sales_staff_select ON public.sales;
DROP POLICY IF EXISTS sales_self_select ON public.sales;
DROP POLICY IF EXISTS sales_staff_insert ON public.sales;
DROP POLICY IF EXISTS sales_staff_update ON public.sales;
DROP POLICY IF EXISTS sales_staff_delete ON public.sales;

CREATE POLICY sales_staff_select ON public.sales FOR SELECT TO authenticated
  USING (COALESCE(public.current_admin_level(), 0) >= 1);
CREATE POLICY sales_self_select ON public.sales FOR SELECT TO authenticated
  USING (client_id IN (SELECT id FROM public.clients WHERE email = auth.email()));
CREATE POLICY sales_staff_insert ON public.sales FOR INSERT TO authenticated
  WITH CHECK (COALESCE(public.current_admin_level(), 0) >= 1);
CREATE POLICY sales_staff_update ON public.sales FOR UPDATE TO authenticated
  USING (COALESCE(public.current_admin_level(), 0) >= 1)
  WITH CHECK (COALESCE(public.current_admin_level(), 0) >= 1);
CREATE POLICY sales_staff_delete ON public.sales FOR DELETE TO authenticated
  USING (COALESCE(public.current_admin_level(), 0) >= 4);

DROP POLICY IF EXISTS sale_items_authenticated_all ON public.sale_items;
DROP POLICY IF EXISTS sale_items_delete ON public.sale_items;
DROP POLICY IF EXISTS sale_items_insert ON public.sale_items;
DROP POLICY IF EXISTS sale_items_select ON public.sale_items;
DROP POLICY IF EXISTS sale_items_update ON public.sale_items;
DROP POLICY IF EXISTS sale_items_staff_select ON public.sale_items;
DROP POLICY IF EXISTS sale_items_self_select ON public.sale_items;
DROP POLICY IF EXISTS sale_items_staff_insert ON public.sale_items;
DROP POLICY IF EXISTS sale_items_staff_delete ON public.sale_items;

CREATE POLICY sale_items_staff_select ON public.sale_items FOR SELECT TO authenticated
  USING (COALESCE(public.current_admin_level(), 0) >= 1);
CREATE POLICY sale_items_self_select ON public.sale_items FOR SELECT TO authenticated
  USING (sale_id IN (
    SELECT id FROM public.sales WHERE client_id IN (
      SELECT id FROM public.clients WHERE email = auth.email()
    )
  ));
CREATE POLICY sale_items_staff_insert ON public.sale_items FOR INSERT TO authenticated
  WITH CHECK (COALESCE(public.current_admin_level(), 0) >= 1);
CREATE POLICY sale_items_staff_delete ON public.sale_items FOR DELETE TO authenticated
  USING (COALESCE(public.current_admin_level(), 0) >= 4);

ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS shipping_address jsonb;
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS stock_deducted boolean NOT NULL DEFAULT false;
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS stock_conflict boolean NOT NULL DEFAULT false;
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS fulfillment_status text NOT NULL DEFAULT 'Aguardando produção';
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS tracking_code text;

-- ----------------------------------------------------------------------------
-- 5. financial_transactions (nível >=3) + suppliers (nível >=2)
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS financial_transactions_delete ON public.financial_transactions;
DROP POLICY IF EXISTS financial_transactions_insert ON public.financial_transactions;
DROP POLICY IF EXISTS financial_transactions_select ON public.financial_transactions;
DROP POLICY IF EXISTS financial_transactions_update ON public.financial_transactions;
DROP POLICY IF EXISTS financial_transactions_staff_all ON public.financial_transactions;

CREATE POLICY financial_transactions_staff_all ON public.financial_transactions FOR ALL TO authenticated
  USING (COALESCE(public.current_admin_level(), 0) >= 3)
  WITH CHECK (COALESCE(public.current_admin_level(), 0) >= 3);

ALTER TABLE public.financial_transactions ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'Pago';
ALTER TABLE public.financial_transactions ADD COLUMN IF NOT EXISTS payment_date date;
ALTER TABLE public.financial_transactions ADD COLUMN IF NOT EXISTS category text;

DROP POLICY IF EXISTS suppliers_authenticated_all ON public.suppliers;
DROP POLICY IF EXISTS suppliers_delete ON public.suppliers;
DROP POLICY IF EXISTS suppliers_insert ON public.suppliers;
DROP POLICY IF EXISTS suppliers_select ON public.suppliers;
DROP POLICY IF EXISTS suppliers_update ON public.suppliers;
DROP POLICY IF EXISTS suppliers_staff_all ON public.suppliers;

CREATE POLICY suppliers_staff_all ON public.suppliers FOR ALL TO authenticated
  USING (COALESCE(public.current_admin_level(), 0) >= 2)
  WITH CHECK (COALESCE(public.current_admin_level(), 0) >= 2);

ALTER TABLE public.inventory_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS inventory_logs_staff_select ON public.inventory_logs;
DROP POLICY IF EXISTS inventory_logs_staff_insert ON public.inventory_logs;
CREATE POLICY inventory_logs_staff_select ON public.inventory_logs FOR SELECT TO authenticated
  USING (COALESCE(public.current_admin_level(), 0) >= 1);
CREATE POLICY inventory_logs_staff_insert ON public.inventory_logs FOR INSERT TO authenticated
  WITH CHECK (COALESCE(public.current_admin_level(), 0) >= 2);

-- ----------------------------------------------------------------------------
-- 5b. shipping_rates — frete fixo por estado (tabela manual, sem API externa)
-- ----------------------------------------------------------------------------
-- Preço de frete não é dado sensível (equivalente a uma tabela pública de
-- FAQ) — leitura liberada pra anon/authenticated pro Checkout mostrar uma
-- estimativa antes de pagar; escrita só staff nível >=2 (Estoque/Produção).
-- state = '*' é a linha de fallback usada quando o estado do endereço não
-- tem linha própria cadastrada.
CREATE TABLE IF NOT EXISTS public.shipping_rates (
  state text UNIQUE NOT NULL,
  label text,
  cost numeric NOT NULL,
  estimated_days integer,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.shipping_rates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS shipping_rates_public_select ON public.shipping_rates;
DROP POLICY IF EXISTS shipping_rates_staff_write ON public.shipping_rates;

CREATE POLICY shipping_rates_public_select ON public.shipping_rates FOR SELECT
  TO anon, authenticated USING (true);
CREATE POLICY shipping_rates_staff_write ON public.shipping_rates FOR ALL TO authenticated
  USING (COALESCE(public.current_admin_level(), 0) >= 2)
  WITH CHECK (COALESCE(public.current_admin_level(), 0) >= 2);

-- ----------------------------------------------------------------------------
-- 6. Tabelas mortas (não referenciadas em src/): fecha, sem substituto
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS stock_movements_delete ON public.stock_movements;
DROP POLICY IF EXISTS stock_movements_insert ON public.stock_movements;
DROP POLICY IF EXISTS stock_movements_select ON public.stock_movements;
DROP POLICY IF EXISTS stock_movements_update ON public.stock_movements;

DROP POLICY IF EXISTS profiles_delete ON public.profiles;
DROP POLICY IF EXISTS profiles_insert ON public.profiles;
DROP POLICY IF EXISTS profiles_select ON public.profiles;
DROP POLICY IF EXISTS profiles_update ON public.profiles;

DROP POLICY IF EXISTS invites_delete ON public.invites;
DROP POLICY IF EXISTS invites_insert ON public.invites;
DROP POLICY IF EXISTS invites_select ON public.invites;
DROP POLICY IF EXISTS invites_update ON public.invites;
DROP POLICY IF EXISTS invites_staff_all ON public.invites;

CREATE POLICY invites_staff_all ON public.invites FOR ALL TO authenticated
  USING (COALESCE(public.current_admin_level(), 0) >= 4)
  WITH CHECK (COALESCE(public.current_admin_level(), 0) >= 4);

-- ----------------------------------------------------------------------------
-- 7. admin_users
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS admin_users_select_authenticated ON public.admin_users;
DROP POLICY IF EXISTS admin_users_self_select ON public.admin_users;
DROP POLICY IF EXISTS admin_users_staff_select ON public.admin_users;
DROP POLICY IF EXISTS admin_users_owner_update ON public.admin_users;

CREATE POLICY admin_users_self_select ON public.admin_users FOR SELECT TO authenticated
  USING (auth_user_id = auth.uid());
CREATE POLICY admin_users_staff_select ON public.admin_users FOR SELECT TO authenticated
  USING (COALESCE(public.current_admin_level(), 0) >= 4);
CREATE POLICY admin_users_owner_update ON public.admin_users FOR UPDATE TO authenticated
  USING (COALESCE(public.current_admin_level(), 0) >= 4)
  WITH CHECK (COALESCE(public.current_admin_level(), 0) >= 4);
-- admin_users_insert_service / admin_users_update_service (role service_role) não são tocadas.

-- ----------------------------------------------------------------------------
-- 8. RPCs de auto-atendimento do cliente
-- ----------------------------------------------------------------------------
-- DROP necessário quando o RETURNS TABLE muda de forma (Postgres não deixa
-- CREATE OR REPLACE trocar o formato das colunas de retorno).
DROP FUNCTION IF EXISTS public.get_sale_by_session(text);
CREATE OR REPLACE FUNCTION public.get_sale_by_session(p_session_id text)
RETURNS TABLE (
  id uuid, status text, total_amount numeric, shipping_cost numeric,
  fulfillment_status text, tracking_code text, created_at timestamptz,
  shipping_address jsonb, client_full_name text, client_email text
)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT s.id, s.status, s.total_amount, s.shipping_cost,
         s.fulfillment_status, s.tracking_code, s.created_at, s.shipping_address,
         c.full_name, c.email
  FROM public.sales s
  LEFT JOIN public.clients c ON c.id = s.client_id
  WHERE s.stripe_session_id = p_session_id
  LIMIT 1
$$;
GRANT EXECUTE ON FUNCTION public.get_sale_by_session(text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.update_own_client_profile(
  p_full_name text DEFAULT NULL, p_phone text DEFAULT NULL, p_telefone text DEFAULT NULL,
  p_cep text DEFAULT NULL, p_address text DEFAULT NULL, p_address_number text DEFAULT NULL,
  p_neighborhood text DEFAULT NULL, p_city text DEFAULT NULL, p_state text DEFAULT NULL
)
RETURNS void
LANGUAGE sql SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.clients SET
    full_name = COALESCE(p_full_name, full_name),
    phone = COALESCE(p_phone, phone),
    telefone = COALESCE(p_telefone, telefone),
    cep = COALESCE(p_cep, cep),
    address = COALESCE(p_address, address),
    address_number = COALESCE(p_address_number, address_number),
    neighborhood = COALESCE(p_neighborhood, neighborhood),
    city = COALESCE(p_city, city),
    state = COALESCE(p_state, state)
  WHERE email = auth.email();
$$;
GRANT EXECUTE ON FUNCTION public.update_own_client_profile(text,text,text,text,text,text,text,text,text) TO authenticated;

CREATE OR REPLACE FUNCTION public.ensure_own_client_profile(
  p_full_name text DEFAULT NULL, p_phone text DEFAULT NULL
)
RETURNS void
LANGUAGE sql SECURITY DEFINER
SET search_path = public
AS $$
  INSERT INTO public.clients (full_name, email, phone)
  VALUES (COALESCE(p_full_name, ''), auth.email(), p_phone)
  ON CONFLICT (email) DO NOTHING;
$$;
GRANT EXECUTE ON FUNCTION public.ensure_own_client_profile(text, text) TO authenticated;

DROP FUNCTION IF EXISTS public.get_my_orders();
CREATE OR REPLACE FUNCTION public.get_my_orders()
RETURNS TABLE (
  id uuid, status text, total_amount numeric, shipping_cost numeric,
  fulfillment_status text, tracking_code text, payment_method text,
  created_at timestamptz, shipping_address jsonb, items jsonb
)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT s.id, s.status, s.total_amount, s.shipping_cost,
         s.fulfillment_status, s.tracking_code, s.payment_method,
         s.created_at, s.shipping_address,
         COALESCE(jsonb_agg(jsonb_build_object(
           'id', si.id, 'quantity', si.quantity, 'unit_price', si.unit_price,
           'nome', p.nome, 'image_url', p.image_url
         ) ORDER BY si.id) FILTER (WHERE si.id IS NOT NULL), '[]'::jsonb) AS items
  FROM public.sales s
  LEFT JOIN public.sale_items si ON si.sale_id = s.id
  LEFT JOIN public.products p ON p.id = si.product_id
  WHERE s.client_id IN (SELECT id FROM public.clients WHERE email = auth.email())
  GROUP BY s.id
  ORDER BY s.created_at DESC
$$;
GRANT EXECUTE ON FUNCTION public.get_my_orders() TO authenticated;

-- ----------------------------------------------------------------------------
-- 9. Trigger de auto-admin — removido (admins só via painel do Supabase)
-- ----------------------------------------------------------------------------
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_admin_user();

-- ----------------------------------------------------------------------------
-- 10. Storage
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS product_images_public_read ON storage.objects;
DROP POLICY IF EXISTS product_images_staff_insert ON storage.objects;
DROP POLICY IF EXISTS product_images_staff_update ON storage.objects;
DROP POLICY IF EXISTS product_images_staff_delete ON storage.objects;
CREATE POLICY product_images_public_read ON storage.objects FOR SELECT
  TO anon, authenticated USING (bucket_id = 'product-images');
CREATE POLICY product_images_staff_insert ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'product-images' AND COALESCE(public.current_admin_level(), 0) >= 2);
CREATE POLICY product_images_staff_update ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'product-images' AND COALESCE(public.current_admin_level(), 0) >= 2)
  WITH CHECK (bucket_id = 'product-images' AND COALESCE(public.current_admin_level(), 0) >= 2);
CREATE POLICY product_images_staff_delete ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'product-images' AND COALESCE(public.current_admin_level(), 0) >= 2);
-- Buckets 'products' e 'camelia-images' consolidados em 'product-images'
-- (único bucket usado pelo upload atual, productService.uploadImage). Todos
-- os arquivos já foram migrados para product-images/migrated/<bucket antigo>/...
-- e as URLs das linhas de products já apontam pro novo caminho — ver
-- migração de 2026-10-01. As policies de escrita abaixo são removidas para
-- impedir novos uploads nos buckets antigos; a leitura pública permanece
-- (os arquivos originais ainda não foram apagados dos buckets antigos).
DROP POLICY IF EXISTS "Admin Upload Products" ON storage.objects;
DROP POLICY IF EXISTS "Admin Update Products" ON storage.objects;
DROP POLICY IF EXISTS "Auth Insert" ON storage.objects;
DROP POLICY IF EXISTS "Auth Update" ON storage.objects;
-- product-images e as policies só-leitura já estão corretas — não tocadas.

-- ----------------------------------------------------------------------------
-- 11. Funções de negócio — estoque e vendas
-- ----------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.handle_inventory_adjustment(bigint, integer, text, text);

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

  IF p_quantity IS NULL OR p_quantity <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Quantidade deve ser um inteiro positivo.');
  END IF;
  IF p_type IS NULL OR p_type NOT IN ('ENTRADA', 'SAIDA') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Tipo inválido. Use ENTRADA ou SAIDA.');
  END IF;

  -- Serializa leitura, validação, alteração e log para o mesmo produto.
  SELECT COALESCE(stock, 0) INTO v_current_stock
  FROM public.products WHERE id = p_product_id FOR UPDATE;
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

-- Venda da loja (checkout → Stripe → webhook marca 'Paga'/'Pago'): baixa
-- estoque, loga, cria lançamento de Receita e marca stock_deducted = true.
CREATE OR REPLACE FUNCTION public.handle_stock_on_paid_sale()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $function$
DECLARE item RECORD;
BEGIN
    IF NEW.checkout_managed IS TRUE THEN RETURN NEW; END IF;
    IF (NEW.status IN ('Paga', 'Pago')) AND (OLD.status IS NULL OR OLD.status NOT IN ('Paga', 'Pago')) THEN
        FOR item IN SELECT product_id, quantity FROM public.sale_items WHERE sale_id = NEW.id
        LOOP
            UPDATE public.products SET stock = GREATEST(0, stock - item.quantity) WHERE id = item.product_id;
            INSERT INTO public.inventory_logs (product_id, change_type, quantity_changed, new_stock_total, reason)
            SELECT item.product_id, 'Venda no Site', -item.quantity, p.stock, 'Venda #' || NEW.id || ' confirmada via Stripe'
            FROM public.products p WHERE p.id = item.product_id;
        END LOOP;

        INSERT INTO public.financial_transactions (
          type, description, amount, transaction_date, status, payment_date, related_sale_id, due_date
        ) VALUES (
          'receita', 'Venda #' || NEW.id || COALESCE(' - ' || NEW.client_name, ''),
          NEW.total_amount, NOW(), 'Pago', CURRENT_DATE, NEW.id, CURRENT_DATE
        );

        UPDATE public.sales SET stock_deducted = true WHERE id = NEW.id;
    END IF;
    RETURN NEW;
END;
$function$;

-- Venda manual: baixa estoque incondicionalmente (pago ou pendente),
-- registra Receita só quando status = 'completed', stock_deducted = true
-- sempre (evita a mesma regressão que já aconteceu uma vez nesta função).
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
  v_status TEXT;
  item JSONB;
BEGIN
  IF COALESCE(public.current_admin_level(), 0) < 1 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Não autorizado.');
  END IF;

  v_status := COALESCE(sale_data->>'status', 'completed');

  INSERT INTO public.sales (
    client_id, client_name, payment_method, total_amount, total_cost,
    discount, shipping_cost, status, stock_deducted, created_at
  ) VALUES (
    NULLIF((sale_data->>'client_id'), '')::UUID,
    (sale_data->>'client_name'),
    (sale_data->>'payment_method'),
    (sale_data->>'total_amount')::NUMERIC,
    (sale_data->>'total_cost')::NUMERIC,
    COALESCE((sale_data->>'discount')::NUMERIC, 0),
    COALESCE((sale_data->>'shipping_cost')::NUMERIC, 0),
    v_status,
    true,
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

    INSERT INTO public.inventory_logs (
      product_id, change_type, quantity_changed, new_stock_total, reason, created_at
    )
    SELECT v_product_id, 'Saída Manual', -v_qty, p.stock, 'Venda manual vinculada ID: ' || v_sale_id, NOW()
    FROM public.products p WHERE p.id = v_product_id;
  END LOOP;

  IF v_status = 'completed' THEN
    INSERT INTO public.financial_transactions (
      type, description, amount, transaction_date, status, payment_date, related_sale_id, due_date
    ) VALUES (
      'receita', 'Venda manual #' || v_sale_id || COALESCE(' - ' || (sale_data->>'client_name'), ''),
      (sale_data->>'total_amount')::NUMERIC, NOW(), 'Pago', CURRENT_DATE, v_sale_id, CURRENT_DATE
    );
  END IF;

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

-- Devolve estoque ao excluir uma venda, só se stock_deducted = true.
CREATE OR REPLACE FUNCTION public.restore_stock_on_sale_item_delete()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE v_deducted boolean;
BEGIN
  SELECT stock_deducted INTO v_deducted FROM public.sales WHERE id = OLD.sale_id AND checkout_managed IS NOT TRUE;

  IF COALESCE(v_deducted, false) THEN
    UPDATE public.products SET stock = stock + OLD.quantity WHERE id = OLD.product_id;
    INSERT INTO public.inventory_logs (product_id, change_type, quantity_changed, new_stock_total, reason)
    SELECT OLD.product_id, 'Entrada', OLD.quantity, p.stock, 'Estorno automático — venda #' || OLD.sale_id || ' excluída'
    FROM public.products p WHERE p.id = OLD.product_id;
  END IF;

  RETURN OLD;
END;
$function$;

DROP TRIGGER IF EXISTS trigger_restore_stock_on_sale_item_delete ON public.sale_items;
CREATE TRIGGER trigger_restore_stock_on_sale_item_delete
BEFORE DELETE ON public.sale_items
FOR EACH ROW EXECUTE FUNCTION public.restore_stock_on_sale_item_delete();

-- Cancela uma venda (mantém histórico): devolve estoque se stock_deducted,
-- remove o lançamento financeiro vinculado. Sem reembolso na Stripe.
CREATE OR REPLACE FUNCTION public.handle_sale_cancellation()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE item RECORD;
BEGIN
  IF NEW.checkout_managed IS TRUE THEN RETURN NEW; END IF;
  IF NEW.status = 'Cancelada' AND (OLD.status IS DISTINCT FROM 'Cancelada') THEN
    IF COALESCE(OLD.stock_deducted, false) THEN
      FOR item IN SELECT product_id, quantity FROM public.sale_items WHERE sale_id = NEW.id
      LOOP
        UPDATE public.products SET stock = stock + item.quantity WHERE id = item.product_id;
        INSERT INTO public.inventory_logs (product_id, change_type, quantity_changed, new_stock_total, reason)
        SELECT item.product_id, 'Entrada', item.quantity, p.stock, 'Estorno — venda #' || NEW.id || ' cancelada'
        FROM public.products p WHERE p.id = item.product_id;
      END LOOP;
      NEW.stock_deducted := false;
    END IF;

    DELETE FROM public.financial_transactions WHERE related_sale_id = NEW.id;
  END IF;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trigger_handle_sale_cancellation ON public.sales;
CREATE TRIGGER trigger_handle_sale_cancellation
BEFORE UPDATE ON public.sales
FOR EACH ROW EXECUTE FUNCTION public.handle_sale_cancellation();

-- ----------------------------------------------------------------------------
-- 12. Endurecimento opcional
-- ----------------------------------------------------------------------------
REVOKE ALL ON public.clients, public.sales, public.sale_items,
  public.financial_transactions, public.suppliers, public.stock_movements,
  public.invites, public.profiles FROM anon;

-- CHECKOUT_RESERVATIONS_BEGIN
-- Somente o servidor acessa pedidos idempotentes e transições Stripe.
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS checkout_managed boolean NOT NULL DEFAULT false;
CREATE TABLE IF NOT EXISTS public.checkout_reservations (
 request_id uuid PRIMARY KEY,
 sale_id uuid NOT NULL UNIQUE REFERENCES public.sales(id) ON DELETE RESTRICT,
 actor_id uuid,
 request jsonb NOT NULL,
 stripe_payload jsonb NOT NULL,
 state text NOT NULL DEFAULT 'reserved' CHECK (state IN ('reserved','paid','expired')),
 session_id text UNIQUE,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.checkout_abandoned_attempts (
 request_id uuid PRIMARY KEY, actor_id uuid, created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.checkout_abandoned_attempts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.checkout_abandoned_attempts FROM PUBLIC,anon,authenticated;
CREATE TABLE IF NOT EXISTS public.checkout_events (
 event_id text PRIMARY KEY,
 sale_id uuid NOT NULL REFERENCES public.sales(id),
 received_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.checkout_reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checkout_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.checkout_reservations, public.checkout_events FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.checkout_reservations TO service_role;

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

-- Também reconcilia sessões recuperadas após falha entre Stripe e banco.
CREATE OR REPLACE FUNCTION public.apply_checkout_session(p_request_id uuid,p_session jsonb,p_event_id text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE r public.checkout_reservations%ROWTYPE; s public.sales%ROWTYPE; item record; v_state text; v_session text;
BEGIN
 SELECT * INTO r FROM public.checkout_reservations WHERE request_id=p_request_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Reserva não encontrada.'; END IF;
 SELECT * INTO s FROM public.sales WHERE id=r.sale_id FOR UPDATE;
 v_session := p_session->>'id';
 IF v_session IS NULL OR p_session->>'mode' IS DISTINCT FROM 'payment' OR p_session->>'currency' IS DISTINCT FROM 'brl'
 OR p_session#>>'{metadata,saleId}' IS DISTINCT FROM s.id::text OR p_session#>>'{metadata,requestId}' IS DISTINCT FROM r.request_id::text
 OR (p_session->>'amount_total')::numeric IS DISTINCT FROM round(s.total_amount*100)
 OR (r.session_id IS NOT NULL AND r.session_id <> v_session) THEN RAISE EXCEPTION 'Sessão incompatível.'; END IF;
 IF p_event_id IS NOT NULL THEN
   INSERT INTO public.checkout_events(event_id,sale_id) VALUES(p_event_id,s.id) ON CONFLICT DO NOTHING;
   IF NOT FOUND THEN
     IF NOT EXISTS(SELECT 1 FROM public.checkout_events WHERE event_id=p_event_id AND sale_id=s.id) THEN RAISE EXCEPTION 'Evento incompatível.'; END IF;
     IF r.state <> 'reserved' THEN RETURN jsonb_build_object('state',r.state,'duplicate',true); END IF;
   END IF;
 END IF;
 UPDATE public.checkout_reservations SET session_id=v_session WHERE request_id=r.request_id;
 UPDATE public.sales SET stripe_session_id=v_session WHERE id=s.id;
 v_state := r.state;
 IF p_session->>'payment_status' = 'paid' AND p_session->>'status'='complete' THEN
   IF r.state='expired' THEN RAISE EXCEPTION 'Pagamento após liberação exige reconciliação.'; END IF;
   IF r.state='reserved' THEN
     UPDATE public.sales SET status='Paga',payment_intent_id=p_session->>'payment_intent',
       payment_method=CASE p_session->>'payment_method_type' WHEN 'pix' THEN 'Stripe/Pix' WHEN 'card' THEN 'Stripe/Cartão' ELSE 'Stripe' END
     WHERE id=s.id;
     INSERT INTO public.financial_transactions(type,description,amount,transaction_date,status,payment_date,related_sale_id,due_date)
     VALUES('receita','Venda #'||s.id,s.total_amount,now(),'Pago',current_date,s.id,current_date);
     v_state := 'paid';
   END IF;
 ELSIF (p_session->>'status'='expired' OR COALESCE((p_session->>'async_payment_failed')::boolean,false))
   AND p_session->>'payment_status'='unpaid' AND r.state='reserved' THEN
   FOR item IN SELECT product_id,quantity FROM public.sale_items WHERE sale_id=s.id ORDER BY product_id LOOP
     UPDATE public.products SET stock=COALESCE(stock,0)+item.quantity WHERE id=item.product_id;
     INSERT INTO public.inventory_logs(product_id,quantity_changed,change_type,reason,new_stock_total)
     SELECT id,item.quantity,'Entrada','Liberação da reserva #'||s.id,stock FROM public.products WHERE id=item.product_id;
   END LOOP;
   UPDATE public.sales SET status='Cancelada',stock_deducted=false WHERE id=s.id;
   v_state := 'expired';
 END IF;
 UPDATE public.checkout_reservations SET state=v_state WHERE request_id=r.request_id;
 RETURN jsonb_build_object('state',v_state);
END $$;

-- Retomar/cancelar exige a chave aleatória e a mesma identidade autenticada.
CREATE OR REPLACE FUNCTION public.cancel_checkout_attempt(p_request_id uuid,p_actor_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE r public.checkout_reservations%ROWTYPE;
BEGIN
 IF p_request_id IS NULL THEN RAISE EXCEPTION 'Tentativa inválida.'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(p_request_id::text, 0));
 SELECT * INTO r FROM public.checkout_reservations WHERE request_id=p_request_id;
 IF NOT FOUND THEN
   INSERT INTO public.checkout_abandoned_attempts(request_id,actor_id) VALUES(p_request_id,p_actor_id) ON CONFLICT DO NOTHING;
   RETURN NULL;
 END IF;
 IF r.actor_id IS DISTINCT FROM p_actor_id THEN RAISE EXCEPTION 'Tentativa pertence a outra identidade.'; END IF;
 RETURN jsonb_build_object('sale_id',r.sale_id,'state',r.state,'session_id',r.session_id,'payload',r.stripe_payload,'created_at',r.created_at);
END $$;

-- Impede que edições genéricas do painel contornem a máquina de estados.
CREATE OR REPLACE FUNCTION public.guard_checkout_sale() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF TG_OP='DELETE' AND OLD.checkout_managed IS TRUE THEN RAISE EXCEPTION 'Pedido online não pode ser excluído.'; END IF;
 IF current_setting('role',true) IN ('anon','authenticated') THEN
   IF TG_OP='INSERT' AND NEW.checkout_managed IS TRUE THEN RAISE EXCEPTION 'Reserva exige servidor.'; END IF;
   IF TG_OP='UPDATE' AND (OLD.checkout_managed IS TRUE OR NEW.checkout_managed IS TRUE)
     AND (to_jsonb(OLD)-'fulfillment_status'-'tracking_code') IS DISTINCT FROM (to_jsonb(NEW)-'fulfillment_status'-'tracking_code') THEN
     RAISE EXCEPTION 'Pedido online exige transição confirmada pela Stripe.';
   END IF;
 END IF;
 IF TG_OP='DELETE' THEN RETURN OLD; END IF; RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS a_guard_checkout_sale ON public.sales;
CREATE TRIGGER a_guard_checkout_sale BEFORE INSERT OR UPDATE OR DELETE ON public.sales FOR EACH ROW EXECUTE FUNCTION public.guard_checkout_sale();
CREATE OR REPLACE FUNCTION public.guard_checkout_items() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF current_setting('role',true) IN ('anon','authenticated') AND EXISTS (
 SELECT 1 FROM public.sales WHERE checkout_managed IS TRUE AND id IN (
 CASE WHEN TG_OP<>'INSERT' THEN OLD.sale_id END, CASE WHEN TG_OP<>'DELETE' THEN NEW.sale_id END)) THEN RAISE EXCEPTION 'Itens reservados não podem ser alterados pelo painel.'; END IF;
 IF TG_OP='DELETE' THEN RETURN OLD; END IF; RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS a_guard_checkout_items ON public.sale_items;
CREATE TRIGGER a_guard_checkout_items BEFORE INSERT OR UPDATE OR DELETE ON public.sale_items FOR EACH ROW EXECUTE FUNCTION public.guard_checkout_items();
REVOKE ALL ON FUNCTION public.reserve_checkout(uuid,uuid,jsonb,jsonb,text), public.apply_checkout_session(uuid,jsonb,text), public.cancel_checkout_attempt(uuid,uuid),public.guard_checkout_sale(),public.guard_checkout_items() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_checkout(uuid,uuid,jsonb,jsonb,text), public.apply_checkout_session(uuid,jsonb,text),public.cancel_checkout_attempt(uuid,uuid) TO service_role;
CREATE OR REPLACE FUNCTION public.guard_checkout_finance() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF current_setting('role',true) IN ('anon','authenticated') AND EXISTS (
 SELECT 1 FROM public.sales WHERE checkout_managed IS TRUE AND id IN (
 CASE WHEN TG_OP<>'INSERT' THEN OLD.related_sale_id END, CASE WHEN TG_OP<>'DELETE' THEN NEW.related_sale_id END)) THEN RAISE EXCEPTION 'Lançamento de pedido online exige reconciliação.'; END IF;
 IF TG_OP='DELETE' THEN RETURN OLD; END IF; RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS a_guard_checkout_finance ON public.financial_transactions;
CREATE TRIGGER a_guard_checkout_finance BEFORE INSERT OR UPDATE OR DELETE ON public.financial_transactions FOR EACH ROW EXECUTE FUNCTION public.guard_checkout_finance();
REVOKE ALL ON FUNCTION public.guard_checkout_finance() FROM PUBLIC,anon,authenticated;
-- Consolida o gatilho de pagamento antes apenas pressuposto neste arquivo.
DROP TRIGGER IF EXISTS trigger_sync_stock_on_payment ON public.sales;
CREATE TRIGGER trigger_sync_stock_on_payment AFTER UPDATE ON public.sales FOR EACH ROW EXECUTE FUNCTION public.handle_stock_on_paid_sale();

-- CHECKOUT_RESERVATIONS_END

COMMIT;

-- ============================================================================
-- Não alterado: wishlists (já correta), inventory_logs (só authenticated,
-- sem gate de nível — não exploitável por anon hoje).
-- ============================================================================
