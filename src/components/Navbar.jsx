import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';

function Navbar() {
  const { totalItems, setIsCartOpen } = useCart();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if(searchQuery.trim()) {
      navigate(`/produtos?search=${encodeURIComponent(searchQuery.trim())}`);
      setIsSearchOpen(false);
      setSearchQuery('');
      setIsMenuOpen(false);
    }
  };

  const navLinks = [
    { to: "/", label: "Início" },
    { to: "/produtos", label: "Produtos" },
    { to: "/colecoes", label: "Coleções" },
    { to: "/#sobre", label: "Sobre", isAnchor: true },
    { to: "/contato", label: "Contato" },
  ];

  const categories = [
    { to: "/produtos?cat=Porta+Guardanapos", label: "Porta Guardanapos" },
    { to: "/produtos?cat=Guardanapos", label: "Guardanapos" },
    { to: "/produtos?cat=Jogos+Americanos", label: "Jogos Americanos" },
    { to: "/produtos?cat=Diversos", label: "Diversos" },
  ];

  return (
    <nav className="bg-branco border-b border-gray-100 sticky top-0 z-[60] shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          
          {/* Logo - Ajustada para Mobile */}
          <div className="flex-shrink-0 flex items-center">
            <Link to="/" onClick={() => setIsMenuOpen(false)}>
              <img 
                src="/logo camelia vetor (1).svg" 
                onError={(e) => { e.target.src = '/logo.png' }}
                alt="Camélia Handcraft" 
                className="h-[78px] md:h-[104px] w-auto transition-all" 
              />
            </Link>
          </div>

          {/* Menu Desktop */}
          <div className="hidden md:flex space-x-10 items-center">
            <Link to="/" className="text-gray-600 hover:text-primaria transition-colors text-sm font-medium">Início</Link>

            <div className="relative group">
              <Link to="/produtos" className="text-gray-600 hover:text-primaria transition-colors text-sm font-medium flex items-center gap-[6px] py-6">
                Produtos
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3 text-gray-400 mt-[2px] transition-transform group-hover:rotate-180">
                  <path fillRule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
                </svg>
              </Link>
              <div className="absolute left-0 top-[60px] w-52 bg-white border border-gray-100 shadow-xl rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 z-50 flex flex-col py-3">
                {categories.map((cat, idx) => (
                  <Link key={idx} to={cat.to} className="px-5 py-3 text-sm text-gray-500 hover:bg-gray-50 hover:text-primaria transition-colors border-b border-gray-50/70 last:border-0">{cat.label}</Link>
                ))}
              </div>
            </div>

            <Link to="/colecoes" className="text-gray-600 hover:text-primaria transition-colors text-sm font-medium">Coleções</Link>
            <a href="/#sobre" className="text-gray-600 hover:text-primaria transition-colors text-sm font-medium">Sobre</a>
            <Link to="/contato" className="text-gray-600 hover:text-primaria transition-colors text-sm font-medium">Contato</Link>
          </div>

          {/* Ícones do Canto Direito */}
          <div className="flex items-center space-x-3 md:space-x-6 text-gray-500">
            <div className="relative">
              <button 
                onClick={() => { setIsSearchOpen(!isSearchOpen); setIsMenuOpen(false); }} 
                className="p-2 hover:text-primaria transition-colors overflow-visible" 
                title="Buscar"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" /></svg>
              </button>

              {isSearchOpen && (
                <div className="absolute right-0 top-12 w-64 md:w-72 bg-white shadow-2xl rounded-2xl p-4 border border-gray-100 z-50 animate-fade-in-down">
                  <form onSubmit={handleSearch} className="flex items-center">
                    <input 
                      autoFocus
                      type="text" 
                      placeholder="Pesquisar produtos..." 
                      className="w-full bg-gray-50 px-4 py-2 rounded-xl text-sm outline-none border border-transparent focus:border-primaria transition-colors"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <button type="submit" className="ml-2 bg-primaria text-white p-2 rounded-xl hover:bg-secundaria transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" /></svg>
                    </button>
                  </form>
                </div>
              )}
            </div>

            <button
              onClick={() => { setIsCartOpen(true); setIsMenuOpen(false); }}
              className="p-2 hover:text-primaria transition-colors relative"
              title="Carrinho de Compras"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" /></svg>
              {totalItems > 0 && (
                <span className="absolute top-0 right-0 bg-primaria text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow">
                  {totalItems > 9 ? '9+' : totalItems}
                </span>
              )}
            </button>

            {/* Login / Área do Cliente */}
            <Link to="/login" onClick={() => setIsMenuOpen(false)} className="hidden md:flex hover:text-primaria transition-colors ml-4 pl-4 border-l border-gray-200" title="Área do Cliente">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" /></svg>
            </Link>

            {/* Botão Menu Mobile (Hamburguer) */}
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)} 
              className="md:hidden p-2 text-gray-600 hover:text-primaria transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                )}
              </svg>
            </button>
          </div>

        </div>
      </div>

      {/* Drawer Menu Mobile Overlay */}
      {isMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          <div className="fixed inset-0 bg-secundaria/40 backdrop-blur-sm" onClick={() => setIsMenuOpen(false)}></div>
          <div className="relative bg-white w-full max-w-[300px] h-full shadow-2xl p-8 flex flex-col animate-slide-in-right">
            
            <div className="mb-12">
               <span className="text-[10px] uppercase font-bold tracking-[4px] text-gray-400 block mb-6">Menu de Navegação</span>
               <div className="space-y-6">
                  {navLinks.map((link, idx) => (
                    link.isAnchor ? (
                      <a key={idx} href={link.to} onClick={() => setIsMenuOpen(false)} className="block text-xl font-serif font-medium text-secundaria hover:text-primaria transition-colors">{link.label}</a>
                    ) : (
                      <Link key={idx} to={link.to} onClick={() => setIsMenuOpen(false)} className="block text-xl font-serif font-medium text-secundaria hover:text-primaria transition-colors">{link.label}</Link>
                    )
                  ))}
               </div>
            </div>

            <div className="flex-1">
               <span className="text-[10px] uppercase font-bold tracking-[4px] text-gray-400 block mb-6">Produtos por Coleção</span>
               <div className="space-y-4">
                  {categories.map((cat, idx) => (
                    <Link key={idx} to={cat.to} onClick={() => setIsMenuOpen(false)} className="block text-sm text-gray-500 hover:text-primaria transition-colors font-medium">{cat.label}</Link>
                  ))}
               </div>
            </div>

            <div className="mt-auto border-t border-gray-100 pt-8">
               <Link to="/login" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 text-secundaria font-bold text-sm tracking-widest uppercase">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" /></svg>
                  Área do Cliente
               </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}

export default Navbar;
