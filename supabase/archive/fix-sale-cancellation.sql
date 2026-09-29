-- ============================================================================
-- Camélia Handcraft — cancelamento de venda (mantém histórico) + alerta de
-- conflito de estoque na confirmação de pagamento
-- ============================================================================
-- Hoje só existe "excluir" venda (apaga a linha). Isso adiciona "cancelar":
-- muda o status para 'Cancelada', devolve estoque (se havia sido baixado) e
-- remove o lançamento financeiro vinculado, preservando a venda no histórico
-- para auditoria. Não chama reembolso da Stripe — o estorno do dinheiro
-- continua manual, como já é hoje.
--
-- Rode no SQL Editor do Supabase.
-- ============================================================================

ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS stock_conflict boolean NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION public.handle_sale_cancellation()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE item RECORD;
BEGIN
  IF NEW.status = 'Cancelada' AND (OLD.status IS DISTINCT FROM 'Cancelada') THEN
    IF COALESCE(OLD.stock_deducted, false) THEN
      FOR item IN SELECT product_id, quantity FROM public.sale_items WHERE sale_id = NEW.id
      LOOP
        UPDATE public.products SET stock = stock + item.quantity WHERE id = item.product_id;
        INSERT INTO public.inventory_logs (product_id, change_type, quantity_changed, new_stock_total, reason)
        SELECT item.product_id, 'Entrada', item.quantity, p.stock, 'Estorno — venda #' || NEW.id || ' cancelada'
        FROM public.products p WHERE p.id = item.product_id;
      END LOOP;
      NEW.stock_deducted := false;
    END IF;

    DELETE FROM public.financial_transactions WHERE related_sale_id = NEW.id;
  END IF;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trigger_handle_sale_cancellation ON public.sales;
CREATE TRIGGER trigger_handle_sale_cancellation
BEFORE UPDATE ON public.sales
FOR EACH ROW EXECUTE FUNCTION public.handle_sale_cancellation();
