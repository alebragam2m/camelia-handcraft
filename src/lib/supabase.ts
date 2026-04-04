import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/supabase';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('[Supabase] Credenciais ausentes. Verifique o arquivo .env');
}

/**
 * Cliente Supabase com Tipagem Estrita (Mission Critical)
 * 
 * RESOLUÇÃO DE CONFLITO (Session Lock):
 * Removido o storageKey customizado para evitar o erro "Lock swallowed/stolen" em múltiplas abas.
 */
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    // Removido storageKey para estabilidade multi-aba
    flowType: 'pkce',
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});
