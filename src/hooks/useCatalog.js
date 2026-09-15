import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export function useCatalog() {
  return useQuery({
    queryKey: ['catalog'],
    queryFn: async ({ signal }) => {
      // A view já filtra show_on_site/is_insumo — ver supabase/fix-rls.sql.
      const { data, error } = await supabase.from('storefront_products')
        .select('*')
        .order('nome')
        .abortSignal(signal);
      if (error) throw error;
      return data || [];
    },
    staleTime: 0,
    refetchInterval: 30000,
  });
}
