import { getServerClients } from '../server/clients.js';
import { createCheckoutHandler } from '../server/checkout.js';

export default async function handler(req, res) {
  try {
    return await createCheckoutHandler({ ...getServerClients(), siteUrl: process.env.SITE_URL })(req, res);
  } catch {
    return res.status(503).json({ error: 'Pagamento temporariamente indisponível.' });
  }
}
