import React from 'react';
import { Link } from 'react-router-dom';

function Home() {
  return (
    <div className="bg-fundo min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-secundaria text-branco py-32 px-6 lg:px-12 flex flex-col items-center justify-center text-center overflow-hidden">
        {/* Subtle background pattern */}
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] mix-blend-overlay"></div>
        <div className="relative z-10 max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-serif font-bold mb-8 tracking-tight">
            Feito à mão com <span className="mx-2 italic text-[#D8B4E2] font-light">amor</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-200 mb-12 max-w-2xl mx-auto font-light leading-relaxed">
            Descubra as mais belas coleções de mesa posta, com jogos americanos, guardanapos e detalhes que transformam suas recepções em momentos inesquecíveis.
          </p>
          <Link to="/colecoes" className="inline-flex items-center gap-3 bg-branco text-secundaria font-bold uppercase tracking-widest text-sm px-10 py-5 rounded-full shadow-2xl hover:shadow-[0_20px_50px_rgba(255,255,255,0.2)] hover:-translate-y-1 transition duration-300">
            Explorar Coleções
            <span className="text-lg">→</span>
          </Link>
        </div>
      </section>

      {/* Coleções Temáticas */}
      <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-primaria mb-4">Nossas Coleções</h2>
          <div className="w-24 h-1 bg-primaria mx-auto opacity-50 rounded"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { nome: 'Provence', img: 'https://images.unsplash.com/photo-1579227114347-15d08fc37cae?auto=format&fit=crop&w=800&q=80', desc: 'Charme rústico francês' },
            { nome: 'Flores', img: 'https://images.unsplash.com/photo-1528698827591-e19ccd7bc23d?auto=format&fit=crop&w=800&q=80', desc: 'Beleza natural e frescor' },
            { nome: 'Clássica', img: 'https://images.unsplash.com/photo-1544148103-0773bf10d330?auto=format&fit=crop&w=800&q=80', desc: 'Atemporal e elegante' }
          ].map((col, i) => (
            <div key={i} className="group relative h-[400px] rounded-3xl overflow-hidden shadow-xl cursor-pointer transform transition duration-500 hover:scale-[1.03]">
              <img src={col.img} alt={col.nome} className="w-full h-full object-cover transition duration-700 group-hover:scale-110" />
              <div className="absolute inset-0 bg-gradient-to-t from-secundaria/95 via-secundaria/40 to-transparent opacity-80 group-hover:opacity-100 transition duration-500"></div>
              <div className="absolute bottom-0 left-0 p-8 w-full translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                <h3 className="text-branco text-3xl font-serif font-bold mb-2">{col.nome}</h3>
                <p className="text-gray-200 text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100">{col.desc}</p>
                <div className="mt-4 w-12 h-[2px] bg-branco group-hover:w-24 transition-all duration-500"></div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Destaque Produtos Recentes (Catálogo) */}
      <section className="py-24 bg-branco border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-secundaria mb-16">Destaques do Ateliê</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
               { n:'Porta Guardanapo Lírio', p:'R$ 45,00' },
               { n:'Jogo Americano Renda', p:'R$ 120,00' },
               { n:'Guardanapo Linho Puro', p:'R$ 80,00' },
               { n:'Cesta de Pães Rústica', p:'R$ 150,00' },
            ].map((item, idx) => (
              <div key={idx} className="text-left group flex flex-col items-center">
                <div className="relative aspect-square w-full bg-gray-50 rounded-2xl overflow-hidden border border-gray-100 mb-6 shadow-sm group-hover:shadow-xl transition-shadow duration-300">
                  <div className="absolute inset-0 flex items-center justify-center text-5xl opacity-10">🍽️</div>
                  <div className="absolute inset-0 bg-secundaria/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 backdrop-blur-[2px]">
                    <button className="bg-branco text-primaria font-bold px-6 py-3 rounded-full transform translate-y-4 group-hover:translate-y-0 transition-all shadow-lg hover:bg-fundo">Detalhes</button>
                  </div>
                </div>
                <h4 className="font-semibold text-gray-800 text-center">{item.n}</h4>
                <p className="text-primaria font-bold mt-2 text-lg">{item.p}</p>
              </div>
            ))}
          </div>
          
          <div className="mt-20">
            <Link to="/produtos" className="inline-flex items-center gap-3 border-2 border-primaria text-primaria font-bold uppercase tracking-widest text-sm px-10 py-4 rounded-full hover:bg-primaria hover:text-branco transition duration-300">
              Ver Catálogo Completo
            </Link>
          </div>
        </div>
      </section>

      {/* Sobre a Camélia Section */}
      <section className="py-28 bg-primaria text-branco relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-serif font-bold mb-10">Nossa Essência</h2>
          <p className="text-lg md:text-xl text-gray-100 leading-loose font-light mb-12">
            A Camélia Handcraft nasceu da paixão genuína por receber bem. Cada peça costurada e finalizada em nosso ateliê é confeccionada à mão com dedicação, amor e uma atenção rigorosa aos mínimos detalhes. Nosso propósito é levar afeto para a sua mesa, transformando as refeições cotidianas em autênticas memórias extraordinárias.
          </p>
          <div className="flex items-center justify-center space-x-4 opacity-70">
            <div className="w-24 h-[1px] bg-branco"></div>
            <span className="text-3xl animate-pulse">🌸</span>
            <div className="w-24 h-[1px] bg-branco"></div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Home;