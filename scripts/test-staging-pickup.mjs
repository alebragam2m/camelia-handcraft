import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { getServerClients } from '../server/clients.js';
import { createCheckoutHandler } from '../server/checkout.js';
import { applySession } from '../server/reservations.js';

const { supabase, stripe } = getServerClients();
const { data: products, error: productError } = await supabase
  .from('products').select('id,nome,price,stock')
  .eq('show_on_site', true).eq('is_insumo', false).eq('is_preorder', false).gt('stock', 0).limit(1);
assert.ifError(productError);
assert.ok(products?.length, 'Nenhum produto público com estoque.');
const product = products[0];

async function createAndCancel(deliveryMethod) {
  const requestId = randomUUID();
  const customer = deliveryMethod === 'pickup'
    ? { nome: 'Teste Retirada', email: 'alebragam2m@gmail.com', telefone: '91999999999', delivery_method: 'pickup', estado: 'PA' }
    : { nome: 'Teste Entrega', email: 'alebragam2m@gmail.com', telefone: '91999999999', delivery_method: 'delivery', endereco: 'Rua Teste', cidade: 'Belém', estado: 'PA' };
  const req = { method: 'POST', headers: {}, body: {
    requestId, customer,
    cartItems: [{ id: product.id, quantity: 1, price: Number(product.price) }],
  } };
  const res = { statusCode: 0, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; } };
  await createCheckoutHandler({ supabase, stripe, siteUrl: process.env.SITE_URL, logger: console })(req, res);
  assert.equal(res.statusCode, 200, JSON.stringify(res.body));
  const session = await stripe.checkout.sessions.retrieve(res.body.sessionId);
  const expected = Math.round(Number(product.price) * 100) + (deliveryMethod === 'delivery' ? 1500 : 0);
  assert.equal(session.amount_total, expected);
  const { data: sale, error: saleError } = await supabase.from('sales')
    .select('shipping_cost,shipping_address').eq('stripe_session_id', session.id).single();
  assert.ifError(saleError);
  assert.equal(Number(sale.shipping_cost), deliveryMethod === 'delivery' ? 15 : 0);
  assert.equal(sale.shipping_address.delivery_method, deliveryMethod);
  const expired = await stripe.checkout.sessions.expire(session.id);
  await applySession(supabase, requestId, expired, `test-${deliveryMethod}-${requestId}`);
  return { method: deliveryMethod, amount: session.amount_total / 100, shipping: Number(sale.shipping_cost) };
}

const results = [await createAndCancel('pickup'), await createAndCancel('delivery')];
const { data: refreshed, error: refreshError } = await supabase.from('products').select('stock').eq('id', product.id).single();
assert.ifError(refreshError);
assert.equal(Number(refreshed.stock), Number(product.stock));
console.log(JSON.stringify({ success: true, product: product.nome, results, stockBefore: Number(product.stock), stockAfter: Number(refreshed.stock), secretsPrinted: false }, null, 2));
