import { getServerClients } from '../server/clients.js';
import { createCancelCheckoutHandler } from '../server/cancel-checkout.js';
export default async function handler(req, res) {
  try { return await createCancelCheckoutHandler(getServerClients())(req, res); }
  catch { return res.status(503).json({ error: 'Serviço indisponível.' }); }
}
