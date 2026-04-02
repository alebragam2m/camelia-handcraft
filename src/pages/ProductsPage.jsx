import { formatCurrency } from '../utils/formatCurrency';
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { supabase } from '../supabase';
import { useCart } from '../context/CartContext';

function ProductsPage() {
  const [productsList, setProductsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const categories = ["Todos", "Guardanapos", "Jogos Americanos", "Porta Guardanapos", "Diversos"];
  const [activeCategory, setActiveCategory] = useState("Todos");
  const [searchQuery, setSearchQuery] = useState('');
  
  const location = useLocation();
  const { addToCart } = useCart();

  useEffect(() => {
    fetchLiveCatalog();
    
    // Check for category in URL
    const params = new URLSearchParams(location.search);
    const catParam = params.get('cat');
    if (catParam && categories.includes(catParam)) {
      setActiveCategory(catParam);
    }

    const searchParam = params.get('search');
    if (searchParam) {
      setSearchQuery(searchParam.toLowerCase());
      setActiveCategory("Todos"); // Expand category to search all
    } else {
      setSearchQuery('');
    }
  }, [location]);

  const fetchLiveCatalog = async () => {
    setLoading(true);
    try {
      const fetchReq = supabase.from('products').select('*').order('created_at', { ascending: false });
      const timeoutReq = new Promise((_, reject) => setTimeout(() => reject(new Error('Supabase Timeout')), 8000));
      
      const { data } = await Promise.race([fetchReq, timeoutReq]);
      
      if(data) {
        setProductsList(data);
      }
    } catch (err) {
      console.warn("Vitrine falhou ao sincronizar. Limpando cache local:", err.message);
      localStorage.clear();
      sessionStorage.clear();
      window.location.reload();
    } finally {
      setLoading(false);
    }
  };

  // Filtra de acordo com o botão clicado
  let displayedProducts = activeCategory === "Todos" 
    ? productsList 
    : productsList.filter(p => p.category === activeCategory);

  if (searchQuery) {
    displayedProducts = displayedProducts.filter(p => p.nome && p.nome.toLowerCase().includes(searchQuery));
  }

  return (
    <div className="bg-fundo min-h-screen relative overflow-hidden">
      {/* Subtle body cross pattern */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '30px 30px'}}></div>

      {/* Hero Banner Interno ultra minimalista */}
      <section className="relative bg-secundaria text-branco py-24 px-6 text-center shadow-md">
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] mix-blend-overlay pointer-events-none"></div>
        <div className="relative z-10 max-w-3xl mx-auto">
          <p className="text-xs tracking-[6px] uppercase font-bold text-[#D8B4E2] mb-4">Mesa Posta</p>
          <h1 className="text-4xl md:text-5xl font-serif font-bold tracking-tight mb-6">
            {searchQuery ? `Resultados para "${searchQuery}"` : 'Nosso Acervo Exclusivo'}
          </h1>
        </div>
      </section>

      {/* Seção Filtros e Produtos Minimalistas */}
      <section className="py-16 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Filtros em Carrossel Horizontal (Mobile) */}
        <div className="flex overflow-x-auto pb-4 mb-12 gap-3 no-scrollbar scroll-smooth">
          {categories.map((cat, i) => (
            <button 
              key={i} 
              onClick={() => setActiveCategory(cat)}
              className={`whitespace-nowrap px-6 py-3 rounded-full text-[10px] font-bold uppercase tracking-[2px] border transition-all flex-shrink-0 ${activeCategory === cat ? 'bg-primaria text-branco border-primaria shadow-md' : 'bg-white text-gray-500 border-gray-100 hover:border-primaria hover:text-primaria'}`}>
              {cat}
            </button>
          ))}
        </div>

        {loading ? (
           <div className="text-center py-20">
              <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Arrumando as prateleiras online...</p>
           </div>
        ) : displayedProducts.length === 0 ? (
           <div className="text-center py-28 border border-dashed border-gray-200 rounded-3xl bg-white shadow-sm flex flex-col items-center">
               <span className="text-6xl mb-6 grayscale opacity-20">📦</span>
               <h3 className="font-serif text-2xl text-secundaria font-bold mb-2">Nenhum produto exposto ainda</h3>
               <p className="text-gray-400 font-light max-w-sm">Os produtos adicionados subirão aqui como uma galeria viva.</p>
           </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-16">
            {displayedProducts.map((prod) => (
              <div key={prod.id} className="group flex flex-col">
                
                {/* O Cartão Purista */}
                <div className="w-full aspect-[4/5] overflow-hidden bg-white relative mb-6 shadow-sm group-hover:shadow-2xl transition-all duration-500 rounded-3xl border border-gray-100/50">
                  <Link to={`/produtos/${prod.id}`} className="block w-full h-full">
                    <img src={prod.image_url || '/logo.png'} alt={prod.nome} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[1500ms]" />
                    
                    {/* Overlay de toque para Mobile (Ação visível) */}
                    <div className="absolute inset-0 bg-black/5 md:bg-transparent flex items-end justify-center pb-6 md:pb-0">
                       <span className="md:hidden bg-white/90 backdrop-blur-md text-secundaria px-6 py-3 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-xl">
                          Ver Detalhes
                       </span>
                    </div>
                  </Link>

                  {/* Botão de Compra Rápida (Desktop Hover) */}
                  <div className="hidden md:block absolute inset-x-0 bottom-4 px-4 translate-y-8 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                    <button 
                      onClick={(e) => {
                        e.preventDefault();
                        addToCart(prod);
                      }}
                      disabled={prod.stock <= 0}
                      className={`w-full py-3 rounded-xl font-bold uppercase tracking-widest text-[10px] shadow-lg transition-transform active:scale-95 ${prod.stock > 0 ? "bg-white text-secundaria hover:bg-secundaria hover:text-white" : "bg-gray-200 text-gray-400 cursor-not-allowed"}`}>
                      {prod.stock > 0 ? "Adicionar ao Carrinho" : "Esgotado"}
                    </button>
                  </div>

                  {/* Etiqueta opcional apenas se Esgotou */}
                  {prod.stock <= 0 && (
                     <div className="absolute top-4 right-4 bg-red-500/95 text-white px-3 py-1 text-[9px] uppercase font-bold tracking-widest shadow-sm rounded-full">
                        Esgotou
                     </div>
                  )}
                </div>
                
                {/* Info do Produto */}
                <Link to={`/produtos/${prod.id}`} className="px-2">
                  <h3 className="font-serif text-[18px] md:text-[15px] font-bold text-secundaria tracking-wide group-hover:text-primaria transition-colors">{prod.nome}</h3>
                  <p className="text-[14px] md:text-[12px] text-primaria font-bold mt-1 tracking-tight">{formatCurrency(prod.price)}</p>
                </Link>

              </div>
            ))}
          </div>
        )}

      </section>
    </div>
  );
}

export default ProductsPage;