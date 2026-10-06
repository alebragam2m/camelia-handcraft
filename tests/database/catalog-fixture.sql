DO $$ BEGIN IF current_database()<>'camelia_catalog_test' THEN RAISE EXCEPTION 'Fixture somente local'; END IF; END $$;
CREATE TABLE IF NOT EXISTS public.products (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), nome text,price numeric,cost numeric,stock integer,stock_to_make integer DEFAULT 0,
 category text,colecao text,description text,image_url text,image_2 text,image_3 text,image_4 text,
 show_on_site boolean,is_preorder boolean,is_insumo boolean,insumos_json jsonb,technical_notes text,
 measure_cm text,weight_kg numeric,supplier_id uuid,min_stock integer DEFAULT 5,material text,tags text,created_at timestamptz DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.inventory_logs(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),product_id uuid REFERENCES products(id),quantity_changed integer,change_type text,reason text,new_stock_total integer,created_at timestamptz DEFAULT now());
CREATE OR REPLACE FUNCTION public.current_admin_level() RETURNS integer LANGUAGE sql AS $$ SELECT 4 $$;
TRUNCATE inventory_logs,products;
GRANT SELECT,INSERT,UPDATE,DELETE ON products TO authenticated;
