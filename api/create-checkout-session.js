import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

// Vercel Serverless Function
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { saleId, cartItems, customerEmail } = req.body;

  try {
    // 1. Preparar os itens para o Stripe
    const line_items = cartItems.map((item) => ({
      price_data: {
        currency: 'brl',
        product_data: {
          name: item.nome,
          images: item.imagem ? [item.imagem] : [],
        },
        unit_amount: Math.round(Number(item.price) * 100), // Stripe usa centavos
      },
      quantity: item.quantity,
    }));

    // 2. Criar a sessão do Stripe
    const session = await stripe.checkout.sessions.create({
      // 'automatic' = Stripe mostra os métodos habilitados no seu dashboard automaticamente.
      // Quando você ativar PIX no Stripe Dashboard, ele aparecerá aqui sem precisar mudar o código.
      payment_method_types: ['card'],
      line_items,
      mode: 'payment',
      customer_email: customerEmail,
      success_url: `${req.headers.origin}/pagamento-sucesso?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin}/checkout`,
      metadata: {
        saleId: saleId,
      },
    });

    // 3. Salvar o ID da sessão no Supabase para reconciliação
    await supabase
      .from('sales')
      .update({ stripe_session_id: session.id })
      .eq('id', saleId);

    // 4. Retornar a URL para o frontend redirecionar
    return res.status(200).json({ url: session.url });
  } catch (error) {
    console.error('Erro no Stripe:', error);
    return res.status(500).json({ error: error.message });
  }
}
