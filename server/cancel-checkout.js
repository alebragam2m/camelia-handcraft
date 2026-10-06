import { checkoutRpc, verifiedActor, isRequestId, recoverSession, applySession } from './reservations.js';
export function createCancelCheckoutHandler({ supabase, stripe, logger = console }) {
  return async (req, res) => {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido.' });
    if (!isRequestId(req.body?.requestId)) return res.status(400).json({ error: 'Tentativa inválida.' });
    let actor;
    try { actor = await verifiedActor(supabase, req.headers?.authorization); }
    catch { return res.status(401).json({ error: 'Entre novamente para cancelar esta tentativa.' }); }
    try {
      const requestId = req.body.requestId;
      const attempt = await checkoutRpc(supabase, 'cancel_checkout_attempt', { p_request_id: requestId, p_actor_id: actor?.id ?? null });
      if (!attempt || attempt.state === 'expired') return res.status(200).json({ state: 'expired' });
      if (attempt.state === 'paid') return res.status(409).json({ error: 'Pedido já pago. Consulte seu pagamento.', state: 'paid' });
      let session = await recoverSession(stripe, requestId, attempt);
      if (session.status === 'open') {
        try { session = await stripe.checkout.sessions.expire(session.id); }
        catch { session = await stripe.checkout.sessions.retrieve(session.id); }
      }
      const result = await applySession(supabase, requestId, session);
      if (result.state !== 'expired') return res.status(409).json({ error: 'A reserva não foi liberada: pagamento confirmado ou em processamento.', state: result.state });
      return res.status(200).json(result);
    } catch {
      logger.error('[checkout] Cancelamento não confirmado; reserva mantida.');
      return res.status(503).json({ error: 'Não foi possível confirmar o cancelamento. A tentativa foi preservada para nova consulta.' });
    }
  };
}
