import React from 'react';
import { Link } from 'react-router-dom';

function Footer() {
  return (
    <footer className="bg-secundaria text-branco pt-20 pb-10 border-t-[6px] border-[#8182C4]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8 lg:gap-12 mb-16">
          
          <div className="col-span-1 md:col-span-2 pr-8 flex flex-col items-start">
            <img 
               src="/logo-branca.png" 
               alt="Camélia Handcraft" 
               className="h-32 w-auto mb-4 opacity-100 drop-shadow-lg" 
            />
            <p className="text-gray-300 max-w-sm text-sm leading-loose">
              Mesa posta com afeto. Transforme sua casa com peças artesanais exclusivas feitas sob medida para você e suas visitas.
            </p>
          </div>

          <div>
            <h4 className="text-lg font-serif font-bold mb-6 text-[#D8B4E2]">Acesso Rápido</h4>
            <ul className="space-y-4 text-sm font-medium tracking-wide">
              <li><Link to="/colecoes" className="text-gray-300 hover:text-branco hover:translate-x-1 inline-block transition-all">Ver Coleções</Link></li>
              <li><Link to="/produtos" className="text-gray-300 hover:text-branco hover:translate-x-1 inline-block transition-all">Todos os Produtos</Link></li>
              <li><Link to="/legal?tab=termos" className="text-gray-300 hover:text-branco hover:translate-x-1 inline-block transition-all">Termos de Uso</Link></li>
              <li><Link to="/legal?tab=privacidade" className="text-gray-300 hover:text-branco hover:translate-x-1 inline-block transition-all">Política LGPD</Link></li>
              <li><Link to="/legal?tab=trocas" className="text-gray-300 hover:text-branco hover:translate-x-1 inline-block transition-all">Trocas e Devoluções</Link></li>
              <li><Link to="/legal" className="text-secundaria bg-branco px-3 py-1 rounded-lg hover:bg-secundaria hover:text-branco border border-branco inline-block mt-2 transition-all font-bold text-xs uppercase tracking-widest">Portal de Transparência</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-serif font-bold mb-6 text-[#D8B4E2]">Contatos</h4>
            <ul className="space-y-4 text-sm tracking-wide text-gray-300">
              <li>
                <a href="https://wa.me/5591991145232?text=Olá,%20Camélia!" target="_blank" rel="noreferrer" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                  <img src="https://api.iconify.design/logos:whatsapp-icon.svg" className="w-5 h-5" alt="WhatsApp" />
                  WhatsApp: (91) 99114-5232
                </a>
              </li>
              <li>
                <a href="mailto:ola@cameliahandcraft.com.br" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                  <img src="https://api.iconify.design/logos:google-gmail.svg" className="w-5 h-5" alt="E-mail" />
                  ola@cameliahandcraft.com.br
                </a>
              </li>
              <li>
                <a href="https://instagram.com/camelia.handcraft" target="_blank" rel="noreferrer" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                  <img src="https://api.iconify.design/skill-icons:instagram.svg" className="w-5 h-5" alt="Instagram" />
                  @camelia.handcraft
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-serif font-bold mb-6 text-[#D8B4E2]">Segurança</h4>
            <div className="flex flex-col space-y-4">
              <div className="flex items-center gap-3 text-gray-300">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-[#27ae60]"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" /></svg>
                <div className="text-sm">
                  <span className="block font-bold">Site Seguro</span>
                  <span className="text-xs opacity-70">Criptografia SSL (HTTPS)</span>
                </div>
              </div>
              <div className="flex items-center gap-3 text-gray-300">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-[#635BFF]"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z" /></svg>
                <div className="text-sm">
                  <span className="block font-bold">Pagamento Stripe PCI</span>
                  <span className="text-xs opacity-70">Dados Protegidos de Ponta a Ponta</span>
                </div>
              </div>
            </div>
          </div>

        </div>
        
        <div className="border-t border-gray-600/50 pt-8 flex flex-col md:flex-row justify-between items-center opacity-70 gap-4">
          <p className="text-xs text-gray-100 tracking-wide text-center md:text-left">© 2026 Camélia Handcraft. Todos os direitos reservados. Comprometidos com a LGPD e privacidade dos seus dados.</p>
          <div className="flex space-x-3 items-center bg-white/5 py-2 px-4 rounded-xl border border-white/10">
            <span className="text-[10px] uppercase font-bold tracking-widest text-[#D8B4E2] mr-2">Pagamento Seguro</span>
            <img src="https://api.iconify.design/logos:visa.svg" className="h-6 w-auto" alt="Visa" />
            <img src="https://api.iconify.design/logos:mastercard.svg" className="h-6 w-auto ml-1" alt="Mastercard" />
            <img src="https://api.iconify.design/simple-icons:pix.svg?color=%2332bcad" className="h-6 w-auto ml-2" alt="Pix" />
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;