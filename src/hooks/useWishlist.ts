import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export function useWishlist() {
  const queryClient = useQueryClient();

  // Passo 1: verifica sessão ativa. retry:false evita retentativas em usuários anônimos.
  const { data: authUser = null } = useQuery({
    queryKey: ['auth-user'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user ?? null;
    },
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  // Passo 2: resolve client_id — só roda se houver usuário autenticado.
  const { data: clientId = null } = useQuery({
    queryKey: ['wishlist-client-id', authUser?.email],
    queryFn: async () => {
      const { data } = await supabase
        .from('clients')
        .select('id')
        .eq('email', authUser!.email!)
        .single();
      return data?.id ?? null;
    },
    enabled: !!authUser?.email,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  // Passo 3: busca IDs salvos — só roda se client_id existir.
  const { data: wishlistIds = [] } = useQuery<string[]>({
    queryKey: ['wishlist', clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('wishlists')
        .select('product_id')
        .eq('client_id', clientId);
      if (error) throw error;
      return (data ?? []).map((w: { product_id: string }) => w.product_id);
    },
    enabled: !!clientId,
    retry: false,
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

  return { wishlistIds, clientId, authUser, toggle };
}
