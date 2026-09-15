-- ============================================================================
-- Camélia Handcraft — correção de RLS, storage, funções e trigger de admin
-- ============================================================================
-- Gerado a partir da auditoria em supabase/audit-sync.sql (ver
-- supabase/Supabase Snippet Untitled query.csv para os dados brutos).
--
-- PRÉ-REQUISITO: rode este script SOMENTE DEPOIS de publicar as mudanças de
-- código deste mesmo commit (api/create-checkout-session.js, Checkout.jsx,
-- PaymentSuccess.jsx, ClientArea.jsx, useCatalog.js). Rodar antes quebra o
-- checkout de visitante em produção, porque hoje ele grava clients/sales/
-- sale_items direto do navegador com a chave anônima — este script remove
-- essa permissão.
--
-- Rode no SQL Editor do Supabase como uma transação única. Todas as DROP
-- POLICY usam IF EXISTS — seguro reexecutar.
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1. Helper não-recursivo de nível de acesso
-- ----------------------------------------------------------------------------
-- SECURITY DEFINER: quando usada dentro de uma policy da própria admin_users,
-- executa com o dono da função (bypassa RLS internamente), evitando recursão.
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
-- 2. products — remove as 13 policies abertas/redundantes confirmadas na
--    auditoria e substitui por 4 policies só para staff (nível 1-4)
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

CREATE POLICY products_staff_select ON public.products FOR SELECT TO authenticated
  USING (COALESCE(public.current_admin_level(), 0) >= 1);
CREATE POLICY products_staff_insert ON public.products FOR INSERT TO authenticated
  WITH CHECK (COALESCE(public.current_admin_level(), 0) >= 2);
CREATE POLICY products_staff_update ON public.products FOR UPDATE TO authenticated
  USING (COALESCE(public.current_admin_level(), 0) >= 2)
  WITH CHECK (COALESCE(public.current_admin_level(), 0) >= 2);
CREATE POLICY products_staff_delete ON public.products FOR DELETE TO authenticated
  USING (COALESCE(public.current_admin_level(), 0) >= 4);

-- View pública somente-leitura do catálogo (substitui leitura direta de
-- `products` pelo storefront). Colunas espelham PUBLIC_PRODUCT_COLUMNS em
-- src/lib/catalog.js. Não marcar como security_invoker: precisa rodar com o
-- dono da view para contornar o RLS acima, que agora não tem policy pública.
DROP VIEW IF EXISTS public.storefront_products;
CREATE VIEW public.storefront_products AS
SELECT id, nome, price, stock, category, colecao, description,
       image_url, image_2, image_3, image_4,
       show_on_site, is_preorder, is_insumo, measure_cm, weight_kg
FROM public.products
WHERE show_on_site = true AND is_insumo IS NOT TRUE;
GRANT SELECT ON public.storefront_products TO anon, authenticated;

-- ----------------------------------------------------------------------------
-- 3. clients — remove as 6 policies abertas; staff (nível >=1) + auto-leitura
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS clients_authenticated_select ON public.clients;
DROP POLICY IF EXISTS clients_delete ON public.clients;
DROP POLICY IF EXISTS clients_insert ON public.clients;
DROP POLICY IF EXISTS clients_insert_authenticated ON public.clients;
DROP POLICY IF EXISTS clients_select ON public.clients;
DROP POLICY IF EXISTS clients_update ON public.clients;

CREATE POLICY clients_staff_select ON public.clients FOR SELECT TO authenticated
  USING (COALESCE(public.current_admin_level(), 0) >= 1 OR email = auth.email());
CREATE POLICY clients_staff_insert ON public.clients FOR INSERT TO authenticated
  WITH CHECK (COALESCE(public.current_admin_level(), 0) >= 1);
CREATE POLICY clients_staff_update ON public.clients FOR UPDATE TO authenticated
  USING (COALESCE(public.current_admin_level(), 0) >= 1)
  WITH CHECK (COALESCE(public.current_admin_level(), 0) >= 1);
CREATE POLICY clients_staff_delete ON public.clients FOR DELETE TO authenticated
  USING (COALESCE(public.current_admin_level(), 0) >= 3);
