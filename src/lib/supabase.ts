import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/supabase';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('[Supabase] Credenciais ausentes. Verifique o arquivo .env');
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
    // Bypassa o mecanismo de lock interno do Supabase Auth.
    // lock:false não é válido — a prop espera uma função.
    // Chamadas concorrentes (ProtectedRoute + App.tsx + AdminDashboard)
    // competiam pelo mesmo lock 'camelia-auth' e causavam o erro
    // "was released because another request stole it".
    lock: (_name: string, _acquireTimeout: number, fn: () => Promise<unknown>) => fn(),
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});
