-- ============================================================
-- MIGRATION: products v2 — campos de gestão de estoque e catálogo
-- Execute no SQL Editor do Supabase
-- Seguro: IF NOT EXISTS + defaults seguros + sem NOT NULL
-- Nunca alterar ou remover colunas existentes
-- ============================================================

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS min_stock  INTEGER DEFAULT 5,
  ADD COLUMN IF NOT EXISTS material   TEXT,
  ADD COLUMN IF NOT EXISTS tags       TEXT;

-- Força o PostgREST a recarregar o schema imediatamente
NOTIFY pgrst, 'reload schema';
