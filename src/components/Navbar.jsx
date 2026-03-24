import React from 'react';
import { Link } from 'react-router-dom';

function Navbar() {
  return (
    <nav className="bg-branco border-b border-gray-100 sticky top-0 z-50 sha shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center flex-col justify-center">
            <Link to="/" className="text-2xl font-serif font-bold text-primaria tracking-widest uppercase mb-0 pb-0 flex flex-col items-center">
              Camélia
              <span className="text-[10px] opacity-50 tracking-[4px] font-sans -mt-1 text-secundaria">HANDCRAFT</span>
            </Link>
          </div>

          {/* Center Links */}
          <div className="hidden md:flex space-x-8">
            <Link to="/" className="text-gray-600 hover:text-primaria font-medium transition-colors text-sm uppercase tracking-wide">Início</Link>
            <Link to="/colecoes" className="text-gray-600 hover:text-primaria font-medium transition-colors text-sm uppercase tracking-wide">Coleções</Link>
            <Link to="/produtos" className="text-gray-600 hover:text-primaria font-medium transition-colors text-sm uppercase tracking-wide">Catálogo</Link>
            <Link to="/contato" className="text-gray-600 hover:text-primaria font-medium transition-colors text-sm uppercase tracking-wide">Contato</Link>
          </div>

          {/* Right Icons: Search, Cart, Login */}
          <div className="flex items-center space-x-5 text-gray-500">
            <button className="hover:text-primaria transition-colors text-lg">🔍</button>
            <button className="hover:text-primaria transition-colors relative text-lg">
              🛒
              <span className="absolute -top-1 -right-2 bg-secundaria text-branco text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center">0</span>
            </button>
            <Link to="/login" className="hover:text-primaria transition-colors ml-4 border-l pl-4 border-gray-200 text-sm font-bold uppercase tracking-wide flex items-center gap-2">
              <span>Login</span>
            </Link>
          </div>

        </div>
      </div>
    </nav>
  );
}

export default Navbar;