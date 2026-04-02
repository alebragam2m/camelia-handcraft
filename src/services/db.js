import { supabase } from '../supabase';

/**
 * Utilitário de Repetição (Retry Logic) Profissional
 * Tenta uma operação até 'maxRetries' vezes com atraso exponencial.
 */
async function retry(fn, maxRetries = 3, delay = 800) {
  let lastError;
  
  // Verificação de Sessão Pronta (Evita retries inúteis se o auth do Supabase ainda não carregou)
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    console.warn("Retrying blocked: No active Supabase session found.");
    // Tentamos apenas uma vez se não houver sessão, para não travar o app em loop
    return await fn();
  }

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      // Se for erro de rede ou timeout (abort), tentamos novamente
      if (i < maxRetries - 1) {
        console.warn(`Tentativa ${i + 1} de ${maxRetries} falhou. Recalibrando em ${delay}ms...`, err);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2; // Backoff exponencial
      }
    }
  }
  throw lastError;
}

/**
 * Camélia Enterprise Service Layer
 * Centraliza todas as interações com o banco de dados.
 */
export const db = {
  // --- PRODUTOS ---
  async getProducts() {
    return retry(async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    });
  },

  async upsertProduct(product, id = null) {
    return retry(async () => {
      if (id) {
        const { data, error } = await supabase.from('products').update(product).eq('id', id).select().single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase.from('products').insert([product]).select().single();
        if (error) throw error;
        return data;
      }
    });
  },

  async deleteProduct(id) {
    return retry(async () => {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
    });
  },

  // --- VENDAS ---
  async getSales() {
    return retry(async () => {
      const { data, error } = await supabase
        .from('sales')
        .select(`
          *,
          clients (full_name),
          sale_items (
            *,
            products (nome, image_url)
          )
        `)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    });
  },

  async createSale(salePayload, items) {
    return retry(async () => {
      // Inserção da Venda Pai
      const { data: sale, error: saleErr } = await supabase
        .from('sales')
        .insert([salePayload])
        .select()
        .single();
      if (saleErr) throw saleErr;

      // Inserção dos Items com vínculo da venda
      const itemsWithSale = items.map(item => ({ ...item, sale_id: sale.id }));
      const { error: itemsErr } = await supabase.from('sale_items').insert(itemsWithSale);
      if (itemsErr) throw itemsErr;

      return sale;
    });
  },

  // --- CLIENTES ---
  async getClients() {
    return retry(async () => {
      const { data, error } = await supabase.from('clients').select('*').order('full_name');
      if (error) throw error;
      return data;
    });
  },

  async upsertClient(client, id = null) {
    return retry(async () => {
      if (id) {
        const { data, error } = await supabase.from('clients').update(client).eq('id', id).select().single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase.from('clients').insert([client]).select().single();
        if (error) throw error;
        return data;
      }
    });
  },

  // --- FINANÇAS ---
  async getTransactions() {
    return retry(async () => {
      const { data, error } = await supabase
        .from('financial_transactions')
        .select('*')
        .order('due_date', { ascending: false });
      if (error) throw error;
      return data;
    });
  },

  async upsertTransaction(payload, id = null) {
    return retry(async () => {
      if (id) {
        const { data, error } = await supabase.from('financial_transactions').update(payload).eq('id', id).select().single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase.from('financial_transactions').insert([payload]).select().single();
        if (error) throw error;
        return data;
      }
    });
  },

  async deleteTransaction(id) {
    return retry(async () => {
      const { error } = await supabase.from('financial_transactions').delete().eq('id', id);
      if (error) throw error;
    });
  },

  // --- FORNECEDORES ---
  async getSuppliers() {
    return retry(async () => {
      const { data, error } = await supabase.from('suppliers').select('*').order('name');
      if (error) throw error;
      return data;
    });
  },

  async upsertSupplier(supplier, id = null) {
    return retry(async () => {
      if (id) {
        const { data, error } = await supabase.from('suppliers').update(supplier).eq('id', id).select().single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase.from('suppliers').insert([supplier]).select().single();
        if (error) throw error;
        return data;
      }
    });
  },

  async deleteSupplier(id) {
    return retry(async () => {
      const { error } = await supabase.from('suppliers').delete().eq('id', id);
      if (error) throw error;
    });
  },

  // --- LOGS DE ESTOQUE ---
  async getStockLogs(productId) {
    return retry(async () => {
      const { data, error } = await supabase
        .from('inventory_logs')
        .select('*')
        .eq('product_id', productId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    });
  },

  async logInventoryChange(logEntry) {
    return retry(async () => {
      const { data, error } = await supabase.from('inventory_logs').insert([logEntry]).select().single();
      if (error) throw error;
      return data;
    });
  }
};
