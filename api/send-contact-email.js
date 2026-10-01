// Vercel Serverless Function
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

// Remove quebras de linha do que vai pro assunto/cabeçalho, evitando injeção.
function sanitizeHeaderValue(value) {
  return value.replace(/[\r\n]+/g, ' ').trim();
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { name, email, message } = req.body || {};

  if (!isNonEmptyString(name) || !isNonEmptyString(email) || !isNonEmptyString(message)) {
    return res.status(400).json({ message: 'Nome, e-mail e mensagem são obrigatórios.' });
  }
  if (name.length > 200 || email.length > 200 || message.length > 5000) {
    return res.status(400).json({ message: 'Dados muito longos.' });
  }
  if (!EMAIL_REGEX.test(email)) {
    return res.status(400).json({ message: 'E-mail inválido.' });
  }

  const safeName = sanitizeHeaderValue(name);

  try {
    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Camélia Handcraft <contato@cameliahandcraft.com.br>',
        to: ['ola@cameliahandcraft.com.br'],
        reply_to: email,
        subject: `Nova mensagem de contato — ${safeName}`,
        text: `Nome: ${safeName}\nE-mail: ${email}\n\nMensagem:\n${message}`,
      }),
    });

    if (!resendRes.ok) {
      const errBody = await resendRes.text();
      console.error('[send-contact-email] Resend respondeu com erro:', resendRes.status, errBody);
      return res.status(502).json({ message: 'Não foi possível enviar sua mensagem agora. Tente novamente em instantes ou chame no WhatsApp.' });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('[send-contact-email] Erro inesperado:', err);
    return res.status(500).json({ message: 'Erro inesperado ao enviar sua mensagem.' });
  }
}
