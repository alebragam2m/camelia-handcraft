import './Contact.css';

function Contact() {
  const handleSubmit = (e) => {
    e.preventDefault();
    // Aqui futuramente você pode ligar com um serviço de e-mail real
    alert("Obrigado pela mensagem! Em breve entraremos em contato. 💜");
  };

  return (
    <div className="contact-container">
      <div className="contact-card">
        <h1 className="contact-title">Vamos Conversar?</h1>
        <p className="contact-subtitle">
          Adoramos fazer parte dos seus momentos especiais.<br />
          Tem alguma dúvida sobre encomendas, prazos ou quer algo personalizado? 
          Escreva para nós!
        </p>

        <form className="contact-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Seu Nome</label>
            <input 
              type="text" 
              id="name" 
              placeholder="Como você gosta de ser chamado?" 
              required 
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Seu E-mail</label>
            <input 
              type="email" 
              id="email" 
              placeholder="exemplo@email.com" 
              required 
            />
          </div>

          <div className="form-group">
            <label htmlFor="message">Sua Mensagem</label>
            <textarea 
              id="message" 
              rows="5" 
              placeholder="Conte-nos como podemos ajudar..." 
              required
            ></textarea>
          </div>

          <button type="submit" className="submit-button">
            Enviar Mensagem 💌
          </button>
        </form>

        <div className="contact-footer">
          <p>Preferir falar direto? Nos chame no WhatsApp ou Instagram <strong>@cameliahandcraft</strong></p>
        </div>
      </div>
    </div>
  );
}

export default Contact;