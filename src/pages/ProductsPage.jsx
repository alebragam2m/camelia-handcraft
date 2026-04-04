import React, { useState, useEffect, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { productService } from '../services/productService';
import { formatCurrency } from '../utils/formatCurrency';

const CATEGORIES = ['Todos', 'Guardanapos', 'Jogos Americanos', 'Porta Guardanapos', 'Diversos'];

function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('Todos');
  const [activeCollection, setActiveCollection] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const location = useLocation();
  const { addToCart } = useCart();

  // ── Lê os parâmetros da URL ─────────────────────────────────────────────────
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const cat = params.get('cat');
    const col = params.get('col');
    const search = params.get('search');
    setActiveCategory(cat && CATEGORIES.includes(cat) ? cat : 'Todos');
    setActiveCollection(col || null);
    setSearchQuery(search ? search.toLowerCase() : '');
  }, [location.search]);

  // ── Carga inicial ───────────────────────────────────────────────────────────
  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await productService.getAll();
      setProducts(data);
    } catch (err) {
      console.error('[ProductsPage] Erro ao carregar produtos:', err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadProducts(); }, [loadProducts]);


  // ── Filtragem ───────────────────────────────────────────────────────────────
  const displayed = products
    .filter(p => p.show_on_site !== false && !p.is_insumo)
    .filter(p => activeCategory === 'Todos' || p.category === activeCategory)
    .filter(p => {
      if (!activeCollection) return true;
      if (!p.colecao) return false;
      return p.colecao.trim().toLowerCase() === activeCollection.trim().toLowerCase();
    })
    .filter(p => !searchQuery || (p.nome && p.nome.toLowerCase().includes(searchQuery.toLowerCase())));

  const clearFilters = () => {
    setActiveCategory('Todos');
    setActiveCollection(null);
    setSearchQuery('');
  };

  const hasFilter = activeCollection || activeCategory !== 'Todos' || searchQuery;

  return (
    <div className="bg-fundo min-h-screen relative overflow-hidden">
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '30px 30px' }} />

      {/* Hero Banner */}
      <section className="relative bg-secundaria text-branco py-24 px-6 text-center shadow-md">
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] mix-blend-overlay pointer-events-none" />
        <div className="relative z-10 max-w-3xl mx-auto">
          <p className="text-xs tracking-[6px] uppercase font-bold text-[#D8B4E2] mb-4">Mesa Posta</p>
          <h1 className="text-4xl md:text-5xl font-serif font-bold tracking-tight mb-6">
            {searchQuery ? `Resultados para "${searchQuery}"` : 'Nosso Acervo Exclusivo'}
          </h1>
        </div>
      </section>

      {/* Filtros e Catálogo */}
      <section className="py-16 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

        {/* Banner de Filtro Removido conforme solicitado */}

        {/* Pills de Categoria */}
        <div className="flex overflow-x-auto pb-4 gap-3 no-scrollbar scroll-smooth mb-12">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`whitespace-nowrap px-6 py-3 rounded-full text-[10px] font-bold uppercase tracking-[2px] border transition-all flex-shrink-0 ${activeCategory === cat ? 'bg-primaria text-branco border-primaria shadow-md' : 'bg-white text-gray-500 border-gray-100 hover:border-primaria hover:text-primaria'}`}>
              {cat}
            </button>
          ))}
        </div>

        {/* Grade de Produtos */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-16">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="flex flex-col animate-pulse">
                <div className="w-full aspect-[4/5] bg-gray-100 rounded-3xl mb-6" />
                <div className="h-4 bg-gray-100 rounded w-3/4 mb-2" />
                <div className="h-3 bg-gray-100 rounded w-1/3" />
              </div>
            ))}
          </div>
        ) : displayed.length === 0 ? (
          <div className="text-center py-28 border border-dashed border-gray-200 rounded-3xl bg-white shadow-sm flex flex-col items-center">
            <span className="text-6xl mb-6 grayscale opacity-20">📦</span>
            <h3 className="font-serif text-2xl text-secundaria font-bold mb-2">Nenhum produto encontrado</h3>
            <p className="text-gray-400 font-light max-w-sm">
              {hasFilter ? 'Tente limpar os filtros para ver o acervo completo.' : 'Os produtos adicionados subirão aqui como uma galeria viva.'}
            </p>
            {hasFilter && (
              <button onClick={clearFilters} className="mt-6 text-primaria font-bold text-sm underline">
                Limpar filtros
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-16">
            {displayed.map((prod) => (
              <div key={prod.id} className="group flex flex-col">
                <div className="w-full aspect-[4/5] overflow-hidden bg-white relative mb-6 shadow-sm group-hover:shadow-2xl transition-all duration-500 rounded-3xl border border-gray-100/50">
                  <Link to={`/produtos/${prod.id}`} className="block w-full h-full">
                    <img
                      src={prod.image_url || '/logo.png'}
                      alt={prod.nome}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[1500ms]"
                    />
                    <div className="absolute inset-0 bg-black/5 md:bg-transparent flex items-end justify-center pb-6 md:pb-0">
                      <span className="md:hidden bg-white/90 backdrop-blur-md text-secundaria px-6 py-3 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-xl">
                        Ver Detalhes
                      </span>
                    </div>
                  </Link>

                  {/* Botão Compra Rápida (Desktop) */}
                  <div className="hidden md:block absolute inset-x-0 bottom-4 px-4 translate-y-8 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                    {prod.is_preorder ? (
                      <a
                        href={`https://wa.me/5591991145232?text=Olá, gostaria de encomendar o produto ${prod.nome}`}
                        target="_blank"
                        rel="noreferrer"
                        className="block w-full py-3 rounded-xl font-bold uppercase tracking-widest text-[10px] shadow-lg transition-transform active:scale-95 bg-amber-500 text-white hover:bg-amber-600 text-center"
                      >
                        Encomendar
                      </a>
                    ) : (
                      <button
                        onClick={(e) => { e.preventDefault(); addToCart(prod); }}
                        disabled={prod.stock <= 0}
                        className={`w-full py-3 rounded-xl font-bold uppercase tracking-widest text-[10px] shadow-lg transition-transform active:scale-95 ${prod.stock > 0 ? 'bg-white text-secundaria hover:bg-secundaria hover:text-white' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>
                        {prod.stock > 0 ? 'Adicionar ao Carrinho' : 'Esgotado'}
                      </button>
                    )}
                  </div>

                  {/* Etiqueta de Status */}
                  {prod.stock <= 0 && !prod.is_preorder && (
                    <div className="absolute top-4 right-4 bg-red-500/95 text-white px-3 py-1 text-[9px] uppercase font-bold tracking-widest shadow-sm rounded-full">
                      Esgotou
                    </div>
                  )}
                  {prod.is_preorder && (
                    <div className="absolute top-4 right-4 bg-amber-500/95 text-white px-3 py-1 text-[9px] uppercase font-bold tracking-widest shadow-sm rounded-full">
                      Encomenda
                    </div>
                  )}
                </div>

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