import { recoverSession, applySession } from './reservations.js';
// Uma página por execução, com cursor explícito para não prender a fila em casos ambíguos.
export async function reconcileCheckouts({ supabase, stripe }, after = null) {
  let query = supabase.from('checkout_reservations')
    .select('request_id,sale_id,state,session_id,stripe_payload,created_at')
    .eq('state', 'reserved').lt('created_at', new Date(Date.now() - 120000).toISOString())
    .order('request_id').limit(25);
  if (after) query = query.gt('request_id', after);
  const { data, error } = await query;
  if (error) throw new Error('Não foi possível consultar reservas.');
  const results = [];
  for (const row of data || []) {
    try {
      const session = await recoverSession(stripe, row.request_id, { ...row, payload: row.stripe_payload });
      const applied = await applySession(supabase, row.request_id, session);
      results.push({ requestId: row.request_id, state: applied.state });
    } catch {
      // Ausência em listagem ou erro de rede não comprova ausência de pagamento.
      results.push({ requestId: row.request_id, state: 'needs_review' });
    }
  }
  return { results, nextCursor: data?.length === 25 ? data.at(-1).request_id : null };
}
