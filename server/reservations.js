export async function checkoutRpc(supabase, name, args) {
  const { data, error } = await supabase.rpc(name, args);
  if (error) {
    const failure = new Error('Não foi possível atualizar o pedido.');
    failure.code = error.code;
    // P0001 vem de validações explícitas das funções, sem SQL/dados internos.
    if (error.code === 'P0001') failure.message = error.message;
    throw failure;
  }
  return data;
}

export async function applySession(supabase, requestId, session, eventId = null) {
  const paymentIntent = typeof session.payment_intent === 'object' ? session.payment_intent : null;
  const paymentMethod = typeof paymentIntent?.payment_method === 'object' ? paymentIntent.payment_method : null;
  return checkoutRpc(supabase, 'apply_checkout_session', {
    p_request_id: requestId, p_event_id: eventId,
    p_session: {
      id: session.id, mode: session.mode, currency: session.currency,
      metadata: session.metadata, amount_total: session.amount_total,
      payment_status: session.payment_status, status: session.status,
      payment_intent: paymentIntent?.id ?? session.payment_intent,
      payment_method_type: paymentMethod?.type ?? null,
      async_payment_failed: session.async_payment_failed === true,
    },
  });
}

// O payload é imutável no banco. Repetições usam a MESMA chave Stripe.
// Após a janela de criação, só buscamos sessões existentes: nunca recriamos.
export async function recoverSession(stripe, requestId, attempt, now = Date.now()) {
  if (attempt.session_id) return stripe.checkout.sessions.retrieve(attempt.session_id);
  if (now < (attempt.payload.expires_at - 31 * 60) * 1000) {
    return stripe.checkout.sessions.create(attempt.payload, { idempotencyKey: `checkout:${requestId}` });
  }
  const created = Math.floor(new Date(attempt.created_at).getTime() / 1000);
  let cursor;
  for (let page = 0; page < 10; page++) {
    const sessions = await stripe.checkout.sessions.list({ limit: 100,
      created: { gte: created - 60, lte: created + 3600 }, ...(cursor ? { starting_after: cursor } : {}) });
    const found = sessions.data.find(session => session.metadata?.requestId === requestId && session.metadata?.saleId === attempt.sale_id);
    if (found) return stripe.checkout.sessions.retrieve(found.id);
    if (!sessions.has_more) break;
    cursor = sessions.data.at(-1)?.id;
    if (!cursor) break;
  }
  throw new Error('A confirmação da tentativa está pendente. Tente novamente ou entre em contato com a loja.');
}

export async function verifiedActor(supabase, authorization) {
  if (!authorization) return null;
  const match = /^Bearer (\S+)$/i.exec(authorization);
  if (!match) throw new Error('Identidade inválida.');
  const { data, error } = await supabase.auth.getUser(match[1]);
  if (error || !data?.user?.email_confirmed_at || !data.user.email) throw new Error('Identidade inválida.');
  return data.user;
}
export const isRequestId = value => typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
