import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productService } from '../services/productService';
import { formatCurrency } from '../utils/formatCurrency';
import ErrorBoundary from './ErrorBoundary';
import type { Product } from '../types/supabase';
import ProductForm from './ProductForm';

// --- Categorias de produtos da Camélia ---
const PRODUCT_CATEGORIES = ['Porta Guardanapos', 'Guardanapos', 'Jogos Americanos', 'Diversos', 'Insumos'] as const;

const CATEGORY_ICONS: Record<string, string> = {
  'Porta Guardanapos': '🪴',
  'Guardanapos': '🌸',
  'Jogos Americanos': '🍽️',
  'Diversos': '✨',
  'Insumos': '🧵',
};

const CATEGORY_COLORS: Record<string, string> = {
  'Porta Guardanapos': 'border-primaria bg-gradient-to-br from-white to-rose-50',
  'Guardanapos': 'border-pink-400 bg-gradient-to-br from-white to-pink-50',
  'Jogos Americanos': 'border-amber-400 bg-gradient-to-br from-white to-amber-50',
  'Diversos': 'border-purple-400 bg-gradient-to-br from-white to-purple-50',
  'Insumos': 'border-teal-400 bg-gradient-to-br from-white to-teal-50',
};

/**
 * MÓDULO DE PRODUTOS CATÁLIA (MOT PRO v3)
 * 
 * Este módulo gerencia as categorias e a listagem.
 * A criação e edição foram delegadas ao componente blindado ProductForm.
 */
export default function ProductsModule() {
  const queryClient = useQueryClient();
  const [activeLine, setActiveLine] = useState<string | null>(null);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Pillar 2: TanStack Query - Fetching
  const { data: products = [], isLoading: loadingProducts } = useQuery({
    queryKey: ['products'],
    queryFn: () => productService.getAll(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => productService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      closeModal();
    }
  });

  const closeModal = () => {
    setIsCreating(false);
    setEditProduct(null);
  };

  const openCreateMode = (category: string) => {
    // Agora o modal apenas abre o ProductForm sem dados (New Mode)
    setEditProduct(null);
    setIsCreating(true);
  };

  const openEditMode = (prod: Product) => {
    setEditProduct(prod);
    setIsCreating(true);
  };

  // Group by category
  const byCategory = PRODUCT_CATEGORIES.reduce((acc, cat) => {
    acc[cat] = products.filter(p => p.category === cat || (cat === 'Insumos' && p.is_insumo));
    return acc;
  }, {} as Record<string, Product[]>);

  const productsInLine = activeLine ? byCategory[activeLine] || [] : [];

  return (
    <ErrorBoundary>
      <div className="animate-fade-in-down space-y-6 pb-12">

        {/* MODAL BLINDADO (ProductForm) */}
        {isCreating && (
          <div className="fixed inset-0 bg-secundaria/80 backdrop-blur-md z-[200] flex items-center justify-center p-4">
            <div className="w-full max-w-2xl max-h-[95vh] overflow-hidden">
               <ProductForm 
                product={editProduct || undefined} 
                onClose={closeModal} 
               />
               {editProduct && (
                 <button 
                  onClick={() => { if(confirm('Excluir permanentemente?')) deleteMutation.mutate(editProduct.id); }}
                  className="w-full mt-4 text-red-300 font-bold text-[10px] uppercase tracking-widest hover:text-red-500 transition-colors"
                 >
                   Excluir Peça do Acervo
                 </button>
               )}
            </div>
          </div>
        )}

        {loadingProducts && !products.length && (
          <div className="p-20 text-center animate-pulse">
            <p className="text-secundaria font-serif italic text-xl">Sincronizando Catálogo Profissional...</p>
          </div>
        )}

        {/* VISTA PRINCIPAL: CATEGORIAS */}
        {!activeLine && !isCreating && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {PRODUCT_CATEGORIES.map(cat => {
              const count = byCategory[cat]?.length || 0;
              return (
                <div key={cat} onClick={() => setActiveLine(cat)} className={`group relative rounded-3xl border-2 p-8 cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all ${CATEGORY_COLORS[cat]}`}>
                  <div className="flex justify-between items-start mb-6">
                    <span className="text-5xl">{CATEGORY_ICONS[cat]}</span>
                    <span className="bg-white/80 backdrop-blur text-secundaria font-bold text-[10px] px-3 py-1 rounded-full shadow-sm border border-white">{count} itens</span>
                  </div>
                  <h3 className="font-serif font-bold text-secundaria text-xl mb-1">{cat}</h3>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Clique para gerenciar a linha</p>
                  <button onClick={(e) => { e.stopPropagation(); openCreateMode(cat); }} className="mt-6 bg-white border border-gray-100 text-secundaria text-[9px] font-bold px-4 py-2 rounded-lg hover:bg-secundaria hover:text-white transition-colors">+ Adicionar</button>
                </div>
              );
            })}
          </div>
        )}

        {/* VISTA DRILL-DOWN: LISTA DE PRODUTOS */}
        {activeLine && !isCreating && (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <button onClick={() => setActiveLine(null)} className="text-gray-400 hover:text-secundaria font-bold text-xs uppercase tracking-widest transition-colors">← Voltar às Linhas</button>
              <div className="flex-1 border-b border-gray-100" />
              <button onClick={() => openCreateMode(activeLine)} className="bg-secundaria text-white px-5 py-3 rounded-xl font-bold text-xs uppercase tracking-widest shadow-md">Adicionar em {activeLine}</button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {productsInLine.map(prod => (
                <div key={prod.id} onClick={() => openEditMode(prod)} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden cursor-pointer group hover:shadow-lg transition-all">
                  <div className="w-full h-40 bg-gray-50 flex items-center justify-center text-4xl border-b overflow-hidden">
                    {prod.image_url ? <img src={prod.image_url} alt={prod.nome} className="w-full h-full object-cover group-hover:scale-105 transition-all" /> : CATEGORY_ICONS[activeLine]}
                  </div>
                  <div className="p-4">
                    <h4 className="font-bold text-secundaria text-sm truncate">{prod.nome}</h4>
                    <p className="text-primaria font-bold text-xs mt-1">{formatCurrency(prod.price)}</p>
                    <div className="flex justify-between items-center mt-3">
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${Number(prod.stock) < 5 ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-600'}`}>{prod.stock} un.</span>
                      <span className="text-[10px] text-gray-300 font-bold group-hover:text-primaria transition-colors">Editar →</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}
