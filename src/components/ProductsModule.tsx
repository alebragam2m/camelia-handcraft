import React, { useState, useEffect, useMemo } from 'react';
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
  'Outros': '📦',
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
  const [activeFilter, setActiveFilter] = useState<'todos' | 'ativos' | 'inativos' | 'critico'>('todos');

  // Pillar 2: TanStack Query - Fetching
  const { data: products = [], isLoading: loadingProducts, error: errorLoad } = useQuery({
    queryKey: ['products'],
    queryFn: () => productService.getAll(),
  });

  useEffect(() => {
    if (products.length > 0) {
      console.info(`[ProductsModule] ${products.length} itens detectados no Admin.`);
    }
    if (errorLoad) {
      console.error('[ProductsModule] Falha crítica de sincronização:', errorLoad);
    }
  }, [products.length, errorLoad]);

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

  // Group by category with Fallback (Auditoria de Incongruência)
  const byCategory = products.reduce((acc, p) => {
    let cat = p.category || 'Diversos';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(p);
    return acc;
  }, {} as Record<string, Product[]>);

  const baseCategories = [...PRODUCT_CATEGORIES];
  const extraCategories = Object.keys(byCategory).filter(c => !baseCategories.includes(c as any));
  const categories = [...baseCategories, ...extraCategories];

  const productsInLine = activeLine ? byCategory[activeLine] || [] : [];

  const baseList = activeLine === 'Ver Tudo' ? products : productsInLine;

  const filteredProducts = useMemo(() => {
    if (activeFilter === 'ativos') return baseList.filter(p => p.show_on_site);
    if (activeFilter === 'inativos') return baseList.filter(p => !p.show_on_site);
    if (activeFilter === 'critico') return baseList.filter(p => (p.stock ?? 0) === 0 || (p.stock ?? 0) <= (p.min_stock ?? 5));
    return baseList;
  }, [baseList, activeFilter]);

  const filterCounts = useMemo(() => ({
    todos: baseList.length,
    ativos: baseList.filter(p => p.show_on_site).length,
    inativos: baseList.filter(p => !p.show_on_site).length,
    critico: baseList.filter(p => (p.stock ?? 0) === 0 || (p.stock ?? 0) <= (p.min_stock ?? 5)).length,
  }), [baseList]);

  return (
    <ErrorBoundary>
      <div className="animate-fade-in-down space-y-6 pb-12">

        {/* MODAL PADRÃO CAMÉLIA (ProductForm) */}
        {isCreating && (
          <ProductForm 
            product={editProduct} 
            onClose={closeModal} 
          />
        )}

        {loadingProducts && !products.length && (
          <div className="p-20 text-center animate-pulse">
            <p className="text-secundaria font-serif italic text-xl">Sincronizando Catálogo Profissional...</p>
          </div>
        )}

        {/* DASHBOARD DE KPIs */}
        {!activeLine && !isCreating && products.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[
              { label: 'Total', value: products.length, color: 'text-secundaria' },
              { label: 'No Site', value: products.filter(p => p.show_on_site).length, color: 'text-emerald-600' },
              { label: 'Estoque Zero', value: products.filter(p => (p.stock ?? 0) === 0).length, color: 'text-red-500' },
              { label: 'Em Alerta', value: products.filter(p => (p.stock ?? 0) > 0 && (p.stock ?? 0) <= (p.min_stock ?? 5)).length, color: 'text-amber-500' },
              { label: 'Insumos', value: products.filter(p => p.is_insumo).length, color: 'text-teal-600' },
            ].map(kpi => (
              <div key={kpi.label} className="bg-white rounded-2xl border border-gray-100 px-4 py-3 flex flex-col gap-1">
                <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400">{kpi.label}</span>
                <span className={`text-2xl font-serif font-bold ${kpi.color}`}>{kpi.value}</span>
              </div>
            ))}
          </div>
        )}

        {/* VISTA PRINCIPAL: CATEGORIAS */}
        {!activeLine && !isCreating && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {categories.map(cat => {
              const count = byCategory[cat]?.length || 0;
              return (
                <div key={cat} onClick={() => setActiveLine(cat)} className={`group relative rounded-3xl border-2 p-5 cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all ${CATEGORY_COLORS[cat] || 'border-gray-200 bg-white'}`}>
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-3xl">{CATEGORY_ICONS[cat] || '🎨'}</span>
                    <span className="bg-white/80 backdrop-blur text-secundaria font-bold text-[10px] px-3 py-1 rounded-full shadow-sm border border-white">{count}</span>
                  </div>
                  <h3 className="font-serif font-bold text-secundaria text-base mb-1">{cat} ({count})</h3>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Linha: {cat}</p>
                  <button onClick={(e) => { e.stopPropagation(); openCreateMode(cat); }} className="mt-4 bg-white border border-gray-100 text-secundaria text-[9px] font-bold px-4 py-2 rounded-lg hover:bg-secundaria hover:text-white transition-colors">+ Adicionar</button>
                </div>
              );
            })}

            {/* Card de Segurança: Ver Tudo */}
            <div onClick={() => setActiveLine('Ver Tudo')} className="group relative rounded-3xl border-2 p-8 cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all border-indigo-200 bg-indigo-50/30">
               <div className="flex justify-between items-start mb-6">
                 <span className="text-5xl">🔍</span>
                 <span className="bg-white/80 backdrop-blur text-indigo-600 font-bold text-[10px] px-3 py-1 rounded-full shadow-sm border border-white">Total: {products.length}</span>
               </div>
               <h3 className="font-serif font-bold text-indigo-900 text-xl mb-1">Ver Tudo</h3>
               <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest">Lista linear de segurança</p>
            </div>
          </div>
        )}

        {/* VISTA DRILL-DOWN: LISTA DE PRODUTOS */}
        {(activeLine || activeLine === 'Ver Tudo') && !isCreating && (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <button onClick={() => { setActiveLine(null); setActiveFilter('todos'); }} className="text-gray-400 hover:text-secundaria font-bold text-xs uppercase tracking-widest transition-colors">← Voltar às Linhas</button>
              <div className="flex-1 border-b border-gray-100" />
              <button
                onClick={() => openCreateMode(activeLine === 'Ver Tudo' ? 'Diversos' : activeLine!)}
                className="bg-secundaria text-white px-5 py-3 rounded-xl font-bold text-xs uppercase tracking-widest shadow-md"
              >
                + Novo em {activeLine}
              </button>
            </div>

            {/* Filtros rápidos */}
            <div className="flex flex-wrap gap-2">
              {([
                { key: 'todos', label: 'Todos' },
                { key: 'ativos', label: 'Ativos' },
                { key: 'inativos', label: 'Inativos' },
                { key: 'critico', label: 'Estoque crítico' },
              ] as const).map(f => (
                <button
                  key={f.key}
                  onClick={() => setActiveFilter(f.key)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all border ${activeFilter === f.key ? 'bg-secundaria text-white border-secundaria' : 'bg-white text-gray-400 border-gray-200 hover:border-secundaria hover:text-secundaria'}`}
                >
                  {f.label} ({filterCounts[f.key]})
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {filteredProducts.map(prod => (
                <div key={prod.id} onClick={() => openEditMode(prod)} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden cursor-pointer group hover:shadow-lg transition-all">
                  <div className="w-full h-28 bg-gray-50 flex items-center justify-center text-3xl border-b overflow-hidden">
                    {prod.image_url ? <img src={prod.image_url} alt={prod.nome} className="w-full h-full object-cover group-hover:scale-105 transition-all" /> : CATEGORY_ICONS[activeLine || 'Diversos']}
                  </div>
                  <div className="p-3">
                    <h4 className="font-bold text-secundaria text-xs truncate">{prod.nome}</h4>
                    <p className="text-primaria font-bold text-xs mt-1">{formatCurrency(prod.price)}</p>
                    <div className="flex justify-between items-center mt-2">
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${Number(prod.stock) === 0 ? 'bg-red-50 text-red-500' : Number(prod.stock) <= (prod.min_stock ?? 5) ? 'bg-amber-50 text-amber-600' : 'bg-green-50 text-green-600'}`}>
                        {Number(prod.stock) === 0 ? '🔴' : Number(prod.stock) <= (prod.min_stock ?? 5) ? '🟡' : '🟢'} {prod.stock} un.
                      </span>
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
