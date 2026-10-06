import assert from 'node:assert/strict';

const targetIndex = process.argv.indexOf('--target');
const target = targetIndex >= 0 ? process.argv[targetIndex + 1] : null;
assert.ok(['staging', 'production'].includes(target), 'Use --target staging ou --target production.');

const required = [
  'VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY',
  'SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY',
  'STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET', 'SITE_URL',
];
if (target === 'production' || process.argv.includes('--with-contact')) required.push('RESEND_API_KEY');
const missing = required.filter(name => !process.env[name]?.trim());
assert.deepEqual(missing, [], `Variáveis ausentes: ${missing.join(', ')}`);

const publicUrl = new URL(process.env.VITE_SUPABASE_URL);
const serverUrl = new URL(process.env.SUPABASE_URL);
const siteUrl = new URL(process.env.SITE_URL);
assert.equal(publicUrl.origin, serverUrl.origin, 'Frontend e servidor apontam para Supabase diferentes.');
assert.equal(publicUrl.protocol, 'https:', 'Supabase deve usar HTTPS.');
assert.ok(publicUrl.hostname.endsWith('.supabase.co'), 'URL do Supabase inesperada.');
assert.notEqual(process.env.VITE_SUPABASE_ANON_KEY, process.env.SUPABASE_SERVICE_ROLE_KEY,
  'A chave privilegiada não pode ser exposta como chave pública.');
assert.equal(siteUrl.protocol, 'https:', 'SITE_URL deve usar HTTPS fora do desenvolvimento local.');
assert.equal(siteUrl.pathname, '/', 'SITE_URL deve conter apenas a origem, sem caminho.');
assert.equal(siteUrl.search, '', 'SITE_URL não pode conter query string.');
assert.equal(siteUrl.hash, '', 'SITE_URL não pode conter fragmento.');
assert.ok(process.env.STRIPE_WEBHOOK_SECRET.startsWith('whsec_'), 'Webhook Stripe inválido.');
if (process.env.RESEND_API_KEY && process.env.RESEND_API_KEY !== '[SENSITIVE]') {
  assert.ok(process.env.RESEND_API_KEY.startsWith('re_'), 'Chave Resend inválida.');
}

const stripePrefixes = target === 'staging' ? ['sk_test_', 'rk_test_'] : ['sk_live_', 'rk_live_'];
assert.ok(stripePrefixes.some(prefix => process.env.STRIPE_SECRET_KEY.startsWith(prefix)),
  `${target}: chave Stripe deve ser uma chave secreta ou restrita do ambiente correto.`);

// Identificadores já confirmados pelo proprietário como produção neste projeto.
if (target === 'staging') {
  assert.notEqual(publicUrl.hostname, 'hyheltgxnkbmqiugbztb.supabase.co',
    'Homologação está apontando para o Supabase de produção. Crie/use outro projeto.');
  assert.notEqual(siteUrl.hostname, 'camelia-handcraft.vercel.app',
    'Homologação está usando o domínio principal de produção. Use uma URL Preview/Staging.');
}

console.log(JSON.stringify({
  target,
  supabaseHost: publicUrl.hostname,
  siteOrigin: siteUrl.origin,
  stripeMode: target === 'staging' ? 'test' : 'live',
  contactEmail: process.env.RESEND_API_KEY === '[SENSITIVE]' ? 'configured-secret' : process.env.RESEND_API_KEY ? 'configured' : 'skipped',
  secretsPrinted: false,
}, null, 2));
