import test from 'node:test';
import assert from 'node:assert/strict';
import { getCollections, reconcileCart, PUBLIC_PRODUCT_COLUMNS } from '../src/lib/catalog.js';
import { productSchema } from '../src/schemas/productSchema.ts';
const product = { id: 'a', nome: 'Guardanapo', price: 25, stock: 5, show_on_site: true, is_insumo: false, colecao: 'Natal, Flores', image_url: 'photo.jpg' };

test('collections split multiple names, use product photos and exclude private products', () => {
 assert.deepEqual(getCollections([product, { ...product, id: 'b', colecao: 'Segredo', show_on_site: false }, { ...product, id: 'c', colecao: 'Materiais', is_insumo: true }]), [{ nome: 'Flores', img: 'photo.jpg' }, { nome: 'Natal', img: 'photo.jpg' }]);
});
test('panel price and photo changes reach an existing cart without changing its requested quantity', () => {
 const cart = [{ ...product, quantity: 2, cost: 10 }];
 const [updated] = reconcileCart(cart, [{ ...product, price: 35, image_url: 'new.jpg' }]);
 assert.equal(updated.price, 35); assert.equal(updated.image_url, 'new.jpg'); assert.equal(updated.quantity, 2);
 assert.equal(updated.cost, undefined); assert.equal(cart[0].price, 25);
});
test('stock reduction, hiding, removal and preorder block stale cart purchases', () => {
 const cart = [{ ...product, quantity: 2 }];
 for (const catalog of [[], [{ ...product, stock: 1 }], [{ ...product, show_on_site: false }], [{ ...product, is_insumo: true }], [{ ...product, is_preorder: true }]]) {
   const [updated] = reconcileCart(cart, catalog); assert.equal(updated.unavailable, true); assert.equal(updated.quantity, 2);
 }
 assert.equal(reconcileCart(cart, [product])[0].unavailable, false);
});
test('public catalog projection excludes internal management fields', () => {
 const columns = PUBLIC_PRODUCT_COLUMNS.split(',');
 for (const field of ['cost','supplier_id','technical_notes','insumos_json']) assert.equal(columns.includes(field), false);
});
test('product form preserves management fields and rejects negative prices or fractional inventory', () => {
 const parsed = productSchema.parse({ nome: 'Guardanapo', price: '20', min_stock: '3', material: 'Algodão', tags: 'mesa' });
 assert.equal(parsed.min_stock, 3); assert.equal(parsed.material, 'Algodão'); assert.equal(parsed.tags, 'mesa');
 for(const fields of [{price:-1},{stock:1.5},{stock:-1},{stock_to_make:-1}]) assert.equal(productSchema.safeParse({nome:'Guardanapo', ...fields}).success,false);
});
