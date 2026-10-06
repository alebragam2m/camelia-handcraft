-- Modelo mínimo sintético. Não é cópia nem migração de produção.
DO $$ BEGIN
  IF current_database() <> 'camelia_test' THEN
    RAISE EXCEPTION 'Fixture permitida somente em camelia_test';
  END IF;
END $$;
CREATE TABLE IF NOT EXISTS public.products (id uuid PRIMARY KEY, stock integer);
CREATE TABLE IF NOT EXISTS public.inventory_logs (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 product_id uuid REFERENCES public.products(id), quantity_changed integer,
 change_type text, reason text, new_stock_total integer CHECK (new_stock_total >= 0),
 created_at timestamptz DEFAULT now()
);
CREATE OR REPLACE FUNCTION public.current_admin_level() RETURNS integer
LANGUAGE sql STABLE AS $$ SELECT COALESCE(NULLIF(current_setting('test.admin_level', true), ''), '0')::integer $$;
TRUNCATE public.inventory_logs, public.products RESTART IDENTITY;
INSERT INTO public.products VALUES ('00000000-0000-0000-0000-000000000001', 1);
