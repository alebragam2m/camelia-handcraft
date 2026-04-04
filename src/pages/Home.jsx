import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { productService } from '../services/productService';

function Home() {
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCols = async () => {
      try {
        const data = await productService.getUniqueCollections();
        // Filtra coleções vazias ou genéricas
        setCollections(data.filter(c => c !== 'Sem linha / Coleção' && c !== ''));
      } catch (err) {
        console.error('Erro ao buscar coleções:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCols();
  }, []);

  return (
    <div className="bg-fundo min-h-screen">
      
      {/* Hero Section (Fundo Roxo Escuro Mantido conforme aprovação) */}
      <section className="relative bg-secundaria text-branco py-32 px-6 lg:px-12 flex flex-col items-center justify-center text-center overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] mix-blend-overlay"></div>
        <div className="relative z-10 max-w-4xl mx-auto flex flex-col items-center">
          <h1 className="text-sm md:text-base tracking-[6px] uppercase font-light text-[#D8B4E2] mb-6">Feito à mão com amor</h1>
          
          <h2 className="text-4xl md:text-7xl font-serif font-medium mb-12 tracking-tight italic">
            Camélia Handcraft
          </h2>
          
          <div className="text-lg md:text-xl text-gray-200 mb-14 max-w-3xl mx-auto font-light leading-relaxed space-y-4">
            <p>Duas gerações, uma paixão: filha e mãe criando peças exclusivas para sua mesa</p>
            <p>Cada porta guardanapo é único, delicado e chique — feito à mão para tornar seus momentos em família ainda mais especiais</p>
          </div>
          
          <a href="https://wa.me/5591991145232?text=Olá, vim do site e gostaria de solicitar uma criação sob medida!" target="_blank" rel="noreferrer" className="inline-flex items-center gap-3 bg-primaria text-branco font-bold uppercase tracking-widest text-sm px-10 py-5 rounded-full shadow-2xl hover:bg-[#5556A0] hover:-translate-y-1 transition duration-300">
            SOLICITAR CRIAÇÃO SOB MEDIDA
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M17.25 8.25 21 12m0 0-3.75 3.75M21 12H3" /></svg>
          </a>
        </div>
      </section>

      {/* Dinamismo Total: Exibição das Coleções Reais do Banco */}
      <section className="py-20 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <p className="text-xs tracking-[4px] uppercase text-gray-400 mb-3 font-medium">Nossas Coleções</p>
          {/* Título Removido conforme solicitado */}
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 animate-pulse">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-[220px] bg-gray-100 rounded-2xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {collections.map((colName, i) => (
              <Link to={`/produtos?col=${encodeURIComponent(colName)}`} key={i} className="group relative h-[220px] rounded-2xl overflow-hidden shadow-lg cursor-pointer transform transition duration-500 hover:-translate-y-2 translate-z-0">
                <img 
                   src="/logo.png" // Como é apenas o nome, usamos a logo ou uma imagem padrão
                  alt={colName} 
                  className="w-full h-full object-cover transition duration-700 group-hover:scale-110 opacity-50" 
                />
                <div className="absolute inset-0 bg-secundaria/50 group-hover:bg-secundaria/30 transition duration-500"></div>
                <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
                  <h3 className="text-branco text-xl md:text-2xl font-serif font-bold text-center tracking-wide">{colName}</h3>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Nossa História - Seção Sobre Inteira Clonada do Manus */}
      <section id="sobre" className="py-24 bg-branco border-t border-gray-100 relative overflow-hidden">
        {/* Subtle cross pattern background mimicking original */}
        <div className="absolute inset-0 opacity-[0.03]" style={{backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '30px 30px'}}></div>
        
        <div className="max-w-4xl mx-auto px-6 relative z-10">
          <div className="text-left mb-12">
            <p className="text-xs tracking-[4px] uppercase text-primaria mb-4 font-bold">Nossa História</p>
            <h2 className="text-4xl md:text-5xl font-serif font-bold text-secundaria mb-8 leading-tight">Camélia Handcraft</h2>
          </div>
          
          <div className="space-y-6 text-gray-700 leading-loose text-lg font-light">
            <p>
              Duas gerações, uma paixão. A Camélia Handcraft nasceu do amor entre mãe e filha pela arte de criar peças únicas e exclusivas para mesa.
            </p>
            <p>
              Cada porta guardanapo é cuidadosamente elaborado à mão, com materiais selecionados e atenção aos mínimos detalhes. Nosso objetivo é transformar momentos simples em experiências memoráveis.
            </p>
            <p>
              Acreditamos que a mesa é o coração da casa, onde famílias se reúnem e memórias são criadas. Por isso, dedicamos nosso trabalho a tornar esses momentos ainda mais especiais.
            </p>
          </div>
          
          {/* Badge Stats idênticas ao documento do Manus */}
          <div className="grid grid-cols-2 sm:grid-cols-3 border-t border-gray-200 mt-16 pt-10 gap-8 md:gap-16">
            <div className="flex flex-col items-start">
              <h4 className="text-3xl md:text-4xl font-bold text-primaria font-sans mb-1">100%</h4>
              <p className="text-[10px] md:text-sm text-gray-500 uppercase tracking-widest font-medium">Feito à mão</p>
            </div>
            <div className="flex flex-col items-start">
              <h4 className="text-3xl md:text-4xl font-bold text-primaria font-sans mb-1">2</h4>
              <p className="text-[10px] md:text-sm text-gray-500 uppercase tracking-widest font-medium">Gerações</p>
            </div>
            <div className="flex flex-col items-start col-span-2 sm:col-span-1">
              <h4 className="text-3xl md:text-4xl font-bold text-primaria font-sans mb-1">Único</h4>
              <p className="text-[10px] md:text-sm text-gray-500 uppercase tracking-widest font-medium">Cada peça</p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Catálogo Teaser Section */}
      <section className="py-24 bg-[#F8F8FC]">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-xs tracking-[4px] uppercase text-gray-400 mb-3 font-medium">Catálogo</p>
          <h2 className="text-4xl font-serif font-bold text-secundaria mb-12">Todos os Produtos</h2>
          <Link to="/produtos" className="inline-block border-2 border-primaria text-primaria font-bold uppercase tracking-widest text-sm px-10 py-3 rounded-full hover:bg-primaria hover:text-branco transition duration-300">
            Explorar Catálogo Visual
          </Link>
        </div>
      </section>

    </div>
  );
}

export default Home;