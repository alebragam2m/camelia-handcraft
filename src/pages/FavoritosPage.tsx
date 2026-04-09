import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useWishlist } from '../hooks/useWishlist';
import { formatCurrency } from '../utils/formatCurrency';
import type { Product } from '../types/supabase';

export default function FavoritosPage() {
  const navigate = useNavigate();
  const { clientId, toggle } = useWishlist();

  const { data: favorites = [], isLoading } = useQuery<Product[]>({
    queryKey: ['wishlist-products', clientId],
    queryFn: async () => {
      if (!clientId) return [];
      const { data, error } = await supabase
        .from('wishlists')
        .select('product_id, products(*)')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []).map((w: any) => w.products).filter(Boolean);
    },
    enabled: !!clientId,
  });

  return (
    <div className="bg-fundo min-h-screen py-20 px-4">
      <div className="max-w-5xl mx-auto">

        <div className="mb-10 flex items-center gap-4">
          <button
            onClick={() => navigate('/minha-conta')}
            className="text-xs uppercase tracking-[3px] font-bold text-gray-400 hover:text-primaria transition-colors flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
            </svg>
            Minha Conta
          </button>
        </div>

        <div className="mb-10">
          <p className="text-[10px] uppercase tracking-[4px] text-primaria font-bold mb-1">Lista de Desejos</p>
          <h1 className="text-4xl font-serif font-bold text-secundaria">Meus Favoritos</h1>
        </div>

        {isLoading && (
          <p className="text-center text-gray-400 text-sm animate-pulse py-20">Carregando seus favoritos...</p>
        )}

        {!isLoading && !clientId && (
          <div className="text-center py-20">
            <p className="text-gray-400 mb-4">Faça login para ver seus favoritos.</p>
            <Link to="/login" className="bg-secundaria text-white font-bold px-6 py-3 rounded-xl text-[10px] uppercase tracking-widest hover:bg-black transition-all">
              Entrar
            </Link>
          </div>
        )}

        {!isLoading && clientId && favorites.length === 0 && (
          <div className="text-center py-20">
            <p className="text-5xl mb-6 opacity-20">♡</p>
            <p className="text-gray-400 text-sm mb-6">Você ainda não salvou nenhuma peça.</p>
            <Link to="/produtos" className="bg-secundaria text-white font-bold px-6 py-3 rounded-xl text-[10px] uppercase tracking-widest hover:bg-black transition-all">
              Explorar Catálogo
            </Link>
          </div>
        )}

        {!isLoading && favorites.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {favorites.map((prod) => (
              <div key={prod.id} className="relative bg-white rounded-2xl shadow-sm overflow-hidden flex flex-col border border-gray-100 hover:shadow-md transition-shadow">
                <Link to={`/produtos/${prod.id}`} className="block">
                  <img
                    src={prod.image_url || '/logo.png'}
                    alt={prod.nome}
                    className="w-full h-52 object-cover"
                  />
                </Link>

                <button
                  onClick={() => toggle.mutate(prod.id)}
                  disabled={toggle.isPending}
                  title="Remover dos favoritos"
                  className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center bg-white rounded-full shadow-sm hover:bg-red-50 transition-all"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-red-500">
                    <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 0 1-.383-.218 25.18 25.18 0 0 1-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0 1 12 5.052 5.5 5.5 0 0 1 16.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 0 1-4.244 3.17 15.247 15.247 0 0 1-.383.219l-.022.012-.007.004-.003.001a.752.752 0 0 1-.704 0l-.003-.001Z" />
                  </svg>
                </button>

                <div className="p-4 flex flex-col flex-1">
                  <Link to={`/produtos/${prod.id}`} className="block mb-1">
                    <h3 className="font-bold text-secundaria text-sm leading-snug hover:text-primaria transition-colors">{prod.nome}</h3>
                  </Link>
                  <p className="text-primaria font-bold text-base mb-4">{formatCurrency(prod.price)}</p>
                  <Link
                    to={`/produtos/${prod.id}`}
                    className="mt-auto w-full text-center bg-secundaria hover:bg-black text-white font-bold py-3 rounded-xl text-[10px] uppercase tracking-widest transition-all"
                  >
                    Ver Peça
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