-- Sem policy de self-INSERT/UPDATE: checkout grava via service role (bypassa
-- RLS) e a auto-edição de perfil usa update_own_client_profile() (seção 8),
-- que não deixa o cliente setar is_vip/internal_notes em si mesmo.

-- ----------------------------------------------------------------------------
-- 4. sales / sale_items — remove as 10 policies abertas; staff + auto-leitura
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS sales_authenticated_all ON public.sales;
DROP POLICY IF EXISTS sales_delete ON public.sales;
DROP POLICY IF EXISTS sales_insert ON public.sales;
DROP POLICY IF EXISTS sales_select ON public.sales;
DROP POLICY IF EXISTS sales_update ON public.sales;

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
-- Sem policy pública: o checkout passa a criar a venda via service role
-- (api/create-checkout-session.js), que bypassa RLS.

DROP POLICY IF EXISTS sale_items_authenticated_all ON public.sale_items;
DROP POLICY IF EXISTS sale_items_delete ON public.sale_items;
DROP POLICY IF EXISTS sale_items_insert ON public.sale_items;
DROP POLICY IF EXISTS sale_items_select ON public.sale_items;
DROP POLICY IF EXISTS sale_items_update ON public.sale_items;

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

-- Snapshot de endereço por pedido (preço/itens/endereço do momento da compra).
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS shipping_address jsonb;

-- ----------------------------------------------------------------------------
-- 5. financial_transactions (nível >=3) e suppliers (nível >=2)
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS financial_transactions_delete ON public.financial_transactions;
DROP POLICY IF EXISTS financial_transactions_insert ON public.financial_transactions;
DROP POLICY IF EXISTS financial_transactions_select ON public.financial_transactions;
DROP POLICY IF EXISTS financial_transactions_update ON public.financial_transactions;

CREATE POLICY financial_transactions_staff_all ON public.financial_transactions FOR ALL TO authenticated
  USING (COALESCE(public.current_admin_level(), 0) >= 3)
  WITH CHECK (COALESCE(public.current_admin_level(), 0) >= 3);

DROP POLICY IF EXISTS suppliers_authenticated_all ON public.suppliers;
DROP POLICY IF EXISTS suppliers_delete ON public.suppliers;
DROP POLICY IF EXISTS suppliers_insert ON public.suppliers;
DROP POLICY IF EXISTS suppliers_select ON public.suppliers;
DROP POLICY IF EXISTS suppliers_update ON public.suppliers;

CREATE POLICY suppliers_staff_all ON public.suppliers FOR ALL TO authenticated
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

-- invites: fecha as abertas, adiciona 1 policy de defesa em profundidade
-- (nenhum fluxo real usa esta tabela hoje — ver seção 9, gatilho removido).
DROP POLICY IF EXISTS invites_delete ON public.invites;
DROP POLICY IF EXISTS invites_insert ON public.invites;
DROP POLICY IF EXISTS invites_select ON public.invites;
DROP POLICY IF EXISTS invites_update ON public.invites;

CREATE POLICY invites_staff_all ON public.invites FOR ALL TO authenticated
  USING (COALESCE(public.current_admin_level(), 0) >= 4)
  WITH CHECK (COALESCE(public.current_admin_level(), 0) >= 4);

-- ----------------------------------------------------------------------------
-- 7. admin_users — fecha o vazamento de leitura e habilita a tela de Usuários
-- ----------------------------------------------------------------------------
-- admin_users_insert_service e admin_users_update_service (role service_role)
-- já estão corretas — não tocar.
DROP POLICY IF EXISTS admin_users_select_authenticated ON public.admin_users;

CREATE POLICY admin_users_self_select ON public.admin_users FOR SELECT TO authenticated
  USING (auth_user_id = auth.uid());
CREATE POLICY admin_users_staff_select ON public.admin_users FOR SELECT TO authenticated
  USING (COALESCE(public.current_admin_level(), 0) >= 4);
-- Nova capacidade (não existia policy nenhuma de UPDATE para authenticated):
-- é o que faz UsersModule.tsx (suspender/reativar/mudar nível) funcionar.
CREATE POLICY admin_users_owner_update ON public.admin_users FOR UPDATE TO authenticated
  USING (COALESCE(public.current_admin_level(), 0) >= 4)
  WITH CHECK (COALESCE(public.current_admin_level(), 0) >= 4);

