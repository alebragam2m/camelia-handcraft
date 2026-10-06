import { applySession } from './reservations.js';
import { isSalePaid } from '../src/lib/saleStatus.js';

export function createPaymentStatusHandler({ supabase, stripe, logger = console }) {
  return async (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido.' });
    const sessionId = req.body?.sessionId;
    if (typeof sessionId !== 'string' || !/^cs_(test_|live_)?[a-zA-Z0-9]{8,240}$/.test(sessionId)) return res.status(400).json({ error: 'Sessão de pagamento inválida.' });
    try {
      // O ID da sessão é uma credencial de consulta: responder só com dados mínimos.
      const session = await stripe.checkout.sessions.retrieve(sessionId, {
        expand: ['payment_intent.payment_method'],
      });
      if (session.mode !== 'payment' || !session.metadata?.saleId) return res.status(404).json({ error: 'Pedido não encontrado.' });
      if (session.metadata.requestId) await applySession(supabase, session.metadata.requestId, session);
      const { data: sale, error } = await supabase.from('sales').select('id,status,total_amount')
        .eq('stripe_session_id', sessionId).eq('id', session.metadata.saleId).maybeSingle();
      if (error) throw error;
      if (!sale) return res.status(404).json({ error: 'Pedido não encontrado.' });
      if (session.currency !== 'brl' || Math.round(Number(sale.total_amount) * 100) !== session.amount_total) throw new Error('Divergência de pagamento.');
      const status = sale.status === 'Cancelada' ? 'cancelled'
        : session.status === 'expired' ? 'expired'
        : session.payment_status === 'paid' && isSalePaid(sale.status) ? 'paid' : 'pending';
      return res.status(200).json({ status, order: { id: sale.id, total: sale.total_amount } });
    } catch (error) {
      if (error.code === 'resource_missing') return res.status(404).json({ error: 'Pedido não encontrado.' });
      logger.error('[payment-status] Falha ao consultar confirmação.');
      return res.status(503).json({ error: 'Não foi possível confirmar o pagamento agora. Tente novamente.' });
    }
  };
}
