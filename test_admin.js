import { createClient } from '@supabase/supabase-js';

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(url, key);

async function check() {
  const { data, error } = await supabase.from('admin_users').select('*');
  console.log('ADMIN USERS:', data);
  console.log('ERRO:', error);
}
check();
