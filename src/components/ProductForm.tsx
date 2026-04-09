import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { productSchema } from '../schemas/productSchema';
import { productService } from '../services/productService';

interface ProductFormProps {
  product?: any; 
  onClose: () => void;
}

export default function ProductForm({ product, onClose }: ProductFormProps) {
  const queryClient = useQueryClient();

  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>(product?.image_url || '');

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<any>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      nome: product?.nome || '',
      price: product?.price || 0,
      cost: product?.cost || 0,
      stock: product?.stock || 0,
      category: product?.category || 'Diversos',
      colecao: product?.colecao || '',
      description: product?.description || '',
      image_url: product?.image_url || '',
      image_2: product?.image_2 || '',
      image_3: product?.image_3 || '',
      show_on_site: product?.show_on_site ?? true,
      is_preorder: product?.is_preorder || false,
      is_insumo: product?.is_insumo || false,
      technical_notes: product?.technical_notes || '',
      measure_cm: product?.measure_cm || '',
      weight_kg: product?.weight_kg || 0,
      supplier_id: product?.supplier_id || null,
      min_stock: product?.min_stock ?? 5,
      material: product?.material || '',
      tags: product?.tags || '',
    },
  });

  const mutation = useMutation({
    mutationFn: (data: any) => productService.save(data, product?.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      onClose();
    },
  });

  const category = watch('category');
  const isInsumo = watch('is_insumo');

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fadeIn duration-300">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* CABEÇALHO PADRÃO CAMÉLIA */}
        <div className="absolute top-0 inset-x-0 bg-white/90 backdrop-blur-md px-8 py-4 flex justify-between items-center border-b border-gray-100 z-20">
          <div className="flex items-center gap-3">
            <span className="text-2xl">
              {isInsumo ? '📦' : '🎨'}
            </span>
            <div>
              <h3 className="text-secundaria font-serif font-bold text-lg leading-tight">
                {product ? 'Editar Produto' : 'Cadastrar Novo'}
              </h3>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-none">
                Linha: {category || 'Geral'}
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-secundaria"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* CORPO DO FORMULÁRIO (ESTÉTICA ORIGINAL) */}
        <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="overflow-y-auto p-8 space-y-6 pt-24 no-scrollbar">
          {/* Desabilita submit durante upload */}
          <input type="hidden" />
          
          <div className="space-y-4">
            <div className="group">
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 px-1 font-sans">Nome da Peça *</label>
              <input 
                {...register('nome')} 
                className={`w-full p-4 bg-gray-50 rounded-2xl border ${errors.nome ? 'border-red-300' : 'border-gray-100'} text-secundaria font-medium outline-none focus:border-primaria focus:bg-white transition-all`}
                placeholder="Ex: Jogo Americano Alecrim"
              />
              {errors.nome && <p className="text-red-500 text-[10px] font-bold mt-1 px-1 uppercase">{String(errors.nome.message)}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 px-1 font-sans">Preço de Venda (R$)</label>
                <input
                  type="number" step="0.01" {...register('price')}
                  className="w-full p-4 bg-gray-50 rounded-2xl border border-gray-100 text-secundaria font-bold outline-none focus:border-primaria focus:bg-white transition-all shadow-inner"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 px-1 font-sans">Custo de Produção (R$)</label>
                <input
                  type="number" step="0.01" {...register('cost')}
                  className="w-full p-4 bg-gray-50 rounded-2xl border border-gray-100 text-secundaria font-bold outline-none focus:border-primaria focus:bg-white transition-all shadow-inner"
                />
              </div>
            </div>

            {/* Indicador de margem de lucro em tempo real */}
            {(() => {
              const price = Number(watch('price') || 0);
              const cost = Number(watch('cost') || 0);
              if (price <= 0) return null;
              const margem = ((price - cost) / price) * 100;
              const cor = margem >= 40 ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : margem >= 20 ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-red-50 border-red-200 text-red-600';
              const label = margem >= 40 ? 'Margem saudável' : margem >= 20 ? 'Margem moderada' : 'Margem baixa';
              return (
                <div className={`flex items-center justify-between px-4 py-3 rounded-2xl border ${cor}`}>
                  <span className="text-[10px] font-bold uppercase tracking-widest">{label}</span>
                  <span className="text-lg font-serif font-bold">{margem.toFixed(1)}%</span>
                </div>
              );
            })()}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 px-1 font-sans">Estoque Atual</label>
                <input
                  type="number" {...register('stock')}
                  className="w-full p-4 bg-gray-50 rounded-2xl border border-gray-100 text-secundaria font-bold outline-none focus:border-primaria focus:bg-white transition-all shadow-inner"
                />
              </div>
              <div className="invisible">{/* spacer */}</div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 px-1 font-sans">Linha / Coleção</label>
                <select 
                  {...register('colecao')}
                  className="w-full p-4 bg-gray-50 rounded-2xl border border-gray-100 text-secundaria font-bold outline-none focus:border-primaria focus:bg-white transition-all appearance-none cursor-pointer"
                >
                  <option value="">Sem Coleção</option>
                  <option value="Natal">Natal</option>
                  <option value="Círio">Círio</option>
                  <option value="Mesa Posta">Mesa Posta</option>
                  <option value="Frutas e Legumes">Frutas e Legumes</option>
                  <option value="Flores">Flores</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 px-1 font-sans">Categoria Principal</label>
                <select 
                  {...register('category')}
                  className="w-full p-4 bg-gray-50 rounded-2xl border border-gray-100 text-secundaria font-bold outline-none focus:border-primaria focus:bg-white transition-all appearance-none cursor-pointer"
                >
                  <option value="Guardanapos">Guardanapos</option>
                  <option value="Jogos Americanos">Jogos Americanos</option>
                  <option value="Porta Guardanapos">Porta Guardanapos</option>
                  <option value="Diversos">Diversos</option>
                  <option value="Insumos">Insumos (Ficha Técnica)</option>
                </select>
              </div>
            </div>

            <div className="space-y-3">
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1 font-sans">Imagem Principal</label>

              {/* Preview */}
              {previewUrl && (
                <div className="w-full h-40 rounded-2xl overflow-hidden border border-gray-100 bg-gray-50">
                  <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                </div>
              )}

              {/* Upload por arquivo */}
              <label className={`flex items-center gap-3 w-full p-4 bg-gray-50 rounded-2xl border border-dashed border-gray-200 cursor-pointer hover:border-primaria hover:bg-white transition-all ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-400 shrink-0">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
                </svg>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  {uploading ? 'Enviando...' : 'Selecionar arquivo'}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setPreviewUrl(URL.createObjectURL(file));
                    setUploading(true);
                    try {
                      const url = await productService.uploadImage(file);
                      setValue('image_url', url);
                      setPreviewUrl(url);
                    } catch (err: any) {
                      alert('Erro no upload: ' + err.message);
                      setPreviewUrl(product?.image_url || '');
                    } finally {
                      setUploading(false);
                    }
                  }}
                />
              </label>

              {/* URL manual — fallback para links externos existentes */}
              <input
                {...register('image_url')}
                className="w-full p-3 bg-gray-50 rounded-2xl border border-gray-100 text-secundaria text-xs outline-none focus:border-primaria focus:bg-white transition-all font-mono"
                placeholder="ou cole uma URL externa: https://..."
                onChange={(e) => {
                  register('image_url').onChange(e);
                  setPreviewUrl(e.target.value);
                }}
              />
            </div>

            <div className="flex items-center gap-6 p-5 bg-gray-50 rounded-3xl border border-gray-100 shadow-inner">
               <div className="flex items-center gap-3">
                 <input type="checkbox" {...register('show_on_site')} id="show_site_standard" className="w-5 h-5 rounded-lg text-primaria border-gray-300 focus:ring-primaria" />
                 <label htmlFor="show_site_standard" className="text-[10px] font-bold text-secundaria uppercase tracking-widest cursor-pointer select-none">Vitrine Ativa</label>
               </div>
               <div className="flex items-center gap-3">
                 <input type="checkbox" {...register('is_preorder')} id="is_preorder_standard" className="w-5 h-5 rounded-lg text-amber-500 border-gray-300 focus:ring-amber-500" />
                 <label htmlFor="is_preorder_standard" className="text-[10px] font-bold text-secundaria uppercase tracking-widest cursor-pointer select-none">Encomenda</label>
               </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 px-1 font-sans">Descrição Comercial</label>
              <textarea 
                {...register('description')} 
                rows={3}
                placeholder="Descreva a beleza e os detalhes desta peça..."
                className="w-full p-4 bg-gray-50 rounded-2xl border border-gray-100 text-secundaria text-sm outline-none focus:border-primaria focus:bg-white transition-all resize-none font-sans" 
              />
            </div>

            <div className="pt-4 border-t border-gray-50">
               <p className="text-[9px] font-bold text-gray-300 uppercase tracking-[4px] mb-4 text-center">— Detalhes Adicionais (Reservado) —</p>
               <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-[8px] font-bold text-gray-400 uppercase mb-1 px-1">Ficha Técnica / Notas</label>
                    <textarea
                      {...register('technical_notes')}
                      rows={2}
                      className="w-full p-3 bg-gray-50 rounded-xl border border-gray-100 text-xs outline-none focus:border-primaria transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[8px] font-bold text-gray-400 uppercase mb-1 px-1">Estoque Mínimo</label>
                    <input
                      type="number"
                      {...register('min_stock', { valueAsNumber: true })}
                      className="w-full p-3 bg-gray-50 rounded-xl border border-gray-100 text-xs outline-none focus:border-primaria transition-all text-secundaria font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[8px] font-bold text-gray-400 uppercase mb-1 px-1">Material</label>
                    <input
                      type="text"
                      {...register('material')}
                      placeholder="Ex: Algodão, Linho..."
                      className="w-full p-3 bg-gray-50 rounded-xl border border-gray-100 text-xs outline-none focus:border-primaria transition-all text-secundaria"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[8px] font-bold text-gray-400 uppercase mb-1 px-1">Tags <span className="normal-case font-normal text-gray-300">(separe por vírgulas)</span></label>
                    <input
                      type="text"
                      {...register('tags')}
                      placeholder="Ex: natal, mesa posta, presente..."
                      className="w-full p-3 bg-gray-50 rounded-xl border border-gray-100 text-xs outline-none focus:border-primaria transition-all text-secundaria"
                    />
                  </div>
               </div>
            </div>
          </div>

          <div className="pt-8 mb-4">
            <button 
              type="submit" 
              disabled={mutation.isPending || uploading}
              className="w-full bg-secundaria text-white font-bold py-5 rounded-2xl uppercase tracking-widest text-sm hover:bg-black transition-all shadow-xl active:scale-95 disabled:bg-gray-300 transform"
            >
              {uploading ? 'Enviando imagem...' : mutation.isPending ? 'Sincronizando...' : product ? 'Salvar Mudanças' : 'Cadastrar na Camélia'}
            </button>
            {product && (
               <p className="text-center text-[9px] text-gray-300 mt-4 uppercase tracking-widest">ID: {product.id}</p>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
