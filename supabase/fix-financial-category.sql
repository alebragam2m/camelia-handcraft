-- ============================================================================
-- Camélia Handcraft — coluna `category` faltante em financial_transactions
-- ============================================================================
-- FinanceModule.tsx sempre enviou `category` no payload de "Novo Lançamento"
-- (junto com o também-corrigido transaction_type→type), mas a coluna nunca
-- existiu — outra causa do "Novo Lançamento" falhar silenciosamente.
--
-- Rode no SQL Editor do Supabase.
-- ============================================================================

ALTER TABLE public.financial_transactions ADD COLUMN IF NOT EXISTS category text;
