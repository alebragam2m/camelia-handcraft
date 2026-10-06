import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import ts from 'typescript';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import * as ReactQuery from '@tanstack/react-query';
const { QueryClient, QueryClientProvider } = ReactQuery;
import * as Router from 'react-router-dom';
const { MemoryRouter } = Router;
import { requireRpcSuccess } from '../src/lib/rpcResult.js';
import { formatCurrency } from '../src/utils/formatCurrency.ts';

const require = createRequire(import.meta.url);
function loadSource(file, imports) {
  const code = ts.transpileModule(fs.readFileSync(new URL(file, import.meta.url), 'utf8'), {
    fileName: file, compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const module = { exports: {} };
  new Function('require', 'module', 'exports', code)(name => imports[name] || require(name), module, module.exports);
  return module.exports;
}
const PaymentSuccess = loadSource('../src/pages/PaymentSuccess.jsx', {
  '@tanstack/react-query': ReactQuery, 'react-router-dom': Router,
  '../context/CartContext': { useCart: () => ({ completeCheckout: async () => {} }) },
  '../utils/formatCurrency': { formatCurrency },
}).default;

test('actual payment page never renders confirmation for absent/pending/cancelled/expired sessions', () => {
  for (const status of [null, 'pending', 'cancelled', 'expired', 'paid']) {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
    if (status) client.setQueryData(['payment-status', 'cs_test_12345678'], { status, order: { id: 'sale-a', total: 15 } });
    const html = renderToStaticMarkup(React.createElement(QueryClientProvider, { client },
      React.createElement(MemoryRouter, { initialEntries: [status ? '/pagamento-sucesso?session_id=cs_test_12345678' : '/pagamento-sucesso'] }, React.createElement(PaymentSuccess))));
    assert.equal(html.includes('Pagamento confirmado!'), status === 'paid');
    assert.equal(html.includes('Total pago:'), status === 'paid');
    client.clear();
  }
});

test('actual stock service rejects business failures and fractional quantities before calling RPC', async () => {
  let calls = 0;
  const service = loadSource('../src/services/stockService.ts', {
    '../lib/supabase': { supabase: { rpc: async () => { calls++; return { data: { success: false, error: 'Estoque insuficiente' }, error: null }; } } },
    '../lib/rpcResult': { requireRpcSuccess },
  }).stockService;
  await assert.rejects(service.adjust('product-a', 1.5, 'SAIDA'), /inteiro positivo/);
  assert.equal(calls, 0);
  await assert.rejects(service.adjust('product-a', 3, 'SAIDA'), /Estoque insuficiente/);
  assert.equal(calls, 1);
});

test('actual checkout offers resume even when its reservation exhausted public stock', () => {
  const Checkout = loadSource('../src/pages/Checkout.jsx', {
    '@tanstack/react-query': ReactQuery, 'react-router-dom': Router,
    '../context/CartContext': { useCart: () => ({ cartItems: [{id:'a',quantity:1,unavailable:true}], catalogReady:false,
      checkoutAttempt: {requestId:'saved'}, totalPrice:10 }) },
    '../utils/formatCurrency': { formatCurrency },
    '../lib/supabase': { supabase: {} },
    '../lib/shipping': { BRAZIL_STATES: ['PA'], shippingCentsForState: () => 500 },
  }).default;
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
  const html=renderToStaticMarkup(React.createElement(QueryClientProvider,{client},React.createElement(MemoryRouter,null,React.createElement(Checkout))));
  assert.match(html,/Retomar pagamento/);assert.match(html,/Cancelar tentativa/);assert.doesNotMatch(html,/disabled=""/);
  client.clear();
});
