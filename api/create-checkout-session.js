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

  if (!saleId || !cartItems?.length) {
    return res.status(400).json({ error: 'Dados incompletos na requisição.' });
  }

  // 1. Validar que a venda existe e está pendente (Fix 1)
  const { data: sale, error: saleError } = await supabase
    .from('sales')
    .select('id, status, total_amount')
    .eq('id', saleId)
    .single();

  if (saleError || !sale) {
    return res.status(404).json({ error: 'Venda não encontrada.' });
  }

  if (sale.status !== 'Pendente') {
    return res.status(409).json({ error: `Venda já processada (status: ${sale.status}).` });
  }

  // 2. Validar integridade dos preços — previne manipulação de valor no frontend (Fix 1)
  const calculatedTotal = cartItems.reduce(
    (sum, item) => sum + Math.round(Number(item.price) * 100) * item.quantity,
    0
  );
  const storedTotal = Math.round(Number(sale.total_amount) * 100);

  if (Math.abs(calculatedTotal - storedTotal) > 1) { // tolerância de 1 centavo (arredondamento)
    console.error(`[CHECKOUT] Inconsistência de valor: calculado=${calculatedTotal}, banco=${storedTotal}, saleId=${saleId}`);
    return res.status(400).json({ error: 'Inconsistência de valor detectada. Recarregue o carrinho.' });
  }

  try {
    // 3. Preparar os itens para o Stripe
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

    // 4. Criar a sessão do Stripe
    // 'payment_method_types: card' — quando ativar PIX no Stripe Dashboard ele aparece automaticamente
    const session = await stripe.checkout.sessions.create({
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

    // 5. Salvar o stripe_session_id — falha aqui é crítica: sem ele o PaymentSuccess não encontra a venda (Fix 4)
    const { error: updateError } = await supabase
      .from('sales')
      .update({ stripe_session_id: session.id })
      .eq('id', saleId);

    if (updateError) {
      console.error('[CHECKOUT] Falha crítica ao salvar stripe_session_id:', updateError.message);
      // Expirar a sessão Stripe para não deixar uma sessão órfã
      await stripe.checkout.sessions.expire(session.id).catch((expireErr) => {
        console.error('[CHECKOUT] Falha ao expirar sessão órfã:', expireErr.message);
      });
      return res.status(500).json({ error: 'Falha ao registrar sessão de pagamento. Tente novamente.' });
    }

    // 6. Retornar a URL para o frontend redirecionar
    return res.status(200).json({ url: session.url });
  } catch (error) {
    console.error('[STRIPE FEEDBACK] Crítico:', error.stack || error.message);
    return res.status(500).json({
      error: error.message,
      detail: "Verifique se as chaves da Stripe na Vercel estão corretas."
    });
  }
}
