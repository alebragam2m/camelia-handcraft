-- Camelia Handcraft: estrutura base para um projeto Supabase vazio.
-- Execute este arquivo antes de schema-current.sql.
BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.admin_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id uuid UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  access_level integer NOT NULL DEFAULT 1 CHECK (access_level BETWEEN 1 AND 4),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  contact_person text,
  cnpj_cpf text,
  phone text,
  email text,
  supplied_items text,
  reliability_score integer CHECK (reliability_score BETWEEN 0 AND 5),
  internal_notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  price numeric NOT NULL DEFAULT 0 CHECK (price >= 0),
  cost numeric NOT NULL DEFAULT 0 CHECK (cost >= 0),
  stock integer NOT NULL DEFAULT 0 CHECK (stock >= 0),
  stock_to_make integer NOT NULL DEFAULT 0 CHECK (stock_to_make >= 0),
  min_stock integer DEFAULT 5 CHECK (min_stock >= 0),
  category text,
  colecao text DEFAULT 'Avulso',
  description text,
  technical_notes text,
  material text,
  tags text,
  image_url text,
  image_2 text,
  image_3 text,
  image_4 text,
  data_entrada text,
  show_on_site boolean NOT NULL DEFAULT true,
  is_preorder boolean NOT NULL DEFAULT false,
  is_insumo boolean NOT NULL DEFAULT false,
  insumos_json jsonb,
  measure_cm text,
  weight_kg numeric DEFAULT 0 CHECK (weight_kg >= 0),
  supplier_id uuid REFERENCES public.suppliers(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL DEFAULT '',
  email text UNIQUE,
  phone text,
  telefone text,
  cpf_cnpj text,
  birth_date date,
  address text,
  address_number text,
  address_complement text,
  neighborhood text,
  city text,
  state text,
  cep text,
  zip_code text,
  acquisition_channel text,
  internal_notes text,
  is_vip boolean NOT NULL DEFAULT false,
  stripe_customer_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  client_name text,
  payment_method text,
  total_amount numeric NOT NULL DEFAULT 0 CHECK (total_amount >= 0),
  total_cost numeric NOT NULL DEFAULT 0 CHECK (total_cost >= 0),
  discount numeric NOT NULL DEFAULT 0 CHECK (discount >= 0),
  shipping_cost numeric NOT NULL DEFAULT 0 CHECK (shipping_cost >= 0),
  tax_cost numeric NOT NULL DEFAULT 0 CHECK (tax_cost >= 0),
  shipping_address jsonb,
  status text NOT NULL DEFAULT 'Pendente',
  stock_deducted boolean NOT NULL DEFAULT false,
  stock_conflict boolean NOT NULL DEFAULT false,
  checkout_managed boolean NOT NULL DEFAULT false,
  fulfillment_status text NOT NULL DEFAULT 'Aguardando produção',
  tracking_code text,
  stripe_session_id text UNIQUE,
  payment_intent_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.sale_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id uuid NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id),
  quantity integer NOT NULL CHECK (quantity > 0),
  unit_price numeric NOT NULL CHECK (unit_price >= 0),
  unit_cost numeric NOT NULL DEFAULT 0 CHECK (unit_cost >= 0)
);

CREATE TABLE IF NOT EXISTS public.inventory_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id),
  quantity_changed integer NOT NULL,
  change_type text NOT NULL,
  reason text,
  new_stock_total integer NOT NULL CHECK (new_stock_total >= 0),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.financial_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL CHECK (type IN ('receita', 'despesa')),
  description text NOT NULL,
  amount numeric NOT NULL CHECK (amount >= 0),
  transaction_date timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'Pago',
  payment_date date,
  category text,
  related_sale_id uuid REFERENCES public.sales(id) ON DELETE CASCADE,
  due_date date NOT NULL DEFAULT current_date,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Tabelas legadas ainda citadas pelo consolidado; ficam fechadas por RLS.
CREATE TABLE IF NOT EXISTS public.profiles (id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE);
CREATE TABLE IF NOT EXISTS public.invites (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS public.stock_movements (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), created_at timestamptz NOT NULL DEFAULT now());

CREATE INDEX IF NOT EXISTS products_supplier_id_idx ON public.products(supplier_id);
CREATE INDEX IF NOT EXISTS sale_items_sale_id_idx ON public.sale_items(sale_id);
CREATE INDEX IF NOT EXISTS sale_items_product_id_idx ON public.sale_items(product_id);
CREATE INDEX IF NOT EXISTS inventory_logs_product_created_idx ON public.inventory_logs(product_id, created_at DESC);
CREATE INDEX IF NOT EXISTS sales_client_created_idx ON public.sales(client_id, created_at DESC);
CREATE INDEX IF NOT EXISTS financial_related_sale_idx ON public.financial_transactions(related_sale_id);

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;

INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;

COMMIT;
