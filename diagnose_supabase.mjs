// Teste completo: simula o que o Checkout faz ao criar um pedido
const SUPABASE_URL = 'https://hyheltgxnkbmqiugbztb.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5aGVsdGd4bmtibXFpdWdienRiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM1MTY3MzIsImV4cCI6MjA4OTA5MjczMn0.S4czNK382C0SHj0NM793dHFQRWPekVS_UsEBKUWDLWY';

async function getColumns(table) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}?limit=0&select=*`, {
    headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`, 'Prefer': 'return=representation' }
  });
  // Get columns by inserting a dummy row  
  const r2 = await fetch(`${SUPABASE_URL}/rest/v1/rpc/version`, {
    headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
  });
  return r.status;
}

// Check if the key columns exist via fetch
async function checkTableCols(table, needed) {
  // We can't get schema metadata directly via REST without service_role
  // instead verify by trying to upsert with specific columns
  console.log(`\n=== Verificando tabela: ${table} ===`);
  needed.forEach(c => console.log(`  Esperado: ${c}`));
}

// Vamos verificar se as tabelas respondem corretamente agora
const tables = [
  { name: 'products', cols: ['nome', 'stock', 'price', 'category', 'colecao', 'image_url'] },
  { name: 'clients', cols: ['nome', 'email', 'telefone', 'address', 'city', 'state'] },
  { name: 'sales', cols: ['client_id', 'client_name', 'payment_method', 'total_amount', 'status', 'stripe_session_id'] },
  { name: 'sale_items', cols: ['sale_id', 'product_id', 'quantity', 'unit_price', 'unit_cost'] },
];

for (const t of tables) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${t.name}?limit=1&select=${t.cols.join(',')}`, {
    headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
  });
  const data = await r.json();
  const ok = r.status === 200 && !data?.message?.includes('Could not find');
  console.log(`${ok ? '✅' : '❌'} ${t.name} — HTTP ${r.status} ${!ok ? JSON.stringify(data) : 'OK'}`);
}
