import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
function docker(args, input = '') {
  return new Promise((resolve, reject) => {
    const p = spawn('docker', args); let out = '', err = '';
    p.stdout.on('data', b => { out += b; }); p.stderr.on('data', b => { err += b; });
    p.on('error', reject); p.on('close', code => code ? reject(new Error(err)) : resolve(out.trim()));
    p.stdin.on('error', reject); p.stdin.end(input);
  });
}
const sql = (input, db = 'camelia_checkout_test') => docker(['exec','-i','camelia-roadmap-db','psql','-X','-q','-A','-t','-v','ON_ERROR_STOP=1','-U','postgres','-d',db], input);
if (await sql("select count(*) from pg_database where datname='camelia_checkout_test';", 'postgres') === '0') await docker(['exec','camelia-roadmap-db','createdb','-U','postgres','camelia_checkout_test']);
await sql(readFileSync(new URL('../tests/database/checkout-fixture.sql', import.meta.url),'utf8'));
const schema = readFileSync(new URL('../supabase/schema-current.sql', import.meta.url),'utf8');
const section = schema.split('-- CHECKOUT_RESERVATIONS_BEGIN')[1].split('-- CHECKOUT_RESERVATIONS_END')[0];
await sql('ALTER TABLE sales ADD COLUMN IF NOT EXISTS checkout_managed boolean NOT NULL DEFAULT false;');
// Carrega também os gatilhos existentes, para detectar baixa/estorno duplicados.
for (const name of ['handle_stock_on_paid_sale','handle_sale_cancellation','restore_stock_on_sale_item_delete']) {
 const start = schema.indexOf('CREATE OR REPLACE FUNCTION public.'+name+'(');
 const end = schema.indexOf('$function$;',start);
 await sql(schema.slice(start,end+'$function$;'.length));
}
await sql('BEGIN;'+section+'COMMIT;');
await sql('BEGIN;'+section+'COMMIT;');
await sql(`DROP TRIGGER IF EXISTS trigger_sync_stock_on_payment ON sales;
CREATE TRIGGER trigger_sync_stock_on_payment AFTER UPDATE ON sales FOR EACH ROW EXECUTE FUNCTION handle_stock_on_paid_sale();
DROP TRIGGER IF EXISTS trigger_handle_sale_cancellation ON sales;
CREATE TRIGGER trigger_handle_sale_cancellation BEFORE UPDATE ON sales FOR EACH ROW EXECUTE FUNCTION handle_sale_cancellation();
DROP TRIGGER IF EXISTS trigger_restore_stock_on_sale_item_delete ON sale_items;
CREATE TRIGGER trigger_restore_stock_on_sale_item_delete BEFORE DELETE ON sale_items FOR EACH ROW EXECUTE FUNCTION restore_stock_on_sale_item_delete();`);
const quote = x => "'" + String(x).replaceAll("'", "''") + "'";
const json = x => quote(JSON.stringify(x))+'::jsonb';
const a = '00000000-0000-0000-0000-000000000001', b = '00000000-0000-0000-0000-000000000002';
const customer = {nome:'Teste',email:'teste@example.test',telefone:'000',estado:'PA'};
const items = [{id:a,quantity:1,price:10}];
const call = (key, lines=items, person=customer, actor=null) => `select reserve_checkout(${quote(key)},${actor ? quote(actor) : 'NULL'},${json(person)},${json(lines)},'https://shop.example.test');`;
const parse = output => JSON.parse(output.split('\n').find(x=>x.startsWith('{')));
const reserve = async (...args) => parse(await sql('SET ROLE service_role;'+call(...args)));
const reset = async (stock=1) => sql(`TRUNCATE checkout_abandoned_attempts,checkout_events,checkout_reservations,inventory_logs,financial_transactions,sale_items,sales,clients,products,shipping_rates,auth.users;
INSERT INTO products VALUES('${a}','Peça A',${stock},10,2,true,false,false),('${b}','Peça B',${stock},20,4,true,false,false);
INSERT INTO shipping_rates VALUES('*',5);`);
const session = (key,r,status='open') => ({id:'cs_test_'+key.replaceAll('-',''),mode:'payment',currency:'brl',amount_total:1500,metadata:{requestId:key,saleId:r.sale_id},status,payment_status:status==='complete'?'paid':'unpaid',payment_intent:'pi_test'});
const apply = async (key,s,event=randomUUID()) => parse(await sql(`SET ROLE service_role;select apply_checkout_session(${quote(key)},${json(s)},${quote(event)});`));
await reset();
for(const role of ['anon','authenticated']) for(const sig of ['reserve_checkout(uuid,uuid,jsonb,jsonb,text)','apply_checkout_session(uuid,jsonb,text)','cancel_checkout_attempt(uuid,uuid)']) assert.equal(await sql(`select has_function_privilege('${role}', '${sig}', 'EXECUTE');`),'f');
for(const role of ['anon','authenticated']) await assert.rejects(sql(`SET ROLE ${role};select * from checkout_reservations;`));
for(const bad of [[{id:a,quantity:-1,price:10}],[{id:a,quantity:1.5,price:10}],[...items,...items],[{id:a,quantity:1,price:1}],[]]) await assert.rejects(reserve(randomUUID(),bad));
assert.equal(await sql('select count(*) from sales;'),'0');
assert.equal(await sql(`select stock from products where id='${a}';`),'1');
await sql('delete from shipping_rates;'); await assert.rejects(reserve(randomUUID()));
await sql("insert into shipping_rates values('*',5);");
// Última unidade em duas conexões. Uma transação mantém o bloqueio por 0,5s.
const keys=[randomUUID(),randomUUID()];
const race=await Promise.allSettled(keys.map(k=>sql('BEGIN; SET ROLE service_role;'+call(k)+'SELECT pg_sleep(0.5);COMMIT;')));
assert.equal(race.filter(r=>r.status==='fulfilled').length,1);
assert.equal(await sql('select count(*) from sales;'),'1');
assert.equal(await sql('select count(*) from sale_items;'),'1');
assert.equal(await sql('select count(*) from inventory_logs;'),'1');
const winner=race.findIndex(r=>r.status==='fulfilled'), key=keys[winner], r=parse(race[winner].value);
assert.equal((await reserve(key)).sale_id,r.sale_id);
await assert.rejects(reserve(key,items,{...customer,nome:'Outra'}));
await assert.rejects(sql(`SET ROLE authenticated;update sales set status='Cancelada' where id='${r.sale_id}';`));
await assert.rejects(sql(`SET ROLE authenticated;delete from sale_items where sale_id='${r.sale_id}';`));
await assert.rejects(sql(`SET ROLE authenticated;update sale_items set quantity=2 where sale_id='${r.sale_id}';`));
await assert.rejects(sql(`SET ROLE authenticated;update sales set checkout_managed=false where id='${r.sale_id}';`));
const paid=session(key,r,'complete');
await assert.rejects(apply(key,{...paid,amount_total:1}));
const event=randomUUID(); await Promise.all([apply(key,paid,event),apply(key,paid,event),apply(key,paid)]);
assert.equal(await sql('select count(*) from financial_transactions;'),'1');
assert.equal(await sql(`select stock from products where id='${a}';`),'0');
await apply(key,session(key,r,'expired'));
assert.equal(await sql('select status from sales;'),'Paga');
assert.equal(await sql('select count(*) from financial_transactions;'),'1');
// Reaplicar migração não modifica saldos, histórico ou estado.
await sql('BEGIN;'+section+'COMMIT;');
assert.equal(await sql(`select stock from products where id='${a}';`),'0');
assert.equal(await sql('select count(*) from financial_transactions;'),'1');
await reset();
const k2=randomUUID(), r2=await reserve(k2), expired=session(k2,r2,'expired');
await Promise.all([apply(k2,expired),apply(k2,expired)]);
assert.equal(await sql(`select stock from products where id='${a}';`),'1');
assert.equal(await sql('select count(*) from inventory_logs;'),'2');
assert.equal(await sql('select count(*) from financial_transactions;'),'0');
assert.equal((await reserve(k2)).state,'expired');
await assert.rejects(apply(k2,session(k2,r2,'complete')));
// Falha no segundo item reverte pedido, itens, primeiro desconto e logs.
await reset();
await sql(`ALTER TABLE inventory_logs ADD CONSTRAINT fixture_second_item CHECK(product_id<>'${b}');`);
try { await assert.rejects(reserve(randomUUID(),[...items,{id:b,quantity:1,price:20}])); }
finally { await sql('ALTER TABLE inventory_logs DROP CONSTRAINT fixture_second_item;'); }
assert.equal(await sql('select count(*) from sales;'),'0');
assert.equal(await sql('select count(*) from inventory_logs;'),'0');
assert.equal(await sql('select sum(stock) from products;'),'2');
// Carrinhos em ordem inversa não entram em deadlock.
await reset(2);
const both=[...items,{id:b,quantity:1,price:20}];
await Promise.all([reserve(randomUUID(),both),reserve(randomUUID(),[...both].reverse())]);
assert.equal(await sql('select sum(stock) from products;'),'0');
// Mesma chave concorrente cria somente um pedido.
await reset();
const same=randomUUID();const duplicates=await Promise.all([reserve(same),reserve(same)]);
assert.equal(duplicates[0].sale_id,duplicates[1].sale_id);
assert.equal(await sql('select count(*) from sales;'),'1');
// Cancelar antes de a reserva chegar impede que a requisição atrasada a crie.
await reset();
const abandoned=randomUUID();
await sql('SET ROLE service_role;select cancel_checkout_attempt('+quote(abandoned)+',NULL);');
await assert.rejects(reserve(abandoned));
assert.equal(await sql('select count(*) from sales;'),'0');
// Identidade é verificada no banco, além do servidor.
const actor=randomUUID();
await assert.rejects(reserve(randomUUID(),items,customer,actor));
await sql('INSERT INTO auth.users VALUES('+quote(actor)+','+quote(customer.email)+',now());');
const owned=randomUUID(), ownedSale=await reserve(owned,items,customer,actor);
await assert.rejects(sql('SET ROLE service_role;select cancel_checkout_attempt('+quote(owned)+',NULL);'));
assert.equal(await sql('select count(*) from clients;'),'1');
// Falha no financeiro reverte confirmação; evento pode ser entregue novamente.
await sql("ALTER TABLE financial_transactions ADD CONSTRAINT fixture_revenue CHECK(amount<0);");
const retryEvent=randomUUID();
try { await assert.rejects(apply(owned,session(owned,ownedSale,'complete'),retryEvent)); }
finally { await sql('ALTER TABLE financial_transactions DROP CONSTRAINT fixture_revenue;'); }
assert.equal(await sql('select status from sales;'),'Pendente');
assert.equal(await sql('select count(*) from checkout_events;'),'0');
await apply(owned,session(owned,ownedSale,'complete'),retryEvent);
await sql('GRANT SELECT,UPDATE,DELETE,INSERT ON financial_transactions TO authenticated;');
await assert.rejects(sql('SET ROLE authenticated;delete from financial_transactions;'));
assert.equal(await sql('select count(*) from financial_transactions;'),'1');
console.log('Checkout PostgreSQL: concorrência, idempotência, pagamento/expiração, rollback, permissões e reaplicação aprovados.');
