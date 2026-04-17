import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { productSchema } from '../schemas/productSchema';
import { productService } from '../services/productService';
import Cropper from 'react-easy-crop';
import getCroppedImg from '../utils/cropImage';

interface ProductFormProps {
  product?: any; 
  onClose: () => void;
}

export default function ProductForm({ product, onClose }: ProductFormProps) {
  const queryClient = useQueryClient();

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
      stock_to_make: product?.stock_to_make || 0,
      category: product?.category || 'Diversos',
      colecao: product?.colecao || '',
      description: product?.description || '',
      image_url: product?.image_url || '',
      image_2: product?.image_2 || '',
      image_3: product?.image_3 || '',
      image_4: product?.image_4 || '',
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
  const [uploadingImage, setUploadingImage] = React.useState(false);
  const availableCollections = ["Natal", "Círio", "Páscoa", "Provence", "Diversos", "Frutas e Legumes", "Flores"];
  const [selectedCols, setSelectedCols] = React.useState<string[]>(() => {
    const raw = product?.colecao || '';
    if (raw === 'Sem linha / Coleção' || !raw) return [];
    return raw.split(',').map((s: string) => s.trim()).filter(Boolean);
  });

  // Estúdio
  const [cropFileContext, setCropFileContext] = React.useState<{ url: string, file: File } | null>(null);
  const [crop, setCrop] = React.useState({ x: 0, y: 0 });
  const [zoom, setZoom] = React.useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = React.useState(null);
  const [isCropping, setIsCropping] = React.useState(false);

  const onCropComplete = React.useCallback((croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const finishCrop = async () => {
    if (!cropFileContext || !croppedAreaPixels) return;
    setIsCropping(true);
    try {
       const croppedImageBlob = await getCroppedImg(cropFileContext.url, croppedAreaPixels);
       if (croppedImageBlob) {
          setUploadingImage(true);
          const url = await productService.uploadImage(croppedImageBlob as any);
          setValue('image_url', url);
       }
    } catch (e: any) {
       console.error(e);
       alert("Falha ao recortar a imagem.");
    } finally {
       setIsCropping(false);
       setUploadingImage(false);
       setCropFileContext(null);
    }
  };

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

            <div className="grid grid-cols-4 gap-4">
              <div>
                <label className="block text-[8px] font-bold text-gray-400 uppercase tracking-widest mb-2 px-1 font-sans truncate">Venda (R$)</label>
                <input 
                  type="number" step="0.01" {...register('price')}
                  className="w-full p-4 bg-gray-50 rounded-2xl border border-gray-100 text-secundaria font-bold outline-none focus:border-primaria focus:bg-white transition-all shadow-inner [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
                />
              </div>
              <div>
                <label className="block text-[8px] font-bold text-gray-400 uppercase tracking-widest mb-2 px-1 font-sans truncate">Custo (R$)</label>
                <input 
                  type="number" step="0.01" {...register('cost')}
                  className="w-full p-4 bg-gray-50 rounded-2xl border border-gray-100 text-secundaria font-bold outline-none focus:border-primaria focus:bg-white transition-all shadow-inner [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
                />
              </div>
              <div>
                <label className="block text-[8px] font-bold text-gray-400 uppercase tracking-widest mb-2 px-1 font-sans truncate">Qtd. Pronto</label>
                <input 
                  type="number" {...register('stock')}
                  className="w-full p-4 bg-gray-50 rounded-2xl border border-gray-100 text-secundaria font-bold outline-none focus:border-primaria focus:bg-white transition-all shadow-inner [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
                />
              </div>
              <div>
                <label className="block text-[8px] font-bold text-purple-400 uppercase tracking-widest mb-2 px-1 font-sans truncate">A Fazer</label>
                <input 
                  type="number" {...register('stock_to_make')}
                  className="w-full p-4 bg-purple-50/50 rounded-2xl border border-purple-100 text-purple-700 font-bold outline-none focus:border-purple-300 focus:bg-purple-50 transition-all shadow-inner [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div className="bg-gray-50 p-5 rounded-3xl border border-gray-100 shadow-inner">
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4 px-1 font-sans">Linha / Coleções Especiais (Pode marcar várias)</label>
                <div className="flex flex-wrap gap-2">
                  {availableCollections.map(c => {
                     const isSelected = selectedCols.includes(c);
                     return (
                        <button
                           type="button"
                           key={c}
                           onClick={() => {
                              const next = isSelected ? selectedCols.filter(x => x !== c) : [...selectedCols, c];
                              setSelectedCols(next);
                              setValue('colecao', next.length > 0 ? next.join(', ') : 'Sem linha / Coleção');
                           }}
                           className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all border ${isSelected ? 'bg-secundaria text-white border-secundaria shadow-md' : 'bg-white text-gray-400 border-gray-200 hover:border-secundaria/50 hover:text-secundaria'}`}
                        >
                           {c}
                        </button>
                     )
                  })}
                </div>
                <input type="hidden" {...register('colecao')} />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
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

            <div>
               <div className="flex items-center justify-between mb-2 px-1">
                 <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest font-sans">
                    Galeria de Fotos (Arquivo Local)
                 </label>
                 {uploadingImage && <span className="text-[10px] text-primaria font-bold uppercase tracking-widest animate-pulse">Enviando...</span>}
               </div>

               <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                 {[
                   { field: 'image_url', label: 'Capa Principal' },
                   { field: 'image_2', label: 'Foto Extra 2' },
                   { field: 'image_3', label: 'Foto Extra 3' },
                   { field: 'image_4', label: 'Foto Extra 4' },
                 ].map((item, idx) => {
                   const currUrl = watch(item.field);
                   return (
                     <div key={item.field} className="relative">
                        {currUrl ? (
                          <div className="aspect-[4/5] rounded-2xl overflow-hidden border border-gray-200 shadow-sm relative group bg-gray-50">
                             <img src={currUrl} alt={`Preview ${idx+1}`} className="w-full h-full object-cover group-hover:opacity-40 transition-all" />
                             <button type="button" onClick={() => setValue(item.field, '')} className="absolute inset-0 m-auto w-10 h-10 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-xl">
                               <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>
                             </button>
                          </div>
                        ) : (
                          <div className="aspect-[4/5] rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 flex flex-col items-center justify-center relative hover:bg-gray-100 hover:border-primaria/50 transition-all cursor-pointer">
                             <span className="text-2xl mb-2 opacity-30">📷</span>
                             <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest text-center px-2">{item.label}</span>
                             <input 
                               type="file" 
                               accept="image/*"
                               onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (!file) return;

                                  if (item.field === 'image_url') {
                                    const objectUrl = URL.createObjectURL(file);
                                    setCropFileContext({ url: objectUrl, file });
                                  } else {
                                    setUploadingImage(true);
                                    try {
                                       const url = await productService.uploadImage(file);
                                       setValue(item.field, url);
                                    } catch (err: any) {
                                       alert("Erro ao enviar imagem: " + (err.message || ''));
                                    } finally {
                                       setUploadingImage(false);
                                    }
                                  }
                               }}
                               className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                             />
                          </div>
                        )}
                        <input type="hidden" {...register(item.field)} />
                     </div>
                   );
                 })}
               </div>
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
              disabled={mutation.isPending}
              className="w-full bg-secundaria text-white font-bold py-5 rounded-2xl uppercase tracking-widest text-sm hover:bg-black transition-all shadow-xl active:scale-95 disabled:bg-gray-300 transform"
            >
              {mutation.isPending ? 'Sincronizando...' : product ? 'Salvar Mudanças' : 'Cadastrar na Camélia'}
            </button>
            {product && (
               <p className="text-center text-[9px] text-gray-300 mt-4 uppercase tracking-widest">ID: {product.id}</p>
            )}
          </div>
        </form>

        {/* MODAL DE ESTÚDIO FOTOGRÁFICO */}
        {cropFileContext && (
          <div className="fixed inset-0 z-[200] max-w-full m-auto h-screen bg-black flex flex-col justify-between items-center text-white animate-in zoomIn duration-300">
             <div className="absolute top-0 inset-x-0 p-6 z-10 bg-gradient-to-b from-black/80 to-transparent flex justify-between items-center">
                <h4 className="font-bold text-sm uppercase tracking-widest text-[#D4AF37]">Estúdio de Enquadramento</h4>
                <button type="button" onClick={() => setCropFileContext(null)} className="text-gray-300 hover:text-white uppercase font-bold text-[10px] tracking-widest">Cancelar</button>
             </div>
             
             <div className="relative w-full h-full flex-1">
                <Cropper
                  image={cropFileContext.url}
                  crop={crop}
                  zoom={zoom}
                  aspect={4 / 5}
                  onCropChange={setCrop}
                  onCropComplete={onCropComplete}
                  onZoomChange={setZoom}
                  classes={{ containerClassName: "bg-black" }}
                />
             </div>
             
             <div className="absolute bottom-0 inset-x-0 p-8 z-10 bg-gradient-to-t from-black/90 to-transparent flex flex-col items-center gap-6">
                <div className="w-full max-w-md flex items-center justify-between">
                   <span className="text-xs uppercase tracking-widest font-bold text-gray-400">Zoom</span>
                   <input
                      type="range"
                      value={zoom}
                      min={1}
                      max={3}
                      step={0.1}
                      onChange={(e) => setZoom(Number(e.target.value))}
                      className="w-3/4 accent-[#D4AF37]"
                   />
                </div>
                <button 
                  onClick={finishCrop} 
                  disabled={isCropping}
                  className="w-full max-w-md bg-[#D4AF37] text-black font-bold py-4 rounded-xl uppercase tracking-widest hover:bg-yellow-400 active:scale-95 transition-all text-xs disabled:opacity-50"
                >
                  {isCropping ? 'Processando Corte...' : 'Confirmar Enquadramento (Capa)'}
                </button>
             </div>
          </div>
        )}

      </div>
    </div>
  );
}
