import { QueryClient } from '@tanstack/react-query';

/**
 * Motor de Sincronização Inteligente (Mission Critical)
 * 
 * PILLAR 2: TanStack Query
 * - Gerenciamento Automático de Cache
 * - Retentativas de Conexão (Power Resilience)
 * - Sincronização em Background
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // 1 minuto (o dado é considerado 'fresco' por 1m)
      gcTime: 1000 * 60 * 10, // Manter em cache por 10 minutos
      retry: 3, // Tentar 3 vezes em caso de erro de rede (eliminando falhas intermitentes)
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000), // Backoff exponencial
      refetchOnWindowFocus: true, // Atualizar ao voltar para a aba (Admin sempre atualizado)
      refetchOnReconnect: 'always',
    },
    mutations: {
      retry: 1, // Mutações tentam apenas uma vez em caso de conflito, mas retentam rede.
    },
  },
});
