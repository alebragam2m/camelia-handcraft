import { supabase } from '../lib/supabase';

/**
 * SERVIÇO FINANCEIRO - CAMÉLIA (MISSION CRITICAL)
 * 
 * PILLAR 1: TypeScript
 */
export const financialService = {
  async getAll(): Promise<any[]> {
    const { data, error } = await supabase
      .from('financial_transactions')
      .select('*')
      .order('due_date', { ascending: false });

    if (error) throw new Error(`Falha ao carregar transações: ${error.message}`);
    return data || [];
  },

  async save(payload: any, id?: string): Promise<any> {
    const isUpdate = !!id;
    let query;

    if (isUpdate) {
      query = supabase.from('financial_transactions').update(payload).eq('id', id).select().single();
    } else {
      query = supabase.from('financial_transactions').insert([payload]).select().single();
    }

    const { data, error } = await query;
    if (error) throw new Error(`Erro ao salvar transação: ${error.message}`);
    return data;
  },

  async remove(id: string): Promise<void> {
    const { error } = await supabase.from('financial_transactions').delete().eq('id', id);
    if (error) throw new Error(`Erro ao excluir transação: ${error.message}`);
  }
};
