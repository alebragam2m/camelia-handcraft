import { supabase } from '../lib/supabase';

export interface ShippingRate {
  state: string;
  label: string | null;
  cost: number;
  estimated_days: number | null;
  updated_at: string;
}

export const shippingRateService = {
  async getAll(): Promise<ShippingRate[]> {
    const { data, error } = await supabase
      .from('shipping_rates')
      .select('*')
      .order('state');

    if (error) throw new Error(`Falha ao carregar tabela de frete: ${error.message}`);
    return data || [];
  },

  async save(payload: Partial<ShippingRate>): Promise<ShippingRate> {
    const { data, error } = await supabase
      .from('shipping_rates')
      .upsert({ ...payload, updated_at: new Date().toISOString() }, { onConflict: 'state' })
      .select()
      .single();

    if (error) throw new Error(`Erro ao salvar frete: ${error.message}`);
    return data;
  },

  async remove(state: string): Promise<void> {
    const { error } = await supabase.from('shipping_rates').delete().eq('state', state);
    if (error) throw new Error(`Erro ao excluir frete: ${error.message}`);
  },
};
