import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { productSchema, type ProductFormData } from '../schemas/productSchema';
import { productService } from '../services/productService';
import type { Product } from '../types/supabase';

interface ProductFormProps {
  product?: Product; // Se presente, entra em modo edição
  onClose?: () => void;
}

/**
 * COMPONENTE DE GESTÃO DE PRODUTOS (PRO v3)
 * 
 * Integração: React Hook Form + Zod + TanStack Query
 */
export default function ProductForm({ product, onClose }: ProductFormProps) {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: product ? {
      nome: product.nome,
      price: product.price,
      cost: product.cost,
      stock: product.stock,
      category: product.category,
      colecao: product.colecao,
      description: product.description,
      image_url: product.image_url || '',
      image_2: product.image_2 || '',
      image_3: product.image_3 || '',
      show_on_site: product.show_on_site,
      is_preorder: product.is_preorder,
      is_insumo: product.is_insumo,
      technical_notes: product.technical_notes || '',
      measure_cm: product.measure_cm || '',
      weight_kg: product.weight_kg || 0,
      supplier_id: product.supplier_id || ''
    } : {
      nome: '',
      price: 0,
      cost: 0,
      stock: 0,
      category: 'Mesa',
      colecao: '',
      description: '',
      image_url: '',
      show_on_site: true,
      is_preorder: false,
      is_insumo: false,
      insumos_json: [],
      technical_notes: '',
      measure_cm: '',
      weight_kg: 0,
      supplier_id: ''
    }
  });

  // Mutation para Salvar (Insert/Update)
  const saveMutation = useMutation({
    mutationFn: (data: ProductFormData) => productService.save(data, product?.id),
    onSuccess: () => {
      // Invalida o cache para refletir a mudança instantaneamente no catálogo
      queryClient.invalidateQueries({ queryKey: ['products'] });
      alert(product ? 'Peça atualizada com sucesso!' : 'Nova peça integrada ao acervo!');
      reset();
      if (onClose) onClose();
    },
    onError: (err: Error) => {
      alert(`Erro Crítico de Persistência: ${err.message}`);
    }
  });

  const onSubmit = (data: ProductFormData) => {
    saveMutation.mutate(data);
  };

  return (
    <div className="bg-white rounded-[32px] shadow-2xl overflow-hidden border border-gray-100 animate-in fade-in zoom-in duration-300">
      <div className="bg-secundaria p-8 text-white flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-serif font-bold italic tracking-tight">
            {product ? 'Refinar Obra' : 'Nova Criação Manufaturada'}
          </h2>
          <p className="text-[10px] uppercase font-bold tracking-[3px] text-primaria mt-1">Estabilidade Máxima — Motor Pro v3</p>
        </div>
        {onClose && (
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-8 max-h-[75vh] overflow-y-auto custom-scrollbar">
        
        {/* SEÇÃO 1: IDENTIDADE */}
        <section className="space-y-4">
          <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-[4px] border-b pb-2">Identidade & Vitrine</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-[11px] font-bold text-secundaria uppercase mb-1">Nome da Peça *</label>
              <input 
                {...register('nome')} 
                className={`w-full p-4 bg-gray-50 rounded-2xl border ${errors.nome ? 'border-red-300' : 'border-gray-100'} transition-all focus:ring-2 focus:ring-primaria/20 outline-none font-medium`}
                placeholder="Ex: Sousplat Camélia Ouro"
              />
              {errors.nome && <p className="text-red-500 text-[10px] mt-1 font-bold italic">{errors.nome.message}</p>}
            </div>

            <div>
              <label className="block text-[11px] font-bold text-secundaria uppercase mb-1">Preço de Venda (R$)</label>
              <input type="number" step="0.01" {...register('price')} className="w-full p-4 bg-gray-50 rounded-2xl border border-gray-100 font-bold text-secundaria" />
            </div>
            
            <div>
              <label className="block text-[11px] font-bold text-secundaria uppercase mb-1">Custo de Produção (R$)</label>
              <input type="number" step="0.01" {...register('cost')} className="w-full p-4 bg-gray-50 rounded-2xl border border-gray-100 font-bold text-gray-500" />
            </div>
          </div>
        </section>

        {/* SEÇÃO 2: LOGÍSTICA */}
        <section className="space-y-4">
          <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-[4px] border-b pb-2">Logística & Estoque</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-[11px] font-bold text-secundaria uppercase mb-1">Acervo Físico</label>
              <input type="number" {...register('stock')} className="w-full p-4 bg-gray-50 rounded-2xl border border-gray-100 font-bold" />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-secundaria uppercase mb-1">Categoria</label>
              <select {...register('category')} className="w-full p-4 bg-gray-50 rounded-2xl border border-gray-100 font-bold outline-none">
                <option value="Mesa">Mesa Posta</option>
                <option value="Decor">Decoração</option>
                <option value="Presente">Presentes</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-secundaria uppercase mb-1">Coleção</label>
              <input {...register('colecao')} className="w-full p-4 bg-gray-50 rounded-2xl border border-gray-100 font-bold" />
            </div>
          </div>
        </section>

        {/* SEÇÃO 3: IMAGENS */}
        <section className="space-y-4">
          <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-[4px] border-b pb-2">Mídias do Produto</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold text-secundaria uppercase mb-1">URL Imagem Principal</label>
              <input {...register('image_url')} className="w-full p-4 bg-gray-50 rounded-2xl border border-gray-100 text-xs text-gray-400" />
              {errors.image_url && <p className="text-red-500 text-[10px] mt-1 font-bold">{errors.image_url.message}</p>}
            </div>
          </div>
        </section>

        {/* BOTÃO DE AÇÃO */}
        <div className="pt-8 border-t border-gray-100 flex gap-4">
           {onClose && (
             <button type="button" onClick={onClose} className="px-8 py-5 text-gray-400 font-bold text-[11px] uppercase tracking-widest hover:text-secundaria transition-colors">Cancelar</button>
           )}
           <button 
             type="submit" 
             disabled={saveMutation.isPending}
             className={`flex-1 bg-secundaria text-white font-bold py-5 rounded-2xl uppercase tracking-[3px] text-xs shadow-xl transition-all flex items-center justify-center gap-3 ${saveMutation.isPending ? 'opacity-70 scale-[0.98]' : 'hover:bg-black active:scale-[0.97]'}`}
           >
             {saveMutation.isPending ? (
               <>
                 <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
                 Processando Obra...
               </>
             ) : (
               'Consolidar no Sistema'
             )}
           </button>
        </div>
      </form>
    </div>
  );
}
