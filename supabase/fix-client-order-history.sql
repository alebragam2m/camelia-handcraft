-- ============================================================================
-- Camélia Handcraft — histórico de pedidos do próprio cliente, com itens
-- ============================================================================
-- ClientArea.jsx ("Meus Pedidos") precisa mostrar nome/imagem do produto de
-- cada item comprado. sale_items_self_select (fix-rls.sql) já deixa o
-- cliente ler os próprios sale_items, mas não há policy alguma que deixe um
-- cliente comum (não-staff) ler a tabela `products` — nem storefront_products
-- serve, pois só lista o catálogo publicado hoje, e um pedido antigo pode
-- ter itens já removidos/ocultados do catálogo. RPC dedicada resolve sem
-- abrir products para qualquer autenticado.
--
-- Rode no SQL Editor do Supabase.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_my_orders()
RETURNS TABLE (
  id uuid, status text, total_amount numeric, payment_method text,
  created_at timestamptz, shipping_address jsonb, items jsonb
)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT s.id, s.status, s.total_amount, s.payment_method, s.created_at, s.shipping_address,
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
