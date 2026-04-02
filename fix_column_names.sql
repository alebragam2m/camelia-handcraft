-- ============================================================
-- CORREÇÃO FINAL: Renomear colunas do banco para bater com o app
-- Execute TUDO DE UMA VEZ no Supabase SQL Editor
-- ============================================================

-- 1. Renomear 'name' -> 'nome' (o app usa 'nome')
ALTER TABLE public.products RENAME COLUMN name TO nome;

-- 2. Renomear 'atual' -> 'stock' (o app usa 'stock')
ALTER TABLE public.products RENAME COLUMN atual TO stock;

-- 3. Renomear 'collection' -> 'colecao' (o app usa 'colecao') se necessário
-- (ignorar se já existe 'colecao')
-- ALTER TABLE public.products RENAME COLUMN collection TO colecao;

-- 4. Forçar atualização do cache do PostgREST
NOTIFY pgrst, 'reload schema';
