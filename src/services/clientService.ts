import { supabase } from '../lib/supabase';
import type { Client } from '../types/supabase';

/**
 * SERVIÇO DE CLIENTES (CRM) - CAMÉLIA (MISSION CRITICAL)
 * 
 * PILLAR 1: TypeScript Estrito
 */
export const clientService = {
  async getAll(): Promise<Client[]> {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('full_name');

    if (error) throw new Error(`Falha ao carregar CRM: ${error.message}`);
    return data || [];
  },

  async save(payload: Partial<Client>, id?: string): Promise<Client> {
    const isUpdate = !!id;
    
    // Tratamento de segurança para e-mails não preenchidos (evitar Constraint clients_email_key)
    if (payload.email === '') {
       payload.email = null as any;
    }

    let query;

    if (isUpdate) {
      query = supabase.from('clients').update(payload).eq('id', id).select().single();
    } else {
      // @ts-ignore
      query = supabase.from('clients').insert([payload]).select().single();
    }

    const { data, error } = await query;
    if (error) throw new Error(`Erro ao salvar cliente: ${error.message}`);
    if (!data) throw new Error('Falha na persistência do cliente.');
    
    return data;
  },

  async remove(id: string): Promise<void> {
    const { error } = await supabase.from('clients').delete().eq('id', id);
    if (error) throw new Error(`Erro ao excluir cliente: ${error.message}`);
  }
};
