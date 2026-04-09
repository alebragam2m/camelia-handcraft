import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

async function fetchClientId(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return null;
  const { data } = await supabase
    .from('clients')
    .select('id')
    .eq('email', user.email)
    .single();
  return data?.id ?? null;
}

export function useWishlist() {
  const queryClient = useQueryClient();

  const { data: clientId = null } = useQuery({
    queryKey: ['wishlist-client-id'],
    queryFn: fetchClientId,
    staleTime: 5 * 60 * 1000,
  });

  const { data: wishlistIds = [] } = useQuery<string[]>({
    queryKey: ['wishlist', clientId],
    queryFn: async () => {
      if (!clientId) return [];
      const { data, error } = await supabase
        .from('wishlists')
        .select('product_id')
        .eq('client_id', clientId);
      if (error) throw error;
      return (data ?? []).map((w: { product_id: string }) => w.product_id);
    },
    enabled: !!clientId,
  });

  const toggle = useMutation({
    mutationFn: async (productId: string) => {
      if (!clientId) throw new Error('login-required');
      const isSaved = wishlistIds.includes(productId);
      if (isSaved) {
        const { error } = await supabase
          .from('wishlists')
          .delete()
          .eq('client_id', clientId)
          .eq('product_id', productId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('wishlists')
          .insert({ client_id: clientId, product_id: productId });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist', clientId] });
    },
  });

  return { wishlistIds, clientId, toggle };
}
