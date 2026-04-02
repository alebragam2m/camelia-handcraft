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
      // 1. Atualizar o status da venda para "Pago"
      const { error } = await supabase
        .from('sales')
        .update({ 
          status: 'Paga',
          payment_intent_id: session.payment_intent 
        })
        .eq('id', saleId);

      if (error) throw error;

      console.log(`Venda ${saleId} atualizada para PAGA.`);
      
    } catch (error) {
      console.error('Erro ao atualizar venda via Webhook:', error);
      return res.status(500).send('Database Update Error');
    }
  }

  return res.status(200).json({ received: true });
}
