-- ============================================================================
-- Camélia Handcraft — devolve estoque automaticamente ao excluir uma venda
-- ============================================================================
-- Problema: excluir uma venda (botão admin) apagava sale_items sem devolver
-- o estoque baixado, exigindo ajuste manual no PCP toda vez.
--
-- Solução: uma coluna `stock_deducted` em `sales` marca se aquela venda
-- realmente baixou estoque (só assim sabemos se há algo a devolver — uma
-- venda "Pendente" da loja que nunca foi paga nunca baixou estoque, e
-- devolver "estoque" dela inflaria o número por engano). Um gatilho em
-- `sale_items` devolve a quantidade ao excluir, só quando essa flag é true.
--
-- Funciona para venda da loja (marcada true quando o webhook confirma o
-- pagamento) e venda manual (marcada true na criação, já que process_sale
-- sempre baixa estoque na hora, pago ou pendente).
--
-- Rode no SQL Editor do Supabase como transação única.
-- ============================================================================

BEGIN;

ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS stock_deducted boolean NOT NULL DEFAULT false;

-- Venda da loja: marca a flag na mesma transição que já baixa estoque hoje.
CREATE OR REPLACE FUNCTION public.handle_stock_on_paid_sale()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $function$
DECLARE item RECORD;
BEGIN
    IF (NEW.status IN ('Paga', 'Pago')) AND (OLD.status IS NULL OR OLD.status NOT IN ('Paga', 'Pago')) THEN
        FOR item IN SELECT product_id, quantity FROM public.sale_items WHERE sale_id = NEW.id
        LOOP
            UPDATE public.products SET stock = GREATEST(0, stock - item.quantity) WHERE id = item.product_id;
            INSERT INTO public.inventory_logs (product_id, change_type, quantity_changed, new_stock_total, reason)
            SELECT item.product_id, 'Venda no Site', -item.quantity, p.stock, 'Venda #' || NEW.id || ' confirmada via Stripe'
            FROM public.products p WHERE p.id = item.product_id;
        END LOOP;

        INSERT INTO public.financial_transactions (
          type, description, amount, transaction_date, status, payment_date, related_sale_id, due_date
        ) VALUES (
          'receita', 'Venda #' || NEW.id || COALESCE(' - ' || NEW.client_name, ''),
          NEW.total_amount, NOW(), 'Pago', CURRENT_DATE, NEW.id, CURRENT_DATE
        );

        UPDATE public.sales SET stock_deducted = true WHERE id = NEW.id;
    END IF;
    RETURN NEW;
END;
$function$;

-- Venda manual: process_sale já baixa estoque incondicionalmente (pago ou
-- pendente) — a flag entra true direto na criação da linha.
CREATE OR REPLACE FUNCTION public.process_sale(sale_data jsonb, items_data jsonb)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_sale_id UUID;
  v_stock INTEGER;
  v_product_id UUID;
  v_qty INTEGER;
  v_status TEXT;
  item JSONB;
BEGIN
  IF COALESCE(public.current_admin_level(), 0) < 1 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Não autorizado.');
  END IF;

  v_status := COALESCE(sale_data->>'status', 'completed');

  INSERT INTO public.sales (
    client_id, client_name, payment_method, total_amount, total_cost,
    discount, shipping_cost, status, stock_deducted, created_at
  ) VALUES (
    NULLIF((sale_data->>'client_id'), '')::UUID,
    (sale_data->>'client_name'),
    (sale_data->>'payment_method'),
    (sale_data->>'total_amount')::NUMERIC,
    (sale_data->>'total_cost')::NUMERIC,
    COALESCE((sale_data->>'discount')::NUMERIC, 0),
    COALESCE((sale_data->>'shipping_cost')::NUMERIC, 0),
    v_status,
    true,
    COALESCE((sale_data->>'created_at')::TIMESTAMPTZ, NOW())
  ) RETURNING id INTO v_sale_id;

  FOR item IN SELECT * FROM jsonb_array_elements(items_data)
  LOOP
    v_product_id := (item->>'product_id')::UUID;
    v_qty := (item->>'quantity')::INTEGER;

    SELECT stock INTO v_stock FROM public.products WHERE id = v_product_id FOR UPDATE;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Produto % não encontrado.', v_product_id;
    END IF;
    IF COALESCE(v_stock, 0) < v_qty THEN
      RAISE EXCEPTION 'Estoque insuficiente para o produto %.', v_product_id;
    END IF;

    INSERT INTO public.sale_items (sale_id, product_id, quantity, unit_price, unit_cost)
    VALUES (v_sale_id, v_product_id, v_qty, (item->>'unit_price')::NUMERIC, (item->>'unit_cost')::NUMERIC);

    UPDATE public.products SET stock = stock - v_qty WHERE id = v_product_id;

    INSERT INTO public.inventory_logs (
      product_id, change_type, quantity_changed, new_stock_total, reason, created_at
    )
    SELECT v_product_id, 'Saída Manual', -v_qty, p.stock, 'Venda manual vinculada ID: ' || v_sale_id, NOW()
    FROM public.products p WHERE p.id = v_product_id;
  END LOOP;

  IF v_status = 'completed' THEN
    INSERT INTO public.financial_transactions (
      type, description, amount, transaction_date, status, payment_date, related_sale_id, due_date
    ) VALUES (
      'receita', 'Venda manual #' || v_sale_id || COALESCE(' - ' || (sale_data->>'client_name'), ''),
      (sale_data->>'total_amount')::NUMERIC, NOW(), 'Pago', CURRENT_DATE, v_sale_id, CURRENT_DATE
    );
  END IF;

  RETURN jsonb_build_object(
    'success', true, 'message', 'Venda e estoque sincronizados!',
    'id', v_sale_id, 'sale_id', v_sale_id
  );

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$function$;

REVOKE ALL ON FUNCTION public.process_sale(jsonb, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.process_sale(jsonb, jsonb) TO authenticated;

-- Devolve o estoque de cada item ao ser excluído, só se a venda-mãe
-- realmente havia baixado estoque (stock_deducted = true).
CREATE OR REPLACE FUNCTION public.restore_stock_on_sale_item_delete()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE v_deducted boolean;
BEGIN
  SELECT stock_deducted INTO v_deducted FROM public.sales WHERE id = OLD.sale_id;

  IF COALESCE(v_deducted, false) THEN
    UPDATE public.products SET stock = stock + OLD.quantity WHERE id = OLD.product_id;
    INSERT INTO public.inventory_logs (product_id, change_type, quantity_changed, new_stock_total, reason)
    SELECT OLD.product_id, 'Entrada', OLD.quantity, p.stock, 'Estorno automático — venda #' || OLD.sale_id || ' excluída'
    FROM public.products p WHERE p.id = OLD.product_id;
  END IF;

  RETURN OLD;
END;
$function$;

DROP TRIGGER IF EXISTS trigger_restore_stock_on_sale_item_delete ON public.sale_items;
CREATE TRIGGER trigger_restore_stock_on_sale_item_delete
BEFORE DELETE ON public.sale_items
FOR EACH ROW EXECUTE FUNCTION public.restore_stock_on_sale_item_delete();

COMMIT;

-- ============================================================================
-- Nota: vendas já existentes (criadas antes desta migração) ficam com
-- stock_deducted = false por padrão — excluí-las não devolve estoque
-- automaticamente. Vale só para vendas novas a partir de agora.
-- ============================================================================