-- ----------------------------------------------------------------------------
-- 8. RPCs de auto-atendimento do cliente (checkout + Minha Conta)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_sale_by_session(p_session_id text)
RETURNS TABLE (
  id uuid, status text, total_amount numeric, created_at timestamptz,
  shipping_address jsonb, client_full_name text, client_email text
)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT s.id, s.status, s.total_amount, s.created_at, s.shipping_address,
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

-- ----------------------------------------------------------------------------
-- 9. Trigger de auto-admin — remove o vetor de escalonamento por metadata
-- ----------------------------------------------------------------------------
-- Confirmado: UsersModule.tsx já instrui "convide pelo painel do Supabase".
-- Nenhum fluxo em src/ escreve em `invites`. Admins passam a ser criados só
-- manualmente pelo painel do Supabase (dashboard), nunca por metadata de
-- signup público.
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_admin_user();

-- ----------------------------------------------------------------------------
-- 10. Storage — corrige policies com nome de "autenticado" mas role pública
-- ----------------------------------------------------------------------------
-- product-images e as policies só-leitura ("Public Access", "Public Read
-- Products", "Allow public read") já estão corretas — não tocar.
DROP POLICY IF EXISTS "Admin Upload Products" ON storage.objects;
DROP POLICY IF EXISTS "Admin Update Products" ON storage.objects;
CREATE POLICY "Admin Upload Products" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'products');
CREATE POLICY "Admin Update Products" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'products');

DROP POLICY IF EXISTS "Auth Insert" ON storage.objects;
DROP POLICY IF EXISTS "Auth Update" ON storage.objects;
CREATE POLICY "Auth Insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'camelia-images');
CREATE POLICY "Auth Update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'camelia-images');

-- ----------------------------------------------------------------------------
-- 11. Funções de negócio — remove overload morto, corrige tipos e autorização
-- ----------------------------------------------------------------------------
-- Overload morto de quando products.id era bigint (products.id é uuid hoje).
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
BEGIN
  IF COALESCE(public.current_admin_level(), 0) < 2 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Não autorizado.');
  END IF;

  SELECT stock INTO v_current_stock FROM public.products WHERE id = p_product_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Produto não encontrado.');
  END IF;

  IF p_type = 'ENTRADA' THEN
    UPDATE public.products SET stock = COALESCE(stock, 0) + p_quantity
    WHERE id = p_product_id RETURNING stock INTO v_new_stock;
  ELSIF p_type = 'SAIDA' THEN
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
    p_type, p_notes, v_new_stock, NOW()
  );

  RETURN jsonb_build_object('success', true, 'new_stock', v_new_stock, 'message', 'Ajuste realizado com sucesso.');

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$function$;

REVOKE ALL ON FUNCTION public.handle_inventory_adjustment(uuid, integer, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.handle_inventory_adjustment(uuid, integer, text, text) TO authenticated;

-- process_sale: a versão antiga fazia CAST para BIGINT de colunas que hoje
-- são UUID (quebrada, não só insegura) e referenciava `tax_cost`, uma coluna
-- que não existe em `sales` (confirmado na auditoria) — também quebraria a
-- query. Reescrita com tipos corretos, autorização, e checagem de estoque
-- antes de decrementar.
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

    INSERT INTO public.inventory_logs (
      product_id, change_type, quantity_changed, new_stock_total, reason, created_at
    )
    SELECT v_product_id, 'Saída Venda', -v_qty, p.stock, 'Venda vinculada ID: ' || v_sale_id, NOW()
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

-- ----------------------------------------------------------------------------
-- 12. Endurecimento opcional (seguro barato contra policy futura permissiva)
-- ----------------------------------------------------------------------------
REVOKE ALL ON public.clients, public.sales, public.sale_items,
  public.financial_transactions, public.suppliers, public.stock_movements,
  public.invites, public.profiles FROM anon;

COMMIT;

-- ============================================================================
-- Não alterado nesta rodada: wishlists (já correta), inventory_logs (só
-- authenticated, sem gate de nível — não exploitável por anon hoje),
-- handle_stock_on_paid_sale (já correta e idempotente).
-- ============================================================================
