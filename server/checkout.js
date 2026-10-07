import { checkoutRpc, recoverSession, applySession, isRequestId } from './reservations.js';

class CheckoutError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

function validateCustomer(input) {
  const limits = { nome: 200, email: 254, telefone: 40, endereco: 500, cidade: 100, estado: 2, cep: 20, numero: 40, bairro: 100 };
  const deliveryMethod = input?.delivery_method ?? 'delivery';
  if (!['delivery', 'pickup'].includes(deliveryMethod)) throw new CheckoutError(400, 'Forma de entrega inválida.');
  const required = deliveryMethod === 'delivery'
    ? ['nome', 'email', 'telefone', 'endereco', 'cidade', 'estado']
    : ['nome', 'email', 'telefone'];
  const customer = {};
  for (const [key, max] of Object.entries(limits)) {
    const value = input?.[key] ?? '';
    if (typeof value !== 'string' || value.length > max || /[\r\n]/.test(value)) throw new CheckoutError(400, 'Dados de entrega inválidos.');
    customer[key] = value.trim();
  }
  if (required.some(key => !customer[key]) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email)) throw new CheckoutError(400, 'Confira os dados de contato e entrega.');
  customer.email = customer.email.toLowerCase();
  customer.estado = customer.estado.toUpperCase();
  customer.delivery_method = deliveryMethod;
  return customer;
}

function returnOrigin(siteUrl) {
  let url;
  try { url = new URL(siteUrl); } catch { throw new Error('SITE_URL não configurada.'); }
  if (url.username || url.password || (url.protocol !== 'https:' && !(url.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(url.hostname)))) throw new Error('SITE_URL inválida.');
  return url.origin;
}

// Injeção de dependências mantém os testes sem credenciais ou chamadas externas.
export function createCheckoutHandler({ supabase, stripe, siteUrl, logger = console }) {
  return async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido.' });
    try {
      const origin = returnOrigin(siteUrl);
      const { cartItems } = req.body || {};
      const customer = validateCustomer(req.body?.customer);
      if (!Array.isArray(cartItems) || !cartItems.length || cartItems.length > 99 || cartItems.some(item => !item || typeof item.id !== 'string' || !/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(item.id) || !Number.isSafeInteger(item.quantity) || item.quantity <= 0 || !Number.isFinite(Number(item.price)) || Number(item.price) <= 0)) throw new CheckoutError(400, 'Carrinho inválido.');
      const requestId = req.body?.requestId;
      if (!isRequestId(requestId)) throw new CheckoutError(400, 'Identificador da tentativa inválido.');
      let user = null;
      if (req.headers?.authorization) {
        const match = /^Bearer (\S+)$/i.exec(req.headers.authorization);
        if (!match) throw new CheckoutError(401, 'Entre novamente para continuar.');
        const { data, error } = await supabase.auth.getUser(match[1]);
        if (error || !data?.user?.email_confirmed_at || !data.user.email) throw new CheckoutError(401, 'Confirme seu e-mail e entre novamente.');
        user = data.user;
        if (user.email.toLowerCase() !== customer.email) throw new CheckoutError(403, 'Use o e-mail da sua conta para finalizar a compra.');
      }
      const attempt = await checkoutRpc(supabase, 'reserve_checkout', {
        p_request_id: requestId, p_actor_id: user?.id ?? null,
        p_customer: customer, p_items: cartItems, p_origin: origin,
      });
      if (attempt.state === 'expired') return res.status(409).json({ error: 'Esta tentativa expirou. Inicie uma nova compra.', terminal: true });
      const session = await recoverSession(stripe, requestId, attempt);
      const applied = await applySession(supabase, requestId, session);
      if (applied.state === 'expired') return res.status(409).json({ error: 'Esta tentativa expirou. Inicie uma nova compra.', terminal: true });
      const url = applied.state === 'paid' || session.status === 'complete'
        ? origin + '/pagamento-sucesso?session_id=' + encodeURIComponent(session.id) : session.url;
      if (!url) throw new Error('Sessão sem URL.');
      return res.status(200).json({ url, sessionId: session.id });
    } catch (error) {
      if (error.code === 'P0001') return res.status(409).json({ error: error.message });
      if (error instanceof CheckoutError) return res.status(error.status).json({ error: error.message });
      logger.error('[checkout] Não foi possível concluir a criação do pedido.');
      return res.status(500).json({ error: 'Não foi possível preparar o pagamento. Tente novamente em instantes.' });
    }
  };
}
