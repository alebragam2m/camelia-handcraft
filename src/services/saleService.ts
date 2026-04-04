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
  }
};
