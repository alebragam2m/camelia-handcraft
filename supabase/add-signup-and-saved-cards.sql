-- ============================================================================
-- Camélia Handcraft — auto-cadastro de cliente + suporte a cartão salvo
-- ============================================================================
-- Incremental sobre supabase/fix-rls.sql (já aplicado). Rode no SQL Editor
-- do Supabase como transação única.
-- ============================================================================

BEGIN;

-- O próprio cliente cria sua linha em `clients` no primeiro acesso (cadastro
-- novo, ou primeiro login social/e-mail confirmado sem checkout prévio).
-- Idempotente: não sobrescreve um cadastro já existente (ON CONFLICT DO
-- NOTHING) — clients_staff_insert (fix-rls.sql) exige nível >=1, então sem
-- esta RPC um cliente novo não teria como criar a própria linha.
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

-- Guarda o Customer da Stripe por cliente, para o checkout hospedado poder
-- oferecer "salvar cartão" e reaproveitar cartão salvo em compras futuras.
-- Nenhum dado de cartão passa pelo nosso banco ou servidor — só o id do
-- Customer da Stripe.
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS stripe_customer_id text;

COMMIT;
