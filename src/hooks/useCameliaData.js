import useSWR, { mutate } from 'swr';
import { useEffect } from 'react';
import { supabase } from '../supabase';
import { db } from '../services/db';

/**
 * Fetcher inteligente que integra com as funções existentes de db.js
 */
const fetcher = async (key) => {
  console.log(`[SWR Fetching]: ${key}`);
  switch (key) {
    case 'products': return db.getProducts();
    case 'sales': return db.getSales();
    case 'clients': return db.getClients();
    case 'suppliers': return db.getSuppliers();
    case 'transactions': return db.getTransactions();
    default: return null;
  }
};

/**
 * Hook Camelía Data (SWR + Realtime Sync)
 * @param {string} key - A chave dos dados (ex: 'sales', 'products')
 */
export function useCameliaData(key) {
  const { data, error, mutate: swrMutate } = useSWR(key, fetcher, {
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    dedupingInterval: 5000,
    // refreshInterval: 60000, // Fallback a cada 1 minuto se o WebSocket falhar
  });

  // --- LÓGICA DE REALTIME BROADCAST (VEREDITO TÉCNICO) ---
  useEffect(() => {
    if (!key) return;

    // Criar canal de escuta para atualizações do banco
    const channel = supabase.channel('camelia_db_changes')
      .on('broadcast', { event: 'db_update' }, ({ payload }) => {
        if (payload.key === key || payload.key === 'all') {
          console.log(`[Realtime Update] Recebida atualização para: ${payload.key}`);
          swrMutate(); // Revalida os dados instantaneamente sem refresh de página
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [key, swrMutate]);

  return {
    data,
    isLoading: !error && !data,
    isError: error,
    mutate: (newData, options = {}) => swrMutate(newData, { revalidate: true, ...options }),
  };
}

/**
 * Utilitário Global para disparar atualizações em tempo real (Broadcast)
 */
export const notifyDbUpdate = async (key = 'all') => {
  console.log(`[Broadcasting Update]: ${key}`);
  await supabase.channel('camelia_db_changes').send({
    type: 'broadcast',
    event: 'db_update',
    payload: { key, timestamp: new Date().toISOString() },
  });
};
