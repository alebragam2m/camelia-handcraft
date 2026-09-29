import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { buffer } from 'micro';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export const config = {
  api: {
    bodyParser: false, // Desativa o bodyParser para validar a assinatura do Stripe
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const buf = await buffer(req);
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = stripe.webhooks.constructEvent(buf, sig, webhookSecret);
  } catch (err) {
    console.error(`Webhook Error: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Lógica para quando o pagamento é concluído
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const saleId = session.metadata.saleId;

    try {
      // 1. Idempotência: verificar se a venda já foi processada antes de atualizar
      const { data: existingSale, error: fetchError } = await supabase
        .from('sales')
        .select('status')
        .eq('id', saleId)
        .single();

      if (fetchError) throw fetchError;

      if (existingSale?.status === 'Paga') {
        console.log(`[Webhook] Venda ${saleId} já estava PAGA — evento duplicado ignorado.`);
        return res.status(200).json({ received: true });
      }

      // 1.1 Revalidação leve: o pagamento já foi capturado pela Stripe, então
      // isso NUNCA bloqueia a confirmação — só sinaliza pro admin resolver
      // manualmente se, entre o checkout e o pagamento, o estoque acabou.
      const { data: items } = await supabase
        .from('sale_items')
        .select('product_id, quantity')
        .eq('sale_id', saleId);

      let stockConflict = false;
      if (items?.length) {
        const { data: currentProducts } = await supabase
          .from('products')
          .select('id, stock')
          .in('id', items.map(i => i.product_id));
        const stockById = new Map((currentProducts || []).map(p => [p.id, p.stock]));
        stockConflict = items.some(i => Number(stockById.get(i.product_id) ?? 0) < i.quantity);
        if (stockConflict) {
          console.warn(`[Webhook] Venda ${saleId} confirmada com estoque insuficiente em pelo menos um item.`);
        }
      }

      // 2. Atualizar o status da venda para "Paga"
      const { error: updateError } = await supabase
        .from('sales')
        .update({
          status: 'Paga',
          payment_intent_id: session.payment_intent,
          stock_conflict: stockConflict,
        })
        .eq('id', saleId);

      if (updateError) throw updateError;

      console.log(`[Webhook] Venda ${saleId} atualizada para PAGA.`);

    } catch (error) {
      console.error('[Webhook] Erro ao atualizar venda:', error);
      return res.status(500).send('Database Update Error');
    }
  }

  return res.status(200).json({ received: true });
}
