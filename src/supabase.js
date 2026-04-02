import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// O Supabase gerencia os locks de autenticação internamente. 
// Remoção de limpezas manuais para evitar conflitos de 'lock theft' durante o Refresh.

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    multiTab: false,
  },
  global: {
    fetch: (...args) => {
      // Custom fetch para nunca travar infinitamente 
      const [resource, config] = args;
      const timeout = 8000;
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), timeout);
      return fetch(resource, {
        ...config,
        signal: controller.signal
      }).then(res => {
        clearTimeout(id);
        return res;
      }).catch(err => {
        clearTimeout(id);
        throw err;
      });
    }
  }
});
