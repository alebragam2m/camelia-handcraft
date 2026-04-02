-- 1. Garante que a coluna de estoque (atual) não foi apagada acidentalmente
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS atual INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS data_entrada DATE;

-- 2. Força o servidor do Supabase a limpar o Cache e reconhecer as colunas novas imediatamente
NOTIFY pgrst, 'reload schema';
