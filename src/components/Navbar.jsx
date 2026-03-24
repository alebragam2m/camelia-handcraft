import React from 'react';
import { Link } from 'react-router-dom';

function Navbar() {
  return (
    <nav className="bg-branco border-b border-gray-100 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          
          {/* Logo Original */}
          <div className="flex-shrink-0 flex items-center">
            <Link to="/">
              <img 
                src="https://d2xsxph8kpxj0f.cloudfront.net/310519663333311457/jYnyUezM2roqgsENRZ6eYf/camelia-logo_6a948d64.png" 
                alt="Camélia Handcraft" 
                className="h-[48px] w-auto" 
              />
            </Link>
          </div>

          {/* Menus do site (Idêntico ao Manus) */}
          <div className="hidden md:flex space-x-10 items-center">
            <Link to="/" className="text-gray-600 hover:text-primaria transition-colors text-sm font-medium">Início</Link>
            <Link to="/colecoes" className="text-gray-600 hover:text-primaria transition-colors text-sm font-medium">Coleções</Link>
            <a href="/#sobre" className="text-gray-600 hover:text-primaria transition-colors text-sm font-medium">Sobre</a>
            <Link to="/contato" className="text-gray-600 hover:text-primaria transition-colors text-sm font-medium">Contato</Link>
            <Link to="/produtos" className="text-gray-600 hover:text-primaria transition-colors text-sm font-medium flex items-center gap-[6px]">
              Produtos
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3 text-gray-400">
                <path fillRule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
              </svg>
            </Link>
          </div>

          {/* Ícones do Canto Direito */}
          <div className="flex items-center space-x-6 text-gray-500">
            <button className="hover:text-primaria transition-colors" title="Buscar">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" /></svg>
            </button>
            <button className="hover:text-primaria transition-colors relative" title="Carrinho">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" /></svg>
            </button>
            {/* Login apenas com o bonequinho */}
            <Link to="/login" className="hover:text-primaria transition-colors ml-4 pl-4 border-l border-gray-200" title="Acesso do Administrador">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" /></svg>
            </Link>
          </div>

        </div>
      </div>
    </nav>
  );
}

export default Navbar;