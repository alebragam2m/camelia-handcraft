-- ============================================================================
-- Camélia Handcraft — garante a coluna stock_deducted (independente de ordem)
-- ============================================================================
-- "record "old" has no field "stock_deducted"" ao cancelar venda indica que
-- essa coluna não existe na tabela `sales` agora, apesar de ter sido criada
-- em fix-stock-restore-on-delete.sql — provavelmente por causa da mesma
-- confusão de ordem de execução dos SQLs incrementais. Esta migração é
-- idempotente e segura de rodar quantas vezes for preciso.
--
-- Rode no SQL Editor do Supabase.
-- ============================================================================

ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS stock_deducted boolean NOT NULL DEFAULT false;
