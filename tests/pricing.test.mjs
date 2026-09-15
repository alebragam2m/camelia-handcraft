import test from 'node:test';
import assert from 'node:assert/strict';
import { priceCatalogOrder } from '../src/lib/orderPricing.js';
const product = { id: 'a', nome: 'Peça', price: 29.9, cost: 12.5, stock: 4, show_on_site: true, image_url: 'official.jpg' };
const cart = [{ id: 'a', quantity: 2, price: 29.9, cost: 0, nome: 'Nome adulterado' }];
test('server prices the public cart and calculates private cost from the catalog', () => {
 const priced = priceCatalogOrder(cart, [product]);
 assert.equal(priced.total, 5980); assert.equal(priced.cost, 2500);
 assert.equal(priced.items[0].nome, 'Peça'); assert.equal(priced.items[0].image_url, 'official.jpg');
});
test('changed prices, hidden products, duplicates and invalid quantities cannot generate pricing', () => {
 assert.throws(() => priceCatalogOrder(cart, [{ ...product, price: 30 }]));
 assert.throws(() => priceCatalogOrder(cart, [{ ...product, show_on_site: false }]));
 assert.throws(() => priceCatalogOrder(cart, [{ ...product, stock: 1 }]));
 assert.throws(() => priceCatalogOrder([...cart,...cart], [product]));
 for(const quantity of [-1,0,1.5,Infinity,'2']) assert.throws(() => priceCatalogOrder([{...cart[0],quantity}], [product]));
});
