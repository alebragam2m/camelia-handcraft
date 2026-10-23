import { chromium } from 'playwright';
import { expect } from 'playwright/test';
import { createServer } from 'vite';
import { createClient } from '@supabase/supabase-js';
import assert from 'node:assert/strict';

const url = process.env.SUPABASE_URL;
const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
assert.ok(url && anonKey && serviceKey, 'Variáveis de staging ausentes.');
process.env.VITE_SUPABASE_URL = url;
process.env.VITE_SUPABASE_ANON_KEY = anonKey;

const service = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const email = `e2e-${stamp}@example.invalid`;
const password = `E2e-${crypto.randomUUID()}aA1!`;
const productName = `E2E HOMOLOG ${stamp}`;
let userId;
let productId;
let imagePath;
let server;
let browser;
const results = [];
const report = async (name, action) => {
  await action();
  results.push(name);
  console.log(`PASS ${name}`);
};

try {
  const { data: created, error: userError } = await service.auth.admin.createUser({ email, password, email_confirm: true });
  if (userError) throw userError;
  userId = created.user.id;
  const { error: adminError } = await service.from('admin_users').insert({
    auth_user_id: userId, full_name: 'E2E Homologação', access_level: 4, is_active: true,
  });
  if (adminError) throw adminError;

  server = await createServer({ envFile: false, server: { host: '127.0.0.1', port: 5191, strictPort: true }, logLevel: 'error' });
  await server.listen();
  browser = await chromium.launch({ headless: true });
  const admin = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const site = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  admin.setDefaultTimeout(15000);
  site.setDefaultTimeout(15000);

  await report('login e RBAC do painel', async () => {
    await admin.goto('http://127.0.0.1:5191/login');
    await admin.locator('input[type="email"]').fill(email);
    await admin.locator('input[type="password"]').fill(password);
    await admin.getByRole('button', { name: 'Entrar Agora' }).click();
    await expect(admin).toHaveURL(/\/minha-conta/);
    await admin.getByRole('button', { name: 'Painel de Gestão', exact: true }).click();
    await expect(admin).toHaveURL(/\/admin/);
    await expect(admin.getByText('Resumo Financeiro', { exact: true })).toBeVisible();
  });

  await report('cadastro de produto pelo painel', async () => {
    await admin.getByRole('button', { name: /Produtos/ }).click();
    await admin.getByText('Ver Tudo', { exact: true }).click();
    await admin.getByRole('button', { name: '+ Novo em Ver Tudo', exact: true }).click();
    await admin.locator('[name="nome"]').fill(productName);
    await admin.locator('[name="price"]').fill('29.90');
    await admin.locator('[name="cost"]').fill('9.50');
    await admin.locator('[name="stock"]').fill('3');
    await admin.locator('[name="description"]').fill('Descrição E2E: primeira linha.\nSegunda linha.');
    await admin.getByRole('button', { name: 'Flores', exact: true }).click();
    await admin.getByRole('button', { name: 'Cadastrar na Camélia', exact: true }).click();
    await expect(admin.getByRole('heading', { name: productName, exact: true })).toBeVisible();
    const { data, error } = await service.from('products').select('id,stock,show_on_site').eq('nome', productName).single();
    if (error) throw error;
    productId = data.id;
    assert.equal(data.stock, 3);
    assert.equal(data.show_on_site, true);
  });

  await report('descrição do painel publicada na vitrine', async () => {
    const { data, error } = await service.from('products').select('description').eq('id', productId).single();
    if (error) throw error;
    assert.equal(data.description, 'Descrição E2E: primeira linha.\nSegunda linha.');
    await site.goto(`http://127.0.0.1:5191/produtos/${productId}`);
    await expect(site.getByText(/Descrição E2E: primeira linha\.\s+Segunda linha\./)).toBeVisible();
  });

  await report('upload e persistência de foto no Storage', async () => {
    await admin.getByRole('heading', { name: productName, exact: true }).click();
    const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=', 'base64');
    await admin.locator('input[type="file"]').first().setInputFiles({ name: 'e2e.png', mimeType: 'image/png', buffer: png });
    await admin.getByRole('button', { name: 'Confirmar Enquadramento (Capa)', exact: true }).click();
    await expect(admin.getByAltText('Preview 1')).toBeVisible();
    await admin.getByRole('button', { name: 'Salvar Mudanças', exact: true }).click();
    const { data, error } = await service.from('products').select('image_url').eq('id', productId).single();
    if (error) throw error;
    assert.match(data.image_url, /product-images\/products\//);
    imagePath = decodeURIComponent(data.image_url.split('/product-images/')[1]);
  });

  await report('produto e foto publicados na vitrine', async () => {
    await site.goto(`http://127.0.0.1:5191/produtos/${productId}`);
    await expect(site.getByRole('heading', { name: productName, exact: true })).toBeVisible();
    await expect(site.getByText('R$ 29,90', { exact: true })).toBeVisible();
    const image = site.getByRole('img', { name: productName }).first();
    await expect.poll(() => image.evaluate(node => node.naturalWidth)).toBeGreaterThan(0);
    await expect(site.getByRole('button', { name: /^Adicionar ao carrinho/ })).toBeVisible();
  });

  await report('ajuste atômico de estoque refletido na vitrine', async () => {
    const client = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const { error: loginError } = await client.auth.signInWithPassword({ email, password });
    if (loginError) throw loginError;
    const { data, error } = await client.rpc('handle_inventory_adjustment', {
      p_product_id: productId, p_quantity: 3, p_type: 'SAIDA', p_notes: 'E2E homologação',
    });
    if (error) throw error;
    assert.equal(data.success, true);
    await site.reload();
    await expect(site.getByRole('button', { name: /^Adicionar ao carrinho/ })).toHaveCount(0);
  });
} finally {
  if (browser) await browser.close();
  if (server) await server.close();
  if (productId) {
    await service.from('inventory_logs').delete().eq('product_id', productId);
    await service.from('sale_items').delete().eq('product_id', productId);
    await service.from('products').delete().eq('id', productId);
  }
  if (imagePath) await service.storage.from('product-images').remove([imagePath]);
  if (userId) {
    await service.from('admin_users').delete().eq('auth_user_id', userId);
    await service.auth.admin.deleteUser(userId);
  }
}

console.log(`${results.length}/6 cenários remotos aprovados e dados temporários removidos.`);
