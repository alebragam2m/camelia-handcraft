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
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16"><path d="M11.42 9.49c-.23-.12-1.38-.68-1.6-.76-.23-.08-.4-.12-.57.12-.17.23-.62.76-.75.92-.14.15-.28.17-.5.05-.23-.11-1-.37-1.9-1.18-.7-.63-1.18-1.4-1.31-1.63-.14-.23-.01-.35.1-.47.1-.11.23-.26.34-.4.11-.13.15-.22.23-.37.07-.15.03-.28-.02-.4-.06-.11-.57-1.37-.78-1.87-.2-.5-.41-.43-.57-.44-.15-.01-.32-.01-.48-.01-.17 0-.44.06-.67.31-.23.25-.87.85-.87 2.06 0 1.2.9 2.37 1.02 2.54.12.16 1.73 2.64 4.19 3.68.59.25 1.05.4 1.41.51.58.18 1.11.16 1.54.1.48-.07 1.38-.56 1.58-1.1.2-.54.2-.1.14-.15-.06-.06-.23-.1-.46-.22z"/><path fillRule="evenodd" d="M8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0zm3.87 11.53c-.2.54-1.1 1.03-1.58 1.1-.43.06-.96.08-1.54-.1-.36-.11-.82-.26-1.41-.51-2.46-1.04-4.07-3.52-4.19-3.68-.12-.17-1.02-1.34-1.02-2.54 0-1.21.64-1.81.87-2.06.23-.25.5-.31.67-.31.16 0 .33 0 .48.01.16.01.37-.06.57.44.21.5.72 1.76.78 1.87.05.12.09.25.02.4-.11.14-.24.29-.34.4-.11.12-.24.24-.1.47.13.23.61 1 1.31 1.63.9.81 1.67 1.07 1.9 1.18.22.12.36.1.5-.05.13-.16.58-.69.75-.92.17-.24.34-.2.57-.12.22.08 1.37.64 1.6.76.23.12.34.18.39.28.05.1.05.58-.15 1.11z" clipRule="evenodd"/></svg>
                  </div>
                  <div>
                    <h4 className="font-bold text-secundaria font-sans text-lg">WhatsApp</h4>
                    <p className="text-gray-500 font-light">(91) 99114-5232</p>
                  </div>
                </a>

                <a href="mailto:ola@cameliahandcraft.com.br" className="flex items-center gap-5 group">
                  <div className="w-14 h-14 rounded-full bg-gray-100 text-gray-600 flex flex-shrink-0 items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                     <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-6 h-6"><path d="M3 4a2 2 0 0 0-2 2v1.161l8.441 4.221a1.25 1.25 0 0 0 1.118 0L19 7.162V6a2 2 0 0 0-2-2H3Z" /><path d="m19 8.839-7.77 3.885a2.75 2.75 0 0 1-2.46 0L1 8.839V14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8.839Z" /></svg>
                  </div>
                  <div>
                    <h4 className="font-bold text-secundaria font-sans text-lg">E-mail</h4>
                    <p className="text-gray-500 font-light">ola@cameliahandcraft.com.br</p>
                  </div>
                </a>
                
                <a href="https://instagram.com/camelia.handcraft" target="_blank" rel="noreferrer" className="flex items-center gap-5 group">
                  <div className="w-14 h-14 rounded-full bg-[#fcecf3] text-[#E1306C] flex flex-shrink-0 items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                     <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16"><path d="M8 0C5.829 0 5.556.01 4.703.048 3.85.088 3.269.222 2.76.42a3.9 3.9 0 0 0-1.417.923A3.9 3.9 0 0 0 .42 2.76C.222 3.268.087 3.85.048 4.7.01 5.555 0 5.827 0 8.001c0 2.172.01 2.444.048 3.297.04.852.174 1.433.372 1.942.205.526.478.972.923 1.417.444.445.89.719 1.416.923.51.198 1.09.333 1.942.372C5.555 15.99 5.827 16 8 16s2.444-.01 3.298-.048c.851-.04 1.434-.174 1.943-.372a3.9 3.9 0 0 0 1.416-.923c.445-.445.718-.891.923-1.417.197-.509.332-1.09.372-1.942C15.99 10.445 16 10.173 16 8s-.01-2.445-.048-3.299c-.04-.851-.175-1.433-.372-1.941a3.9 3.9 0 0 0-.923-1.417A3.9 3.9 0 0 0 13.24.42c-.51-.198-1.092-.333-1.943-.372C10.443.01 10.172 0 7.998 0zm-.717 1.442h.718c2.136 0 2.389.007 3.232.046.78.035 1.204.166 1.486.275.373.145.64.319.92.599s.453.546.598.92c.11.281.24.705.275 1.485.039.843.047 1.096.047 3.231s-.008 2.389-.047 3.232c-.035.78-.166 1.203-.275 1.485a2.5 2.5 0 0 1-.599.919c-.28.28-.546.453-.92.598-.28.11-.704.24-1.485.276-.843.038-1.096.047-3.232.047s-2.39-.009-3.233-.047c-.78-.036-1.203-.166-1.485-.276a2.5 2.5 0 0 1-.92-.598 2.5 2.5 0 0 1-.6-.92c-.109-.281-.24-.705-.275-1.485-.038-.843-.046-1.096-.046-3.233s.008-2.388.046-3.231c.036-.78.166-1.204.276-1.486.145-.373.319-.64.599-.92s.546-.453.92-.598c.282-.11.705-.24 1.485-.276.738-.034 1.024-.044 2.515-.045zm4.988 1.328a.96.96 0 1 0 0 1.92.96.96 0 0 0 0-1.92zm-4.27 1.122a4.109 4.109 0 1 0 0 8.217 4.109 4.109 0 0 0 0-8.217zm0 1.441a2.667 2.667 0 1 1 0 5.334 2.667 2.667 0 0 1 0-5.334z"/></svg>
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