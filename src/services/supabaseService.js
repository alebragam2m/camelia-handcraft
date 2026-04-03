/**
 * Camélia Handcraft — Service Layer Centralizado
 * Única fonte de verdade para todas as operações de banco de dados.
 * Admin e Site compartilham este mesmo módulo.
 */
import { supabase } from '../supabase';

// ─── PRODUTOS ─────────────────────────────────────────────────────────────────

export const productService = {
  /** Busca todos os produtos ordenados por criação */
  async getAll() {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data ?? [];
  },

  /** Cria ou atualiza um produto. id = null → INSERT, id = number → UPDATE */
  async save(payload, id = null) {
    const clean = {
      nome: payload.nome || '',
      price: parseFloat(payload.price) || 0,
      cost: parseFloat(payload.cost) || 0,
      stock: parseInt(payload.stock) ?? 0,
      category: payload.category || 'Diversos',
      colecao: payload.colecao || 'Sem linha / Coleção',
      description: payload.description || '',
      is_insumo: payload.is_insumo ?? false,
      show_on_site: payload.show_on_site ?? true,
      is_preorder: payload.is_preorder ?? false,
      insumos_json: Array.isArray(payload.insumos_json) ? payload.insumos_json : [],
      supplier_id: payload.supplier_id ? parseInt(payload.supplier_id) : null,
      measure_cm: payload.measure_cm || null,
      weight_kg: payload.weight_kg ? parseFloat(payload.weight_kg) : null,
      ...(payload.image_url !== undefined && { image_url: payload.image_url }),
    };

    if (id) {
      const { data, error } = await supabase
        .from('products')
        .update(clean)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    } else {
      const { data, error } = await supabase
        .from('products')
        .insert([clean])
        .select()
        .single();
      if (error) throw error;
      return data;
    }
  },

  /** Sobe uma imagem no Storage e atualiza o produto com a URL pública */
  async uploadImage(productId, file) {
    const ext = file.name.split('.').pop();
    const path = `products/${productId}/${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from('products')
      .upload(path, file, { upsert: true });
    if (uploadError) throw uploadError;
    const { data: urlData } = supabase.storage.from('products').getPublicUrl(path);
    const publicUrl = urlData?.publicUrl;
    if (!publicUrl) throw new Error('Não foi possível obter a URL pública da imagem.');
    // Atualiza o produto imediatamente
    const { data, error } = await supabase
      .from('products')
      .update({ image_url: publicUrl })
      .eq('id', productId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  /** Remove um produto */
  async remove(id) {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) throw error;
  },

  /**
   * Assina o canal Realtime da tabela products.
   * Chama onChange sempre que qualquer linha for INSERT/UPDATE/DELETE.
   * Retorna a função de unsubscribe para cleanup.
   */
  subscribe(onChange) {
    const channel = supabase
      .channel('products_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'products' },
        () => onChange()
      )
      .subscribe();
    return () => supabase.removeChannel(channel);
  },
};

// ─── VENDAS ───────────────────────────────────────────────────────────────────

export const saleService = {
  async getAll() {
    const { data, error } = await supabase
      .from('sales')
      .select('*, clients(full_name, is_vip), sale_items(*, products(nome, image_url))')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data ?? [];
  },

  async processSale(saleData, itemsData) {
    const { data, error } = await supabase.rpc('process_sale', {
      sale_data: saleData,
      items_data: itemsData,
    });
    if (error) throw error;
    return data;
  },
};

// ─── CLIENTES ─────────────────────────────────────────────────────────────────

export const clientService = {
  async getAll() {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('full_name');
    if (error) throw error;
    return data ?? [];
  },

  async save(payload, id = null) {
    if (id) {
      const { data, error } = await supabase
        .from('clients')
        .update(payload)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    } else {
      const { data, error } = await supabase
        .from('clients')
        .insert([payload])
        .select()
        .single();
      if (error) throw error;
      return data;
    }
  },
};

// ─── FORNECEDORES ─────────────────────────────────────────────────────────────

export const supplierService = {
  async getAll() {
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .order('name');
    if (error) throw error;
    return data ?? [];
  },

  async save(payload, id = null) {
    if (id) {
      const { data, error } = await supabase
        .from('suppliers')
        .update(payload)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    } else {
      const { data, error } = await supabase
        .from('suppliers')
        .insert([payload])
        .select()
        .single();
      if (error) throw error;
      return data;
    }
  },

  async remove(id) {
    const { error } = await supabase.from('suppliers').delete().eq('id', id);
    if (error) throw error;
  },
};

// ─── FINANÇAS ─────────────────────────────────────────────────────────────────

export const transactionService = {
  async getAll() {
    const { data, error } = await supabase
      .from('financial_transactions')
      .select('*')
      .order('due_date', { ascending: false });
    if (error) throw error;
    return data ?? [];
  },

  async save(payload, id = null) {
    if (id) {
      const { data, error } = await supabase
        .from('financial_transactions')
        .update(payload)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    } else {
      const { data, error } = await supabase
        .from('financial_transactions')
        .insert([payload])
        .select()
        .single();
      if (error) throw error;
      return data;
    }
  },

  async remove(id) {
    const { error } = await supabase
      .from('financial_transactions')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },
};

// ─── ESTOQUE ──────────────────────────────────────────────────────────────────

export const stockService = {
  async getLogs(productId) {
    const { data, error } = await supabase
      .from('inventory_logs')
      .select('*')
      .eq('product_id', productId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data ?? [];
  },

  async adjust(productId, quantity, type, notes = '') {
    const { data, error } = await supabase.rpc('handle_inventory_adjustment', {
      p_product_id: parseInt(productId),
      p_quantity: parseInt(quantity),
      p_type: type,
      p_notes: notes,
    });
    if (error) throw error;
    return data;
  },
};
