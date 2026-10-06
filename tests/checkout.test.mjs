import test from 'node:test';
import assert from 'node:assert/strict';
import { createPaymentStatusHandler } from '../server/payment-status.js';

const product = { id: 'product-test', nome: 'Peça', price: 10, cost: 2, stock: 2, show_on_site: true };
const customer = { nome: 'Compradora', email: 'cliente@example.test', telefone: '12345', endereco: 'Rua Teste, 1', cidade: 'Belém', estado: 'PA' };
function setup(options = {}) {
  const operations = [];
  const db = { auth: { getUser: async token => { operations.push({ auth: token }); return options.auth || { data: { user: { id: 'user-a', email: customer.email, email_confirmed_at: '2026-01-01' } }, error: null }; } }, from(table) {
    const operation = { table, filters: [] }; operations.push(operation);
    const query = {
      select(columns) { operation.columns = columns; return query; },
      in(key, value) { operation.filters.push([key, value]); return query; },
      eq(key, value) { operation.filters.push([key, value]); return query; },
      upsert(payload, config) { operation.action = 'upsert'; operation.payload = payload; operation.config = config; return query; },
      insert(payload) { operation.action = 'insert'; operation.payload = payload; return query; },
      update(payload) { operation.action = 'update'; operation.payload = payload; return query; },
      single() { return Promise.resolve(result()); }, maybeSingle() { return Promise.resolve(result()); },
      then(resolve, reject) { return Promise.resolve(result()).then(resolve, reject); },
    };
    function result() {
      if (options.failTable === table && (!options.failAction || options.failAction === operation.action)) return { data: null, error: { message: 'PRIVATE DATABASE ERROR' } };
      if (table === 'products') return { data: [product] };
      if (table === 'shipping_rates') return { data: options.rates ?? [{ state: '*', cost: 5 }] };
      if (table === 'clients') return { data: { id: 'client-a', stripe_customer_id: 'cus_should_never_be_used' } };
      if (table === 'sales') return { data: { id: 'sale-a', status: options.saleStatus || 'Paga', total_amount: 15 } };
      return { data: null };
    }
    return query;
  } };
  const stripe = { checkout: { sessions: {
    create: async payload => { operations.push({ stripe: 'create', payload }); if (options.stripeFailure) throw new Error('PRIVATE STRIPE ERROR'); return { id: 'cs_test_12345678', url: 'https://checkout.stripe.com/test' }; },
    expire: async id => operations.push({ stripe: 'expire', id }),
    retrieve: async () => ({ mode: 'payment', metadata: { saleId: 'sale-a' }, currency: 'brl', amount_total: 1500, payment_status: 'paid', status: 'complete', ...options.session }),
  } } };
  const res = { code: null, headers: {}, setHeader(key, value) { this.headers[key] = value; }, status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; } };
  const req = { method: 'POST', headers: { origin: 'https://untrusted.example' }, body: { cartItems: [{ id: product.id, quantity: 1, price: 10 }], customer: { ...customer } } };
  return { operations, db, stripe, res, req, dependencies: { supabase: db, stripe, siteUrl: 'https://shop.example.test', logger: { error() {} } } };
}

test('payment confirmation requires matching paid Stripe session AND paid order', async () => {
  for (const [options, expected] of [[{}, 'paid'], [{ saleStatus: 'Pendente' }, 'pending'], [{ session: { payment_status: 'unpaid' } }, 'pending'], [{ saleStatus: 'Cancelada' }, 'cancelled'], [{ session: { status: 'expired', payment_status: 'unpaid' } }, 'expired']]) {
    const f = setup(options); f.req.body = { sessionId: 'cs_test_12345678' };
    await createPaymentStatusHandler(f.dependencies)(f.req, f.res);
    assert.equal(f.res.code, 200); assert.equal(f.res.body.status, expected);
    assert.equal(f.res.headers['Cache-Control'], 'no-store');
    assert.deepEqual(Object.keys(f.res.body.order).sort(), ['id', 'total']);
  }
});

test('missing sessions and amount/currency mismatches never confirm payment', async () => {
  const missing = setup(); missing.req.body = {};
  await createPaymentStatusHandler(missing.dependencies)(missing.req, missing.res); assert.equal(missing.res.code, 400);
  for (const session of [{ amount_total: 1 }, { currency: 'usd' }]) {
    const f = setup({ session }); f.req.body = { sessionId: 'cs_test_12345678' };
    await createPaymentStatusHandler(f.dependencies)(f.req, f.res); assert.equal(f.res.code, 503);
    assert.equal(f.res.body.status, undefined);
  }
});
