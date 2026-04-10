import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/supabase';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('[Supabase] Credenciais ausentes. Verifique o arquivo .env');
}

// Limpeza de localStorage corrompido — roda uma vez por deploy.
// Remove apenas chaves sb-* (Supabase auth/PKCE) sem afetar carrinho ou preferências.
const DEPLOY_STAMP = '2d3afd2-lockfix';
if (typeof window !== 'undefined' && localStorage.getItem('deploy_stamp') !== DEPLOY_STAMP) {
  Object.keys(localStorage)
    .filter(k => k.startsWith('sb-'))
    .forEach(k => localStorage.removeItem(k));
  localStorage.setItem('deploy_stamp', DEPLOY_STAMP);
}

/**
 * Cliente Supabase Singleton (Mission Critical)
 *
 * storageKey fixo: isola a sessão desta app de outras instâncias
 * do Supabase no mesmo domínio, evitando o erro "Lock stolen".
 *
 * flowType 'implicit' elimina o lock do PKCE code_verifier que
 * causava o conflito "lock:sb-...-auth-token was released because
 * another request stole it" ao abrir múltiplas abas.
 */
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'camelia-auth',
    flowType: 'implicit',
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});
