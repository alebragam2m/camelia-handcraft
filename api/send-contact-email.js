// Vercel Serverless Function
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

// Remove quebras de linha do que vai pro assunto/cabeçalho, evitando injeção.
function sanitizeHeaderValue(value) {
  return value.replace(/[\r\n]+/g, ' ').trim();
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;',
  })[char]);
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
  const safeEmail = sanitizeHeaderValue(email);
  const safeMessage = message.trim();

  if (!process.env.RESEND_API_KEY) {
    console.error('[send-contact-email] RESEND_API_KEY não configurada.');
    return res.status(503).json({ message: 'O canal de e-mail está temporariamente indisponível. Fale conosco pelo WhatsApp.' });
  }

  try {
    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Site Camélia <site@cameliahandcraft.com.br>',
        to: ['ola@cameliahandcraft.com.br'],
        reply_to: safeEmail,
        subject: `Nova mensagem de contato — ${safeName}`,
        text: `Nome: ${safeName}\nE-mail: ${safeEmail}\n\nMensagem:\n${safeMessage}`,
        html: `
          <div style="background:#f8f8fc;padding:32px;font-family:Arial,sans-serif;color:#2d2b52">
            <div style="max-width:600px;margin:auto;background:#fff;border-radius:24px;overflow:hidden;border:1px solid #eeeef6">
              <div style="background:#2d2b52;padding:20px 28px;color:#fff">
                <img
                  src="https://www.cameliahandcraft.com.br/logo-branca.png"
                  width="110"
                  alt="Camélia Handcraft"
                  style="display:block;width:110px;max-width:100%;height:auto;margin:0 0 12px;border:0"
                />
                <h1 style="margin:0;font-family:Georgia,serif;font-size:22px;line-height:1.25">Nova mensagem pelo site</h1>
              </div>
              <div style="padding:32px">
                <p style="margin:0 0 8px;font-size:12px;color:#8b8b9e;text-transform:uppercase;letter-spacing:1px">Cliente</p>
                <p style="margin:0 0 4px;font-size:18px;font-weight:bold">${escapeHtml(safeName)}</p>
                <p style="margin:0 0 28px;color:#666">${escapeHtml(safeEmail)}</p>
                <p style="margin:0 0 8px;font-size:12px;color:#8b8b9e;text-transform:uppercase;letter-spacing:1px">Mensagem</p>
                <div style="white-space:pre-wrap;line-height:1.7;background:#f8f8fc;padding:20px;border-radius:14px">${escapeHtml(safeMessage)}</div>
              </div>
            </div>
          </div>`,
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
