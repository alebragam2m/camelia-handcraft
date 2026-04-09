-- ============================================================
-- MIGRATION: clients v2 — campos complementares de CRM
-- Execute no SQL Editor do Supabase
-- Seguro: IF NOT EXISTS + sem DEFAULT + sem NOT NULL
-- Nunca alterar ou remover colunas existentes
-- ============================================================

ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS cpf_cnpj             TEXT,
  ADD COLUMN IF NOT EXISTS birth_date           DATE,
  ADD COLUMN IF NOT EXISTS address              TEXT,
  ADD COLUMN IF NOT EXISTS neighborhood         TEXT,
  ADD COLUMN IF NOT EXISTS city                 TEXT,
  ADD COLUMN IF NOT EXISTS state                TEXT,
  ADD COLUMN IF NOT EXISTS zip_code             TEXT,
  ADD COLUMN IF NOT EXISTS acquisition_channel  TEXT,
  ADD COLUMN IF NOT EXISTS internal_notes       TEXT;

-- Força o PostgREST a recarregar o schema imediatamente
NOTIFY pgrst, 'reload schema';
