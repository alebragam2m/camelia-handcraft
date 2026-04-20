import { supabase } from '../lib/supabase';

/**
 * SERVIÇO DE ESTOQUE (PCP/LOGS) - CAMÉLIA (MISSION CRITICAL)
 * 
 * PILLAR 1: TypeScript
 */
export const stockService = {
  async getLogs(productId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('inventory_logs')
      .select('*')
      .eq('product_id', productId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(`Falha ao buscar logs de estoque: ${error.message}`);
    return data || [];
  },

  /**
   * Ajuste de Estoque via RPC (Segurança Atômica)
   */
  async adjust(productId: string, quantity: number, type: 'ENTRADA' | 'SAIDA', notes: string = ''): Promise<any> {
    const { data, error } = await supabase.rpc('handle_inventory_adjustment', {
      p_product_id: productId,  // UUID string — NÃO converter para int
      p_quantity: quantity,
      p_type: type,
      p_notes: notes,
    });

    if (error) throw new Error(`Falha no ajuste de estoque: ${error.message}`);
    return data;
  }
};
