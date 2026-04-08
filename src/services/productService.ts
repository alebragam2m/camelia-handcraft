import { supabase } from '../lib/supabase';
import type { Product } from '../types/supabase';

/**
 * SERVIÇO DE PRODUTOS - CAMÉLIA (MISSION CRITICAL)
 * 
 * PILLAR 1: TypeScript Estrito
 * - Garantia de tipos em todas as respostas do Supabase.
 * - Tratamento de Erros Robusto (Pillar 4).
 */
export const productService = {
  /**
   * Busca todos os produtos ativos com tratamento de erro
   */
  async getAll(): Promise<Product[]> {
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

  // Canal Realtime — usado no useEffect do ProductsPage
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

  /**
   * Busca um produto por ID
   */
  async getById(id: string): Promise<Product | null> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error(`[productService.getById] Erro (ID: ${id}):`, error.message);
      return null;
    }

    return data;
  },

  /**
   * Salva ou Atualiza um Produto (Upsert)
   */
  async save(payload: Partial<Product>, id?: string): Promise<Product> {
    const isUpdate = !!id;
    
    // Limpeza de Payload: Transforma strings vazias em null para campos opcionais (evita erro de UUID/URL)
    const cleanPayload = Object.fromEntries(
      Object.entries(payload).map(([key, value]) => [
        key, 
        value === '' ? null : value
      ])
    );

    let query;
    if (isUpdate) {
      query = supabase.from('products').update(cleanPayload).eq('id', id).select().single();
    } else {
      // @ts-ignore
      query = supabase.from('products').insert([cleanPayload]).select().single();
    }

    const { data, error } = await query;

    if (error) {
      console.error('[productService.save] Erro ao persistir dados:', error.message);
      throw new Error(`Erro de Sincronização: ${error.message}`);
    }

    if (!data) throw new Error('Nenhum dado retornado após o salvamento.');
    
    return data;
  },

  /**
   * Upload de imagem para o storage
   */
  async uploadImage(productId: string, file: File): Promise<string> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${productId}-${Date.now()}.${fileExt}`;
    const filePath = `products/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('camelia-public')
      .upload(filePath, file);

    if (uploadError) {
      throw new Error(`Upload falhou: ${uploadError.message}`);
    }

    const { data: { publicUrl } } = supabase.storage
      .from('camelia-public')
      .getPublicUrl(filePath);

    // Persiste a URL no registro do produto
    await this.save({ image_url: publicUrl }, productId);

    return publicUrl;
  },

  /**
   * Deleta um produto permanentemente
   */
  async remove(id: string): Promise<void> {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Falha ao excluir produto: ${error.message}`);
    }
  },

  /**
   * Busca coleções únicas para o catálogo dinâmico
   */
  async getUniqueCollections(): Promise<string[]> {
    const { data, error } = await supabase
      .from('products')
      .select('colecao')
      .not('colecao', 'is', null);

    if (error) return ['Flores', 'Natal', 'Círio']; // Fallback seguro
    
    const collections = data.map(i => i.colecao).filter(Boolean) as string[];
    return Array.from(new Set(collections)).sort();
  }
};
