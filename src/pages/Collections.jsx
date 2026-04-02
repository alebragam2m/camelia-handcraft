import React from 'react';
import { Link } from 'react-router-dom';

function Collections() {
  const collections = [
    { nome: 'Flores', img: 'https://images.unsplash.com/photo-1528698827591-e19ccd7bc23d?auto=format&fit=crop&w=500&q=80' },
    { nome: 'Frutas e Legumes', img: 'https://images.unsplash.com/photo-1579227114347-15d08fc37cae?auto=format&fit=crop&w=500&q=80' },
    { nome: 'Provence', img: 'https://images.unsplash.com/photo-1544148103-0773bf10d330?auto=format&fit=crop&w=500&q=80' },
    { nome: 'Diversos', img: 'https://images.unsplash.com/photo-1512341689857-198e7e2f3ca8?auto=format&fit=crop&w=500&q=80' },
    { nome: 'Páscoa', img: 'https://images.unsplash.com/photo-1617231427187-5755105b0b97?auto=format&fit=crop&w=500&q=80' },
    { nome: 'Círio', img: 'https://images.unsplash.com/photo-1574343899222-1dbdeebc8091?auto=format&fit=crop&w=500&q=80' },
    { nome: 'Natal', img: 'https://images.unsplash.com/photo-1512341689857-198e7e2f3ca8?auto=format&fit=crop&w=500&q=80' },
    { nome: 'Verão', img: 'https://images.unsplash.com/photo-1620073238714-9988ff8d5bf3?auto=format&fit=crop&w=500&q=80' }
  ];

  return (
    <div className="bg-fundo min-h-screen relative overflow-hidden">
      {/* Subtle body cross pattern */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '30px 30px'}}></div>

      {/* Hero Banner Interno */}
      <section className="relative bg-secundaria text-branco py-24 px-6 text-center shadow-md">
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] mix-blend-overlay pointer-events-none"></div>
        <div className="relative z-10 max-w-3xl mx-auto">
          <p className="text-xs tracking-[6px] uppercase font-bold text-[#D8B4E2] mb-4">Mesa Temática</p>
          <h1 className="text-4xl md:text-5xl font-serif font-medium tracking-tight">
            Nossas Coleções
          </h1>
        </div>
      </section>

      {/* Grid de Coleções Idêntico a Home */}
      <section className="py-20 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          {collections.map((col, i) => (
            <Link to="/produtos" key={i} className="group relative h-[220px] rounded-2xl overflow-hidden shadow-md cursor-pointer transform transition duration-500 hover:-translate-y-2">
              <img src={col.img} alt={col.nome} className="w-full h-full object-cover transition duration-700 group-hover:scale-110" />
              <div className="absolute inset-0 bg-secundaria/50 group-hover:bg-secundaria/30 transition duration-500"></div>
              <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
                <h3 className="text-branco text-2xl font-serif font-bold text-center tracking-wide drop-shadow-lg">{col.nome}</h3>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

export default Collections;