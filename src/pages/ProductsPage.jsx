import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { productService } from '../services/productService';
import { useCart } from '../context/CartContext';
import { formatCurrency } from '../utils/formatCurrency';
import { useWishlist } from '../hooks/useWishlist';

const WHATSAPP_NUMBER = '5591991145232';

function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const { wishlistIds, clientId, authUser, toggle } = useWishlist();

  async function load() {
    try {
      const data = await productService.getAll();
      setProducts(data);
    } catch (err) {
      console.error('Erro ao carregar produtos:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();

    // Escuta mudanças em tempo real no banco
    const unsubscribe = productService.subscribeToChanges(() => {
      load(); // recarrega quando qualquer produto mudar
    });

    return unsubscribe; // limpa o canal ao sair da página
  }, []);

  const displayed = products.filter(p => p.show_on_site !== false);

  if (loading) {
    return (
      <div className="p-10 text-center text-gray-400">
        Carregando peças...
      </div>
    );
  }

  return (
    <div className="p-10">
      <h1 className="text-3xl font-serif mb-10">Nossas Peças</h1>
      {displayed.length === 0 ? (
        <p className="text-gray-400">Nenhum produto disponível no momento.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {displayed.map(prod => (
            <div key={prod.id} className="relative bg-white rounded-2xl shadow-sm overflow-hidden flex flex-col border border-gray-100 hover:shadow-md transition-shadow">
              <Link to={`/produtos/${prod.id}`} className="block">
                <img
                  src={prod.image_url || '/logo.png'}
                  alt={prod.nome}
                  className="w-full h-52 object-cover"
                />
              </Link>

              {/* Botão de Favorito — só renderiza se houver usuário logado */}
              {authUser && (
                <button
                  onClick={() => toggle.mutate(prod.id)}
                  disabled={toggle.isPending}
                  title={wishlistIds.includes(prod.id) ? 'Remover dos favoritos' : 'Salvar nos favoritos'}
                  className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center bg-white/80 backdrop-blur-sm rounded-full shadow-sm hover:bg-white transition-all"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
                    fill={wishlistIds.includes(prod.id) ? 'currentColor' : 'none'}
                    stroke="currentColor" strokeWidth={1.5}
                    className={`w-4 h-4 transition-colors ${wishlistIds.includes(prod.id) ? 'text-red-500' : 'text-gray-400'}`}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
                  </svg>
                </button>
              )}
              <div className="p-4 flex flex-col flex-1">
                <Link to={`/produtos/${prod.id}`} className="block mb-1">
                  <h3 className="font-bold text-secundaria text-sm leading-snug hover:text-primaria transition-colors">{prod.nome}</h3>
                </Link>
                <p className="text-primaria font-bold text-base mb-4">{formatCurrency(prod.price)}</p>

                {prod.is_preorder ? (
                  <a
                    href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(`Olá, tenho interesse no produto: ${prod.nome}`)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-auto w-full text-center bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 rounded-xl text-[10px] uppercase tracking-widest transition-all"
                  >
                    Encomendar via WhatsApp
                  </a>
                ) : prod.stock > 0 ? (
                  <button
                    onClick={() => addToCart(prod, 1)}
                    className="mt-auto w-full bg-secundaria hover:bg-black text-white font-bold py-3 rounded-xl text-[10px] uppercase tracking-widest transition-all"
                  >
                    Adicionar ao Carrinho
                  </button>
                ) : (
                  <span className="mt-auto w-full text-center bg-gray-100 text-gray-400 font-bold py-3 rounded-xl text-[10px] uppercase tracking-widest cursor-not-allowed">
                    Esgotado
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ProductsPage;