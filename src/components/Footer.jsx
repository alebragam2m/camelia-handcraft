import React from 'react';
import { Link } from 'react-router-dom';

function Footer() {
  return (
    <footer className="bg-secundaria text-branco pt-20 pb-10 border-t-[6px] border-[#8182C4]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          
          <div className="col-span-1 md:col-span-2 pr-8 flex flex-col items-start">
            <img 
               src="https://d2xsxph8kpxj0f.cloudfront.net/310519663333311457/jYnyUezM2roqgsENRZ6eYf/camelia-logo_6a948d64.png" 
               alt="Camélia Handcraft" 
               className="h-16 w-auto mb-6 brightness-0 invert opacity-90" 
            />
            <p className="text-gray-300 max-w-sm text-sm leading-loose">
              Mesa posta com afeto. Transforme sua casa com peças artesanais exclusivas feitas sob medida para você e suas visitas.
            </p>
          </div>

          <div>
            <h4 className="text-lg font-serif font-bold mb-6 text-[#D8B4E2]">Links Rápidos</h4>
            <ul className="space-y-4 text-sm font-medium tracking-wide">
              <li><Link to="/" className="text-gray-300 hover:text-branco hover:translate-x-1 inline-block transition-all">Início</Link></li>
              <li><Link to="/colecoes" className="text-gray-300 hover:text-branco hover:translate-x-1 inline-block transition-all">Coleções</Link></li>
              <li><Link to="/produtos" className="text-gray-300 hover:text-branco hover:translate-x-1 inline-block transition-all">Produtos</Link></li>
              <li><a href="/#sobre" className="text-gray-300 hover:text-branco hover:translate-x-1 inline-block transition-all">Sobre Nós</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-serif font-bold mb-6 text-[#D8B4E2]">Contatos</h4>
            <ul className="space-y-4 text-sm tracking-wide text-gray-300">
              <li>
                <a href="https://wa.me/5591991145232?text=Olá,%20Camélia!" target="_blank" rel="noreferrer" className="flex items-center gap-3 hover:text-[#25D366] transition-colors">
                  <span className="text-lg">💬</span> WhatsApp: (91) 99114-5232
                </a>
              </li>
              <li>
                <a href="mailto:ola@cameliahandcraft.com.br" className="flex items-center gap-3 hover:text-white transition-colors">
                  <span className="text-lg">✉️</span> ola@cameliahandcraft.com.br
                </a>
              </li>
              <li>
                <a href="https://instagram.com/camelia.handcraft" target="_blank" rel="noreferrer" className="flex items-center gap-3 hover:text-[#E1306C] transition-colors">
                  <span className="text-lg">📸</span> @camelia.handcraft
                </a>
              </li>
            </ul>
          </div>

        </div>
        
        <div className="border-t border-gray-600/50 pt-8 flex flex-col md:flex-row justify-between items-center opacity-70">
          <p className="text-xs text-gray-100 tracking-wide">© 2026 Camélia Handcraft. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;