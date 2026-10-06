import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';

// Alvo fixo; nenhum segredo ou URL remoto é carregado.
function sql(input) {
  return new Promise((resolve, reject) => {
    const child = spawn('docker', ['exec', '-i', 'camelia-roadmap-db', 'psql',
      '-X', '-q', '-A', '-t', '-v', 'ON_ERROR_STOP=1', '-U', 'postgres', '-d', 'camelia_test']);
    let out = '', err = '';
    child.stdout.on('data', data => { out += data; });
    child.stderr.on('data', data => { err += data; });
    child.on('error', reject);
    child.on('close', code => code === 0 ? resolve(out.trim()) : reject(new Error(err)));
    child.stdin.on('error', reject);
    child.stdin.end(input);
  });
}
const id = '00000000-0000-0000-0000-000000000001';
const call = (qty, type = "'SAIDA'", reason = "''") =>
  `select public.handle_inventory_adjustment('${id}', ${qty}, ${type}, ${reason});`;
const result = output => JSON.parse(output.split('\n').find(line => line.startsWith('{')));
const rpc = async (qty, level = 2, type = "'SAIDA'", reason) => result(await sql(
  `SET ROLE authenticated; SET test.admin_level='${level}'; ${call(qty, type, reason)}`));

await sql(readFileSync(new URL('../tests/database/inventory-fixture.sql', import.meta.url), 'utf8'));
const schema = readFileSync(new URL('../supabase/schema-current.sql', import.meta.url), 'utf8');
const start = schema.indexOf('CREATE OR REPLACE FUNCTION public.handle_inventory_adjustment(');
const endMarker = 'GRANT EXECUTE ON FUNCTION public.handle_inventory_adjustment(uuid, integer, text, text) TO authenticated;';
const end = schema.indexOf(endMarker, start);
assert.ok(start >= 0 && end > start, 'Função consolidada encontrada');
const migration = schema.slice(start, end + endMarker.length);
await sql(migration);
await sql(migration);
assert.equal(await sql('select stock from products;'), '1');
for (const qty of ['NULL', '0', '-1']) assert.equal((await rpc(qty)).success, false);
for (const level of [0, 1]) assert.equal((await rpc(1, level)).success, false);
for (const type of ['NULL', "'INVALIDO'"]) assert.equal((await rpc(1, 2, type)).success, false);
assert.equal(await sql('select count(*) from inventory_logs;'), '0');
assert.equal(await sql("select has_function_privilege('anon', 'public.handle_inventory_adjustment(uuid,integer,text,text)', 'EXECUTE');"), 'f');
const concurrent = await Promise.all([1, 2].map(() => sql(
  `BEGIN; SET ROLE authenticated; SET test.admin_level='2'; ${call(1)} SELECT pg_sleep(0.5); COMMIT;`)));
assert.deepEqual(concurrent.map(result).map(r => r.success).sort(), [false, true]);
assert.equal(await sql('select stock from products;'), '0');
assert.equal(await sql('select count(*) from inventory_logs;'), '1');
assert.equal((await rpc(2, 2, "'ENTRADA'")).new_stock, 2);
await sql("ALTER TABLE inventory_logs ADD CONSTRAINT fixture_log_failure CHECK (reason <> 'FAIL');");
try {
  assert.equal((await rpc(1, 2, "'SAIDA'", "'FAIL'")).success, false);
  assert.equal(await sql('select stock from products;'), '2');
  assert.equal(await sql('select count(*) from inventory_logs;'), '2');
} finally {
  await sql('ALTER TABLE inventory_logs DROP CONSTRAINT fixture_log_failure;');
}
console.log('Banco local: reaplicação, permissões da RPC, validações, concorrência e rollback passaram.');
