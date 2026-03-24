import React from 'react';
import { Link } from 'react-router-dom';

function Footer() {
  return (
    <footer className="bg-secundaria text-branco pt-20 pb-10 border-t-[10px] border-primaria">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          
          <div className="col-span-1 md:col-span-2 pr-8">
            <h3 className="text-3xl font-serif font-bold tracking-widest uppercase mb-4 text-branco flex flex-col">
              Camélia 
              <span className="text-[11px] opacity-60 tracking-[8px] font-sans mt-1 text-[#D8B4E2]">HANDCRAFT</span>
            </h3>
            <p className="text-gray-300 max-w-sm mt-6 text-sm leading-loose">
              Mesa posta com afeto. Transforme sua casa com peças artesanais exclusivas feitas sob medida para você e suas visitas.
            </p>
          </div>

          <div>
            <h4 className="text-lg font-serif font-bold mb-6 text-[#D8B4E2]">Links Rápidos</h4>
            <ul className="space-y-4">
              <li><Link to="/" className="text-gray-300 hover:text-branco hover:translate-x-1 inline-block transition-all">Início</Link></li>
              <li><Link to="/colecoes" className="text-gray-300 hover:text-branco hover:translate-x-1 inline-block transition-all">Coleções Temáticas</Link></li>
              <li><Link to="/produtos" className="text-gray-300 hover:text-branco hover:translate-x-1 inline-block transition-all">Catálogo de Produtos</Link></li>
              <li><Link to="/contato" className="text-gray-300 hover:text-branco hover:translate-x-1 inline-block transition-all">Fale Conosco</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-serif font-bold mb-6 text-[#D8B4E2]">Atendimento</h4>
            <ul className="space-y-4 text-gray-300 text-sm">
              <li className="flex items-center gap-3">
                <span className="text-xl">📱</span> (00) 99999-9999
              </li>
              <li className="flex items-center gap-3">
                <span className="text-xl">✉️</span> contato@camelia.com.br
              </li>
              <li className="flex items-center gap-3">
                <span className="text-xl">📸</span> @cameliahandcraft
              </li>
            </ul>
          </div>

        </div>
        
        <div className="border-t border-gray-600/50 pt-8 flex flex-col md:flex-row justify-between items-center opacity-70">
          <p className="text-xs text-gray-100 tracking-wide">© 2026 Camélia Handcraft. Todos os direitos reservados.</p>
          <div className="text-xs text-gray-300 mt-4 md:mt-0 tracking-wide">
            Powered by Supabase & React 19
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;