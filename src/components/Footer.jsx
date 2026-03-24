import './Footer.css';

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-content">
        
        {/* Lado Esquerdo: Info da Marca */}
        <div className="footer-section">
          <h3>Camélia Handcraft</h3>
          <p>Levando elegância e afeto para a sua mesa posta.</p>
          <div className="social-links">
            <span>Instagram</span> • <span>WhatsApp</span>
          </div>
        </div>

        {/* Centro: Links Rápidos */}
        <div className="footer-section">
          <h4>Navegação</h4>
          <ul>
            <li>Sobre nós</li>
            <li>Políticas de Envio</li>
            <li>Trocas e Devoluções</li>
          </ul>
        </div>

        {/* Lado Direito: SEGURANÇA MINIMALISTA */}
        <div className="footer-section">
          <h4>Segurança e Pagamento</h4>
          
          <div className="security-minimal">
            <div className="security-item">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg>
              <span>Ambiente 100% Seguro</span>
            </div>
            <div className="security-item">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              <span>Criptografia SSL</span>
            </div>
          </div>

          <div className="payment-icons">
            <div className="icons-row">
              <img src="https://logopng.com.br/logos/pix-106.png" alt="Pix" />
              <img src="https://upload.wikimedia.org/wikipedia/commons/a/a4/Mastercard_2019_logo.svg" alt="Mastercard" />
              <img src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" alt="Visa" />
            </div>
          </div>
        </div>

      </div>

      <div className="footer-bottom">
        <p>&copy; 2026 Camélia Handcraft. Todos os direitos reservados. 🌿</p>
      </div>
    </footer>
  );
}

export default Footer;