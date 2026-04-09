import { supabase } from '../lib/supabase';

export const productService = {

  async getAll() {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map(p => ({
      ...p,
      price: p.price ?? 0,
      stock: p.stock ?? 0,
      show_on_site: p.show_on_site ?? true,
    }));
  },

  // PRESERVADO — usado em Home.jsx e Collections.jsx
  async getUniqueCollections() {
    const { data, error } = await supabase
      .from('products')
      .select('colecao')
      .not('colecao', 'is', null)
      .neq('colecao', '');

    if (error) throw error;

    const unique = [...new Set((data || []).map(p => p.colecao).filter(Boolean))];
    return unique as string[];
  },

  // PRESERVADO — usado em ProductForm.tsx
  async uploadImage(file: File): Promise<string> {
    const ext = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const filePath = `products/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(filePath, file, { upsert: false });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from('product-images')
      .getPublicUrl(filePath);

    return data.publicUrl;
  },

  // PRESERVADO — usado em ProductDetail.jsx
  async getById(id: string) {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    return {
      ...data,
      price: data.price ?? 0,
      stock: data.stock ?? 0,
      show_on_site: data.show_on_site ?? true,
    };
  },

  // NOVO — corrige o "Sincronizando infinito" no ProductForm
  async save(data: any, id?: string) {
    const payload = {
      ...data,
      price: Number(data.price) || 0,
      cost: Number(data.cost) || 0,
      stock: Number(data.stock) || 0,
      weight_kg: Number(data.weight_kg) || 0,
      supplier_id: data.supplier_id || null,
      show_on_site: data.show_on_site ?? true,
    };

    if (id) {
      const { data: result, error } = await supabase
        .from('products')
        .update(payload)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result;
    } else {
      const { data: result, error } = await supabase
        .from('products')
        .insert(payload)
        .select()
        .single();

      if (error) throw error;
      return result;
    }
  },

  // NOVO — Realtime para o site público
  subscribeToChanges(callback: () => void) {
    const channel = supabase
      .channel('products-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'products' },
        () => callback()
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  },

  // PRESERVADO — usado no ProductsModule e outros
  async remove(id: string) {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },
};
