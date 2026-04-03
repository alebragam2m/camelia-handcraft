import React from 'react';

function Contact() {
  return (
    <div className="bg-fundo min-h-screen relative overflow-hidden">
      {/* Subtle body cross pattern */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '30px 30px'}}></div>

      {/* Hero Banner Interno */}
      <section className="relative bg-secundaria text-branco py-24 px-6 text-center shadow-md">
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] mix-blend-overlay pointer-events-none"></div>
        <div className="relative z-10 max-w-3xl mx-auto">
          <p className="text-xs tracking-[6px] uppercase font-bold text-[#D8B4E2] mb-4">Fale Conosco</p>
          <h1 className="text-4xl md:text-5xl font-serif font-medium tracking-tight">
            Atendimento
          </h1>
        </div>
      </section>

      {/* Seção Principal de Contato */}
      <section className="py-20 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 bg-transparent rounded-3xl overflow-hidden">
          
          {/* Formulário Falso Visual Dinâmico */}
          <div className="bg-white p-10 md:p-14 shadow-2xl rounded-3xl border border-gray-100 relative">
            <h2 className="text-2xl font-serif font-bold text-secundaria mb-2">Envie uma Mensagem</h2>
            <p className="text-gray-500 text-sm mb-8 font-light">Tire suas dúvidas ou solicite um orçamento exclusivo.</p>
            
            <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); alert("Em breve: Integração para enviar e-mails!");}}>
              <div>
                <input type="text" placeholder="Seu Nome Completo" className="w-full p-4 bg-gray-50/50 border border-gray-200 rounded-xl outline-none focus:border-primaria focus:bg-white focus:ring-4 focus:ring-primaria/10 transition-all text-sm font-medium text-gray-700" required />
              </div>
              <div>
                <input type="email" placeholder="Seu E-mail Corporativo" className="w-full p-4 bg-gray-50/50 border border-gray-200 rounded-xl outline-none focus:border-primaria focus:bg-white focus:ring-4 focus:ring-primaria/10 transition-all text-sm font-medium text-gray-700" required />
              </div>
              <div>
                <textarea rows="4" placeholder="Sua Mensagem Detalhada" className="w-full p-4 bg-gray-50/50 border border-gray-200 rounded-xl outline-none focus:border-primaria focus:bg-white focus:ring-4 focus:ring-primaria/10 transition-all text-sm font-medium text-gray-700 resize-none" required></textarea>
              </div>
              <button type="submit" className="w-full bg-primaria text-white font-bold uppercase tracking-widest text-xs py-5 rounded-xl hover:bg-[#5556A0] transition-transform hover:-translate-y-1 mt-2 shadow-lg hover:shadow-primaria/40">
                Enviar E-mail
              </button>
            </form>
          </div>

          {/* Dados de Contato Direto */}
          <div className="flex flex-col justify-center space-y-10 py-6 pl-4 md:pl-10">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-[4px] text-gray-400 mb-8">Contatos Diretos</h3>
              <div className="space-y-8">
                
                <a href="https://wa.me/5591991145232" target="_blank" rel="noreferrer" className="flex items-center gap-5 group">
                  <div className="w-14 h-14 rounded-full bg-[#E8F8F0] text-[#25D366] flex flex-shrink-0 items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                    <img src="https://api.iconify.design/logos:whatsapp-icon.svg" className="w-6 h-6" alt="WhatsApp" />
                  </div>
                  <div>
                    <h4 className="font-bold text-secundaria font-sans text-lg">WhatsApp</h4>
                    <p className="text-gray-500 font-light">(91) 99114-5232</p>
                  </div>
                </a>

                <a href="mailto:ola@cameliahandcraft.com.br" className="flex items-center gap-5 group">
                  <div className="w-14 h-14 rounded-full bg-gray-100 text-gray-600 flex flex-shrink-0 items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                    <img src="https://api.iconify.design/logos:google-gmail.svg" className="w-6 h-6" alt="Gmail" />
                  </div>
                  <div>
                    <h4 className="font-bold text-secundaria font-sans text-lg">E-mail</h4>
                    <p className="text-gray-500 font-light">ola@cameliahandcraft.com.br</p>
                  </div>
                </a>
                
                <a href="https://instagram.com/camelia.handcraft" target="_blank" rel="noreferrer" className="flex items-center gap-5 group">
                  <div className="w-14 h-14 rounded-full bg-[#fcecf3] text-[#E1306C] flex flex-shrink-0 items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                    <img src="https://api.iconify.design/skill-icons:instagram.svg" className="w-6 h-6" alt="Instagram" />
                  </div>
                  <div>
                    <h4 className="font-bold text-secundaria font-sans text-lg">Instagram</h4>
                    <p className="text-gray-500 font-light">@camelia.handcraft</p>
                  </div>
                </a>

              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}

export default Contact;