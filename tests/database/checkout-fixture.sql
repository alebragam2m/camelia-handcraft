-- Exclusivamente sintético. A fixture não depende de credenciais remotas.
DO $$ BEGIN IF current_database() <> 'camelia_checkout_test' THEN RAISE EXCEPTION 'Banco incorreto'; END IF; END $$;
CREATE SCHEMA IF NOT EXISTS auth;
CREATE TABLE IF NOT EXISTS auth.users(id uuid PRIMARY KEY,email text,email_confirmed_at timestamptz);
CREATE TABLE IF NOT EXISTS public.products(id uuid PRIMARY KEY, nome text, stock integer, price numeric, cost numeric, show_on_site boolean, is_insumo boolean, is_preorder boolean);
CREATE TABLE IF NOT EXISTS public.clients(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),full_name text,email text UNIQUE,phone text);
CREATE TABLE IF NOT EXISTS public.shipping_rates(state text PRIMARY KEY,cost numeric);
CREATE TABLE IF NOT EXISTS public.sales(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),client_id uuid REFERENCES clients(id),client_name text,payment_method text,total_amount numeric,total_cost numeric,shipping_cost numeric,shipping_address jsonb,status text,stock_deducted boolean DEFAULT false,stripe_session_id text,payment_intent_id text,fulfillment_status text,tracking_code text);
CREATE TABLE IF NOT EXISTS public.sale_items(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),sale_id uuid REFERENCES sales(id),product_id uuid REFERENCES products(id),quantity integer,unit_price numeric,unit_cost numeric);
CREATE TABLE IF NOT EXISTS public.inventory_logs(id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,product_id uuid REFERENCES products(id),quantity_changed integer,change_type text,reason text,new_stock_total integer CHECK(new_stock_total>=0),created_at timestamptz DEFAULT now());
CREATE TABLE IF NOT EXISTS public.financial_transactions(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),type text,description text,amount numeric,transaction_date timestamptz,status text,payment_date date,related_sale_id uuid REFERENCES sales(id),due_date date);
GRANT SELECT,INSERT,UPDATE,DELETE ON sales,sale_items TO authenticated;
