import { priceCatalogOrder } from '../src/lib/orderPricing.js';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

// Vercel Serverless Function
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { cartItems, customer } = req.body || {};

  if (!Array.isArray(cartItems) || !cartItems.length || cartItems.length > 100 || cartItems.some(item => !item || item.id == null)) {
    return res.status(400).json({ error: 'Carrinho inválido.' });
  }
  if (!customer || !isNonEmptyString(customer.nome) || !isNonEmptyString(customer.email) ||
      !isNonEmptyString(customer.telefone) || !isNonEmptyString(customer.endereco) || !isNonEmptyString(customer.cidade)) {
    return res.status(400).json({ error: 'Dados de entrega incompletos.' });
  }

  // 1. Buscar catálogo autoritativo e precificar no servidor. Custo interno
  // nunca é enviado ao carrinho — só usado aqui para gravar total_cost.
  const { data: catalog, error: catalogError } = await supabase.from('products')
    .select('id,nome,price,cost,stock,image_url,show_on_site,is_insumo,is_preorder')
    .in('id', cartItems.map(item => item.id));
  if (catalogError) return res.status(500).json({ error: 'Não foi possível validar o catálogo.' });

  let pricing;
  try { pricing = priceCatalogOrder(cartItems, catalog || []); }
  catch (error) { return res.status(400).json({ error: error.message }); }

  const catalogById = new Map((catalog || []).map(product => [String(product.id), product]));
  const shippingAddress = {
    cep: customer.cep || '', endereco: customer.endereco, numero: customer.numero || '',
    bairro: customer.bairro || '', cidade: customer.cidade, estado: customer.estado || '',
  };

  // 2. Criar/atualizar o cliente e o pedido (status Pendente) via service role —
  // o navegador não grava mais nessas tabelas diretamente.
  const { data: client, error: clientError } = await supabase
    .from('clients')
    .upsert({
      full_name: customer.nome,
      email: customer.email,
      phone: customer.telefone,
      cep: customer.cep || null,
      address: customer.endereco,
      address_number: customer.numero || null,
      neighborhood: customer.bairro || null,
      city: customer.cidade,
      state: customer.estado || null,
    }, { onConflict: 'email' })
    .select()
    .single();
  if (clientError) return res.status(500).json({ error: 'Não foi possível registrar seus dados.' });

  // Customer da Stripe (não dado de cartão) reaproveitado entre pedidos —
  // é o que permite ao Checkout hospedado oferecer "salvar cartão" e listar
  // cartões salvos em compras futuras. Falha aqui não bloqueia a compra:
  // só perde a opção de cartão salvo desta vez.
  let stripeCustomerId = client.stripe_customer_id;
  if (!stripeCustomerId) {
    try {
      const stripeCustomer = await stripe.customers.create({ email: customer.email, name: customer.nome });
      stripeCustomerId = stripeCustomer.id;
      await supabase.from('clients').update({ stripe_customer_id: stripeCustomerId }).eq('id', client.id);
    } catch (err) {
      console.error('[CHECKOUT] Falha ao criar Stripe Customer (cartão salvo indisponível nesta compra):', err.message);
    }
  }

  const { data: sale, error: saleError } = await supabase
    .from('sales')
    .insert({
      client_id: client.id,
      client_name: customer.nome,
      payment_method: 'Stripe/Cartão-PIX',
      total_amount: pricing.total / 100,
      total_cost: pricing.cost / 100,
      shipping_cost: 0,
      shipping_address: shippingAddress,
      status: 'Pendente',
    })
    .select()
    .single();
  if (saleError) return res.status(500).json({ error: 'Não foi possível criar o pedido.' });

  const saleItems = pricing.items.map(item => ({
    sale_id: sale.id,
    product_id: item.id,
    quantity: item.quantity,
    unit_price: item.cents / 100,
    unit_cost: Number(catalogById.get(String(item.id))?.cost || 0),
  }));
  const { error: itemsError } = await supabase.from('sale_items').insert(saleItems);
  if (itemsError) return res.status(500).json({ error: 'Não foi possível registrar os itens do pedido.' });

  try {
    // 3. Preparar os itens para o Stripe
    const line_items = pricing.items.map((item) => ({
      price_data: {
        currency: 'brl',
        product_data: {
          name: item.nome,
          images: item.image_url ? [item.image_url] : [],
        },
        unit_amount: item.cents, // Stripe usa centavos
      },
      quantity: item.quantity,
    }));

    // 4. Criar a sessão do Stripe
    // 'payment_method_types: card' — quando ativar PIX no Stripe Dashboard ele aparece automaticamente
    // Com customer + saved_payment_method_options: o Checkout hospedado mostra
    // a caixa opcional "salvar cartão" e, em compras futuras, os cartões já
    // salvos desse cliente para reaproveitar — tudo do lado da Stripe.
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items,
      mode: 'payment',
      ...(stripeCustomerId ? { customer: stripeCustomerId } : { customer_email: customer.email }),
      ...(stripeCustomerId ? {
        payment_intent_data: { setup_future_usage: 'on_session' },
        saved_payment_method_options: { payment_method_save: 'enabled' },
      } : {}),
      success_url: `${req.headers.origin}/pagamento-sucesso?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin}/checkout`,
      metadata: {
        saleId: sale.id,
      },
    });

    // 5. Salvar o stripe_session_id — falha aqui é crítica: sem ele o PaymentSuccess não encontra a venda
    const { error: updateError } = await supabase
      .from('sales')
      .update({ stripe_session_id: session.id })
      .eq('id', sale.id);

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
