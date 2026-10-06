import { applySession } from './reservations.js';
export async function processCheckoutEvent({ supabase, stripe }, event) {
  if (!['checkout.session.completed', 'checkout.session.async_payment_succeeded', 'checkout.session.async_payment_failed', 'checkout.session.expired'].includes(event.type)) return;
  // Recupera o estado atual: eventos atrasados não regridem o pedido.
  const session = await stripe.checkout.sessions.retrieve(event.data.object.id, {
    expand: ['payment_intent.payment_method'],
  });
  session.async_payment_failed = event.type === 'checkout.session.async_payment_failed';
  if (session.metadata?.requestId) {
    await applySession(supabase, session.metadata.requestId, session, event.id);
    return;
  }
  // Compatibilidade com sessões anteriores à migração. Reserva nova nunca passa aqui.
  if (session.mode !== 'payment' || session.payment_status !== 'paid' || session.status !== 'complete') return;
  const { data: sale, error } = await supabase.from('sales').select('id,status,total_amount,stripe_session_id,checkout_managed')
    .eq('id', session.metadata?.saleId).single();
  if (error || !sale || sale.checkout_managed || sale.stripe_session_id !== session.id || session.currency !== 'brl' || Math.round(Number(sale.total_amount) * 100) !== session.amount_total) throw new Error('Sessão legada incompatível.');
  if (['Paga', 'Pago', 'completed'].includes(sale.status)) return;
  if (sale.status === 'Cancelada') throw new Error('Pedido legado cancelado exige reconciliação.');
  const { error: updateError } = await supabase.from('sales').update({ status: 'Paga', payment_intent_id: session.payment_intent })
    .eq('id', sale.id).eq('status', sale.status);
  if (updateError) throw new Error('Falha ao confirmar pedido legado.');
}
export function createWebhookHandler({ supabase, stripe, secret, readBody, logger = console }) {
  return async (req, res) => {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido.' });
    if (!secret) return res.status(503).json({ error: 'Webhook indisponível.' });
    let event;
    try { event = stripe.webhooks.constructEvent(await readBody(req), req.headers['stripe-signature'], secret); }
    catch { return res.status(400).json({ error: 'Assinatura inválida.' }); }
    try { await processCheckoutEvent({ supabase, stripe }, event); }
    catch { logger.error('[webhook] Evento não aplicado; nova entrega necessária.'); return res.status(500).json({ error: 'Confirmação pendente.' }); }
    return res.status(200).json({ received: true });
  };
}
