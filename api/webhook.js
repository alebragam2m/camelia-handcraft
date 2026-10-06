import { buffer } from 'micro';
import { getServerClients } from '../server/clients.js';
import { createWebhookHandler } from '../server/webhook.js';
export const config = { api: { bodyParser: false } };
export default async function handler(req, res) {
  try { return await createWebhookHandler({ ...getServerClients(), secret: process.env.STRIPE_WEBHOOK_SECRET, readBody: buffer })(req, res); }
  catch { return res.status(503).json({ error: 'Webhook indisponível.' }); }
}
