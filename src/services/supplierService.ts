import { supabase } from '../lib/supabase';
import type { Supplier } from '../types/supabase';

/**
 * SERVIÇO DE FORNECEDORES - CAMÉLIA (MISSION CRITICAL)
 * 
 * PILLAR 1: TypeScript Estrito
 */
export const supplierService = {
  async getAll(): Promise<Supplier[]> {
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .order('name');

    if (error) throw new Error(`Falha ao carregar fornecedores: ${error.message}`);
    return data || [];
  },

  async save(payload: Partial<Supplier>, id?: string): Promise<Supplier> {
    const isUpdate = !!id;
    let query;

    if (isUpdate) {
      query = supabase.from('suppliers').update(payload).eq('id', id).select().single();
    } else {
      // @ts-ignore
      query = supabase.from('suppliers').insert([payload]).select().single();
    }

    const { data, error } = await query;
    if (error) throw new Error(`Erro ao salvar fornecedor: ${error.message}`);
    if (!data) throw new Error('Falha na persistência do fornecedor.');
    
    return data;
  },

  async remove(id: string): Promise<void> {
    const { error } = await supabase.from('suppliers').delete().eq('id', id);
    if (error) throw new Error(`Erro ao excluir fornecedor: ${error.message}`);
  }
};
