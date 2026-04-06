import { createClient } from '@supabase/supabase-js';

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error("ERRO: Credenciais Supabase não encontradas no .env.local");
  process.exit(1);
}

const supabase = createClient(url, key);

async function check() {
  console.log('--- TESTE: CONEXÃO SUPABASE ---');
  console.log('URL da Vercel / DB:', url);
  const { data: prodData, error: prodErr } = await supabase.from('products').select('*');
  console.log(`Produtos contagem: ${prodData?.length} | Erro:`, prodErr || 'Nenhum');
  
  if (prodData && prodData.length === 0) {
     console.log("ALERTA: 0 PRODUTOS ENCONTRADOS. O banco pode estar vazio ou a RLS bloqueando.");
  }
}
check();
