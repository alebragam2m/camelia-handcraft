-- ============================================================
-- SCRIPT 2: Trigger de Baixa Automática de Estoque
-- Execute este bloco SEGUNDO no Supabase SQL Editor
-- ============================================================

-- Função que processa a baixa de estoque
CREATE OR REPLACE FUNCTION public.handle_stock_on_paid_sale()
RETURNS TRIGGER AS $$
DECLARE
    item RECORD;
BEGIN
    -- Verifica se o status mudou para 'Paga' ou 'Pago'
    IF (NEW.status IN ('Paga', 'Pago')) AND 
       (OLD.status IS NULL OR OLD.status NOT IN ('Paga', 'Pago')) THEN

        -- Percorre todos os itens desta venda
        FOR item IN 
            SELECT product_id, quantity 
            FROM public.sale_items 
            WHERE sale_id = NEW.id
        LOOP
            -- 1. Subtrai do estoque do produto
            UPDATE public.products 
            SET stock = GREATEST(0, stock - item.quantity)
            WHERE id = item.product_id;

            -- 2. Registra no log de inventário para o ERP
            INSERT INTO public.inventory_logs 
                (product_id, change_type, quantity_changed, new_stock_total, reason)
            SELECT 
                item.product_id, 
                'Venda no Site', 
                -item.quantity, 
                p.stock,
                'Venda #' || NEW.id || ' confirmada via Stripe'
            FROM public.products p
            WHERE p.id = item.product_id;
        END LOOP;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Remove trigger anterior (se existir) e recria
DROP TRIGGER IF EXISTS trigger_sync_stock_on_payment ON public.sales;

CREATE TRIGGER trigger_sync_stock_on_payment
    AFTER UPDATE ON public.sales
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_stock_on_paid_sale();

-- Notifica o PostgREST para recarregar o esquema
NOTIFY pgrst, 'reload schema';
