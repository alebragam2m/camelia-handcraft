import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

let clients;
export function getServerClients() {
  if (clients) return clients;
  const { STRIPE_SECRET_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
  if (!STRIPE_SECRET_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) throw new Error('Configuração do servidor incompleta.');
  clients = {
    stripe: new Stripe(STRIPE_SECRET_KEY),
    supabase: createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    }),
  };
  return clients;
}
