-- ============================================================
-- SCRIPT 1: Adicionar campos de rastreamento do Stripe na tabela sales
-- Execute este bloco PRIMEIRO no Supabase SQL Editor
-- ============================================================

alter table public.sales 
add column if not exists stripe_session_id text,
add column if not exists payment_intent_id text;

create index if not exists idx_sales_stripe_session on public.sales(stripe_session_id);

-- Notifica o PostgREST para recarregar o esquema
notify pgrst, 'reload schema';
