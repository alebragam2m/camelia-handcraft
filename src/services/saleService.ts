import { supabase } from '../lib/supabase';
import type { Sale, SaleItem } from '../types/supabase';

/**
 * SERVIÇO DE VENDAS (MOTOR PRO V3) - CAMÉLIA (MISSION CRITICAL)
 * 
 * PILLAR 1: TypeScript Estrito
 */
export const saleService = {
  async getAll(): Promise<any[]> {
    const { data, error } = await supabase
      .from('sales')
      .select('*, clients(full_name, is_vip), sale_items(*, products(nome, image_url))')
      .order('created_at', { ascending: false });

    if (error) throw new Error(`Falha ao carregar vendas: ${error.message}`);
    return data || [];
  },

  /**
   * Processamento Atômico de Venda (Via RPC)
   * Garante que o estoque seja baixado e a venda registrada simultaneamente.
   */
  async processSale(saleData: Partial<Sale>, itemsData: Partial<SaleItem>[]): Promise<any> {
    const { data, error } = await supabase.rpc('process_sale', {
      sale_data: saleData,
      items_data: itemsData,
    });

    if (error) {
       console.error('[saleService.processSale] Falha na Transação Atômica:', error.message);
       throw new Error(`Erro Crítico na Venda: ${error.message}`);
    }
    
    return data;
  },

  async remove(id: string): Promise<void> {
    // 1. Apagar os itens filhos primeiro (foreign key)
    const { error: itemsError } = await supabase.from('sale_items').delete().eq('sale_id', id);
    if (itemsError) throw new Error(`Erro ao apagar itens da venda: ${itemsError.message}`);

    // 2. Apagar a venda
    const { error } = await supabase.from('sales').delete().eq('id', id);
    if (error) throw new Error(`Erro ao apagar venda: ${error.message}`);
  },
};
