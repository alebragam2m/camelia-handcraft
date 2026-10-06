import test from 'node:test';
import assert from 'node:assert/strict';
import { createCartStore, CART_KEY } from '../src/lib/cartStore.js';
import { requireRpcSuccess } from '../src/lib/rpcResult.js';

function memory(initial = null) {
  let raw = initial;
  return { getItem: () => raw, setItem: (_key, value) => { raw = value; } };
}
const item = { id: 'a', quantity: 2, cartLineId: 'line-a' };

test('redirect and cancellation preserve the cart; paid order subtracts only its snapshot once', async () => {
  const storage = memory(); const store = createCartStore({ storage });
  await store.changeItems(() => [item]);
  await store.rememberCheckout('session', [item]);
  assert.equal(store.getSnapshot().items[0].quantity, 2);
  await store.changeItems(items => [{ ...items[0], quantity: 3 }, { id: 'b', quantity: 1, cartLineId: 'line-b' }]);
  await store.completeCheckout('session');
  assert.deepEqual(store.getSnapshot().items.map(i => [i.id, i.quantity]), [['a', 1], ['b', 1]]);
  await store.completeCheckout('session');
  assert.equal(store.getSnapshot().items[0].quantity, 1);
  const reload = createCartStore({ storage }); await reload.completeCheckout('session');
  assert.equal(reload.getSnapshot().items[0].quantity, 1);
});

test('newly re-added product is preserved after returning from an older payment', async () => {
  const store = createCartStore({ storage: memory() });
  await store.changeItems(() => [item]); await store.rememberCheckout('session', [item]);
  await store.changeItems(() => [{ ...item, quantity: 1, cartLineId: 'new-line' }]);
  await store.completeCheckout('session'); assert.equal(store.getSnapshot().items[0].quantity, 1);
});

test('multiple tabs read the latest cart and cannot consume a payment twice under shared lock', async () => {
  const storage = memory(); let queue = Promise.resolve();
  const lock = task => { queue = queue.then(task); return queue; };
  const a = createCartStore({ storage, lock }); const b = createCartStore({ storage, lock });
  await a.changeItems(() => [item]); await a.rememberCheckout('session', [item]);
  await b.changeItems(items => [{ ...items[0], quantity: 3 }]);
  await Promise.all([a.completeCheckout('session'), b.completeCheckout('session')]);
  assert.equal(a.getSnapshot().items[0].quantity, 1); assert.equal(b.getSnapshot().items[0].quantity, 1);
});

test('legacy cart migrates without loss and unknown payment never clears items', async () => {
  const storage = memory(JSON.stringify([{ id: 'a', quantity: 2 }, { id: 'b', quantity: -1 }]));
  const store = createCartStore({ storage });
  assert.equal(store.getSnapshot().items.length, 1);
  await store.completeCheckout('unknown'); assert.equal(store.getSnapshot().items[0].quantity, 2);
  await store.rememberCheckout('session', store.getSnapshot().items);
  assert.ok(JSON.parse(storage.getItem(CART_KEY)).pending.session);
});

test('failed persistence cannot silently consume a payment or erase the cart', async () => {
  const store = createCartStore({ storage: { getItem: () => JSON.stringify([item]), setItem: () => { throw new Error('quota'); } } });
  await assert.rejects(store.rememberCheckout('session', [item]), /quota/);
  assert.equal(store.getSnapshot().items[0].quantity, 2);
});

test('RPC business failure throws even when the transport succeeded', () => {
  assert.throws(() => requireRpcSuccess({ success: false, error: 'Estoque insuficiente' }, null), /Estoque insuficiente/);
  assert.throws(() => requireRpcSuccess(null, null));
  assert.throws(() => requireRpcSuccess({ success: true }, { message: 'offline' }), /offline/);
  assert.equal(requireRpcSuccess({ success: true, new_stock: 2 }, null).new_stock, 2);
});

test('same pending checkout survives reload, changed cart and concurrent tabs', async () => {
  const storage = memory(); let queue = Promise.resolve();
  const lock = task => { const next = queue.then(task); queue = next.catch(() => {}); return next; };
  const a = createCartStore({ storage, lock, newId: () => 'request-a' });
  const b = createCartStore({ storage, lock, newId: () => 'request-b' });
  const [first, second] = await Promise.all([a.beginCheckout({ nome: 'A' }, [item], null), b.beginCheckout({ nome: 'B' }, [{...item, quantity:3}], null)]);
  assert.equal(first.requestId, second.requestId);
  assert.equal(second.customer.nome, 'A');
  assert.equal(second.items[0].quantity, 2);
  const reload = createCartStore({ storage, lock });
  assert.equal((await reload.beginCheckout({}, [], null)).requestId, 'request-a');
  await assert.rejects(reload.beginCheckout({}, [], 'other-account'));
  await reload.finishAttempt('wrong-id'); assert.ok(reload.getSnapshot().attempt);
  await reload.finishAttempt('request-a'); assert.equal(reload.getSnapshot().attempt, null);
});

test('confirmed payment finishes only its own pending attempt', async () => {
  const store = createCartStore({ storage: memory(), newId: () => 'request' });
  await store.changeItems(() => [item]);
  await store.beginCheckout({}, [item], null);
  await store.rememberCheckout('session', [item], 'request');
  await store.completeCheckout('session');
  assert.equal(store.getSnapshot().attempt, null);
  assert.equal(store.getSnapshot().items.length, 0);
});

test('late response cannot rearm an already consumed payment', async () => {
  const store = createCartStore({ storage: memory() });
  await store.changeItems(() => [{...item,quantity:3}]);
  await store.rememberCheckout('paid', [item]);
  await store.completeCheckout('paid');
  await store.rememberCheckout('paid', [item]);
  await store.completeCheckout('paid');
  assert.equal(store.getSnapshot().items[0].quantity, 1);
});
