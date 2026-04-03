import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { productService } from '../services/supabaseService';

function Collections() {
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCols = async () => {
      try {
        const data = await productService.getUniqueCollections();
        // Filtra "Sem linha / Coleção" para limpeza visual
        setCollections(data.filter(c => c.nome !== 'Sem linha / Coleção'));
      } catch (err) {
        console.error('Erro ao buscar coleções:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCols();
  }, []);

  return (
    <div className="bg-fundo min-h-screen relative overflow-hidden">
      {/* Subtle body cross pattern */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '30px 30px'}}></div>

      {/* Hero Banner Interno */}
      <section className="relative bg-secundaria text-branco py-24 px-6 text-center shadow-md">
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] mix-blend-overlay pointer-events-none"></div>
        <div className="relative z-10 max-w-3xl mx-auto">
          {/* Texto 'Mesa Temática' removido conforme solicitado */}
          <h1 className="text-4xl md:text-5xl font-serif font-medium tracking-tight">
            Nossas Coleções
          </h1>
        </div>
      </section>

      {/* Grid de Coleções Dinâmico */}
      <section className="py-20 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 animate-pulse">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-[220px] bg-gray-100 rounded-2xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {collections.map((col, i) => (
              <Link to={`/produtos?col=${encodeURIComponent(col.nome)}`} key={i} className="group relative h-[220px] rounded-2xl overflow-hidden shadow-md cursor-pointer transform transition duration-500 hover:-translate-y-2 translate-z-0">
                <img 
                  src={col.img || '/logo.png'} 
                  alt={col.nome} 
                  className="w-full h-full object-cover transition duration-700 group-hover:scale-110" 
                  onError={(e) => { e.target.src = '/logo.png'; }}
                />
                <div className="absolute inset-0 bg-secundaria/50 group-hover:bg-secundaria/30 transition duration-500"></div>
                <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
                  <h3 className="text-branco text-xl md:text-2xl font-serif font-bold text-center tracking-wide">{col.nome}</h3>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default Collections;