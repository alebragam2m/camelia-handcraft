import { getServerClients } from '../server/clients.js';
import { createPaymentStatusHandler } from '../server/payment-status.js';
export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  try { return await createPaymentStatusHandler(getServerClients())(req, res); }
  catch { return res.status(503).json({ error: 'Consulta temporariamente indisponível.' }); }
}
