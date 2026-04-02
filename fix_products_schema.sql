-- ============================================================
-- SCRIPT DE CORREÇÃO: Tabela de Produtos (Products Schema Fix)
-- Rode isso no SQL Editor do Supabase para corrigir o erro
-- ============================================================

-- Adiciona as colunas ausentes caso não existam
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS colecao TEXT DEFAULT 'Avulso',
ADD COLUMN IF NOT EXISTS cost NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS image_2 TEXT,
ADD COLUMN IF NOT EXISTS image_3 TEXT,
ADD COLUMN IF NOT EXISTS image_4 TEXT,
ADD COLUMN IF NOT EXISTS data_entrada TEXT,
ADD COLUMN IF NOT EXISTS is_insumo BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS supplier_id BIGINT,
ADD COLUMN IF NOT EXISTS measure_cm TEXT,
ADD COLUMN IF NOT EXISTS weight_kg NUMERIC;

-- Força o Supabase a atualizar o cache interno (Isso tira o erro de "Could not find column")
NOTIFY pgrst, 'reload schema';
