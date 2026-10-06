import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { getServerClients } from '../server/clients.js';
import { createCheckoutHandler } from '../server/checkout.js';
import { applySession } from '../server/reservations.js';

const { supabase, stripe } = getServerClients();
const { data: products, error: productError } = await supabase
  .from('products')
  .select('id,nome,price,stock')
  .eq('show_on_site', true)
  .eq('is_insumo', false)
  .eq('is_preorder', false)
  .gt('stock', 0)
  .limit(1);
assert.ifError(productError);
assert.ok(products?.length, 'Nenhum produto público com estoque para testar.');

const product = products[0];
const requestId = randomUUID();
const req = {
  method: 'POST', headers: {},
  body: {
    requestId,
    cartItems: [{ id: product.id, quantity: 1, price: Number(product.price) }],
    customer: {
      nome: 'Teste Pix Homologação', email: 'alebragam2m@gmail.com',
      telefone: '91999999999', endereco: 'Endereço de homologação',
      cidade: 'Belém', estado: 'PA', cep: '66000000', numero: '1', bairro: 'Centro',
    },
  },
};
const res = { statusCode: 0, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; } };

await createCheckoutHandler({ supabase, stripe, siteUrl: process.env.SITE_URL, logger: console })(req, res);
assert.equal(res.statusCode, 200, JSON.stringify(res.body));
const session = await stripe.checkout.sessions.retrieve(res.body.sessionId);
assert.deepEqual([...session.payment_method_types].sort(), ['card', 'pix']);

const expired = await stripe.checkout.sessions.expire(session.id);
await applySession(supabase, requestId, expired, `test-pix-${requestId}`);

const [{ data: refreshed, error: refreshError }, { data: sale, error: saleError }] = await Promise.all([
  supabase.from('products').select('stock').eq('id', product.id).single(),
  supabase.from('sales').select('status,payment_method').eq('stripe_session_id', session.id).single(),
]);
assert.ifError(refreshError);
assert.ifError(saleError);
assert.equal(Number(refreshed.stock), Number(product.stock));
assert.equal(sale.status, 'Cancelada');

console.log(JSON.stringify({
  success: true,
  methods: session.payment_method_types,
  product: product.nome,
  stockBefore: Number(product.stock),
  stockAfter: Number(refreshed.stock),
  cancelledSaleMethod: sale.payment_method,
  secretsPrinted: false,
}, null, 2));
