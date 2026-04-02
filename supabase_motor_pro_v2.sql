-- =========================================================================
-- MOTOR PRO V2 - RPCs (CÉREBRO DO BANCO)
-- Instruções: Copie tudo, cole no SQL Editor do Supabase e clique em RUN.
-- =========================================================================

-- 1. FUNÇÃO CENTRAL DE VENDAS
CREATE OR REPLACE FUNCTION process_sale(
  sale_data JSONB,
  items_data JSONB
) RETURNS JSONB AS $$
DECLARE
  v_sale_id BIGINT;
  item JSONB;
BEGIN
  -- 1. Inserir a Venda Principal
  INSERT INTO public.sales (
    client_id,
    client_name,
    payment_method,
    total_amount,
    total_cost,
    discount,
    shipping_cost,
    tax_cost,
    status,
    created_at
  ) VALUES (
    NULLIF((sale_data->>'client_id'), '')::BIGINT,
    (sale_data->>'client_name'),
    (sale_data->>'payment_method'),
    (sale_data->>'total_amount')::NUMERIC,
    (sale_data->>'total_cost')::NUMERIC,
    COALESCE((sale_data->>'discount')::NUMERIC, 0),
    COALESCE((sale_data->>'shipping_cost')::NUMERIC, 0),
    COALESCE((sale_data->>'tax_cost')::NUMERIC, 0),
    COALESCE((sale_data->>'status'), 'Paga'),
    COALESCE((sale_data->>'created_at')::TIMESTAMPTZ, NOW())
  ) RETURNING id INTO v_sale_id;

  -- 2. Processar Itens e Baixar Estoque
  FOR item IN SELECT * FROM jsonb_array_elements(items_data)
  LOOP
    -- Inserir item da venda
    INSERT INTO public.sale_items (
      sale_id,
      product_id,
      quantity,
      unit_price,
      unit_cost
    ) VALUES (
      v_sale_id,
      (item->>'product_id')::BIGINT,
      (item->>'quantity')::INTEGER,
      (item->>'unit_price')::NUMERIC,
      (item->>'unit_cost')::NUMERIC
    );

    -- Baixar Estoque (Transação Atômica)
    UPDATE public.products
    SET stock = stock - (item->>'quantity')::INTEGER
    WHERE id = (item->>'product_id')::BIGINT;

    -- Registrar Log de Inventário para Auditoria
    INSERT INTO public.inventory_logs (
      product_id,
      change_type,
      quantity_changed,
      new_stock_total,
      reason,
      created_at
    ) VALUES (
      (item->>'product_id')::BIGINT,
      'Saída Venda',
      -((item->>'quantity')::INTEGER),
      (SELECT stock FROM public.products WHERE id = (item->>'product_id')::BIGINT),
      'Venda vinculada ID: ' || v_sale_id,
      NOW()
    );
  END LOOP;

  RETURN jsonb_build_object(
    'success', true, 
    'message', 'Venda e estoque sincronizados!', 
    'sale_id', v_sale_id
  );

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql;


-- 2. FUNÇÃO DE AJUSTE MANUAL DE ESTOQUE
CREATE OR REPLACE FUNCTION handle_inventory_adjustment(
  p_product_id BIGINT,
  p_quantity INTEGER,
  p_type TEXT,
  p_notes TEXT DEFAULT ''
) RETURNS JSONB AS $$
DECLARE
  v_new_stock INTEGER;
BEGIN
  -- Diferenciar Entrada (soma) e Saída (subtração)
  IF p_type = 'ENTRADA' THEN
    UPDATE public.products SET stock = stock + p_quantity WHERE id = p_product_id RETURNING stock INTO v_new_stock;
  ELSIF p_type = 'SAIDA' THEN
    UPDATE public.products SET stock = stock - p_quantity WHERE id = p_product_id RETURNING stock INTO v_new_stock;
  ELSE
    RETURN jsonb_build_object('success', false, 'error', 'Tipo inválido (Use ENTRADA ou SAIDA)');
  END IF;

  -- Gerar Log de Auditoria
  INSERT INTO public.inventory_logs (
    product_id,
    change_type,
    quantity_changed,
    new_stock_total,
    reason,
    created_at
  ) VALUES (
    p_product_id,
    p_type,
    CASE WHEN p_type = 'ENTRADA' THEN p_quantity ELSE -p_quantity END,
    v_new_stock,
    p_notes,
    NOW()
  );

  RETURN jsonb_build_object('success', true, 'new_stock', v_new_stock);

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql;
