import { formatCurrency } from '../utils/formatCurrency';
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../supabase';
import { useCart } from '../context/CartContext';

function ProductDetail() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mainImage, setMainImage] = useState('');
  const [quantity, setQuantity] = useState(1);
  
  const { addToCart } = useCart();

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    const { data } = await supabase.from('products').select('*').eq('id', id).single();
    if (data) {
      setProduct(data);
      setMainImage(data.image_url || '/logo.png');
    }
    setLoading(false);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-fundo text-secundaria font-serif">Carregando obra exclusiva...</div>;
  if (!product) return <div className="min-h-screen flex items-center justify-center bg-fundo text-secundaria font-serif">A peça procurada esgotou ou foi removida.</div>;

  // Reúne todas as imagens upadas ignorando nulas
  const imagesList = [product.image_url, product.image_2, product.image_3, product.image_4].filter(Boolean);

  const handleAddToCart = () => {
    addToCart(product, quantity);
  };

  return (
    <div className="bg-fundo min-h-screen relative overflow-hidden pb-32">
       {/* Padrão Tátil de Cruz Cruzada */}
       <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '30px 30px'}}></div>
       
       <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 md:mt-24 relative z-10">
         
         <div className="mb-10">
            <Link to="/produtos" className="text-xs uppercase tracking-[3px] font-bold text-gray-400 hover:text-primaria transition-colors flex items-center gap-2">
               <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" /></svg>
               Voltar para o Catálogo Minimalista
            </Link>
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 md:gap-20">
            
            {/* Lado Esquerdo: Galeria Inteligente */}
            <div className="flex flex-col gap-4">
               {/* Foto Central Adaptada à Tela */}
               <div className="w-full max-w-[450px] mx-auto aspect-square max-h-[40vh] lg:max-h-[50vh] bg-white flex items-center justify-center overflow-hidden shadow-sm hover:shadow-xl transition-shadow duration-500 rounded-3xl border border-gray-100/50 p-2">
                  <img src={mainImage} alt={product.nome} className="w-full h-full object-contain transition duration-500 rounded-2xl" />
               </div>
               
               {/* 3 a 4 Miniaturas */}
               {imagesList.length > 1 && (
                 <div className="grid grid-cols-4 gap-4 mt-2">
                    {imagesList.map((img, i) => (
                       <div key={i} onClick={() => setMainImage(img)} className={`cursor-pointer aspect-[4/5] bg-white overflow-hidden border-2 transition-all rounded-xl ${mainImage === img ? 'border-primaria opacity-100 relative' : 'border-transparent opacity-50 hover:opacity-100'}`}>
                          <img src={img} alt="Amostra" className="w-full h-full object-cover" />
                       </div>
                    ))}
                 </div>
               )}
            </div>

            {/* Lado Direito: Especificações Luxuosas */}
            <div className="flex flex-col justify-center py-6 md:py-0">
               
               <div className="mb-6">
                  <span className="bg-primaria/10 text-primaria px-4 py-2 text-[10px] uppercase font-bold tracking-[3px] rounded-full border border-primaria/20">{product.colecao}</span>
               </div>
               
               <h1 className="text-4xl md:text-5xl font-serif font-medium text-secundaria mb-6 leading-[1.2]">{product.nome}</h1>
               <div className="flex items-baseline gap-4 mb-8">
                  <p className="text-3xl font-bold text-primaria drop-shadow-sm">{formatCurrency(product.price)}</p>
                  <span className="text-xs text-gray-400 uppercase tracking-widest font-bold">À vista no PIX</span>
               </div>
               
               {/* Bloco de Descrição (Textos amplos) */}
               <div className="prose prose-sm md:prose-base text-gray-500 mb-10 font-light leading-relaxed whitespace-pre-line text-justify">
                  {product.description || "Esta peça foi criada seguindo as especificações rigorosas da Camélia Handcraft. Ela combina charme atemporal com as cores e tramas necessárias para elevar radicalmente a mesa posta da sua família."}
               </div>

               {/* Central de Conversão */}
               <div className="space-y-6 bg-white p-8 border border-gray-100 rounded-3xl shadow-sm">
                  <div className="flex items-center justify-between text-sm font-bold uppercase tracking-widest text-gray-500 pb-6 border-b border-gray-100">
                     <span>Estoque Disponível</span>
                     <span className={`px-4 py-1 rounded-full text-[10px] flex items-center gap-2 ${product.stock > 0 ? "bg-green-50 text-green-600" : "bg-red-50 text-red-500"}`}>
                        <span className={`w-2 h-2 rounded-full ${product.stock > 0 ? "bg-green-500 animate-pulse" : "bg-red-500"}`}></span>
                        {product.stock > 0 ? `${product.stock} unidades` : "Esgotado"}
                     </span>
                  </div>

                  {product.stock > 0 && (
                    <div className="flex items-center gap-6">
                      <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden">
                        <button 
                          onClick={() => setQuantity(Math.max(1, quantity - 1))}
                          className="px-4 py-3 bg-gray-50 text-gray-600 hover:bg-gray-100 transition-colors font-bold text-lg"
                        >−</button>
                        <span className="w-12 text-center font-bold text-secundaria">{quantity}</span>
                        <button 
                          onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                          className="px-4 py-3 bg-gray-50 text-gray-600 hover:bg-gray-100 transition-colors font-bold text-lg"
                        >+</button>
                      </div>
                      
                      <button 
                        onClick={handleAddToCart}
                        className="flex-1 bg-secundaria text-white font-bold py-4 rounded-xl shadow-xl shadow-secundaria/10 hover:bg-black transition-all uppercase tracking-[3px] text-[11px] active:scale-95">
                        Adicionar ao Carrinho
                      </button>
                    </div>
                  )}

                  <a href={`https://wa.me/5591991145232?text=Olá,%20Camélia!%20Acabei%20de%20ver%20a%20obra%20${encodeURIComponent(product.nome)}%20no%20site%20e%20gostaria%20de%20solicitar.`} target="_blank" rel="noreferrer" 
                     className={`w-full flex items-center justify-center gap-4 text-gray-500 font-bold py-4 rounded-xl border border-gray-200 hover:bg-gray-50 transition-all uppercase tracking-[3px] text-[10px]`}>
                     <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M11.42 9.49c-.23-.12-1.38-.68-1.6-.76-.23-.08-.4-.12-.57.12-.17.23-.62.76-.75.92-.14.15-.28.17-.5.05-.23-.11-1-.37-1.9-1.18-.7-.63-1.18-1.4-1.31-1.63-.14-.23-.01-.35.1-.47.1-.11.23-.26.34-.4.11-.13.15-.22.23-.37.07-.15.03-.28-.02-.4-.06-.11-.57-1.37-.78-1.87-.2-.5-.41-.43-.57-.44-.15-.01-.32-.01-.48-.01-.17 0-.44.06-.67.31-.23.25-.87.85-.87 2.06 0 1.2.9 2.37 1.02 2.54.12.16 1.73 2.64 4.19 3.68.59.25 1.05.4 1.41.51.58.18 1.11.16 1.54.1.48-.07 1.38-.56 1.58-1.1.2-.54.2-.1.14-.15-.06-.06-.23-.1-.46-.22z"/></svg>
                     Dúvidas via WhatsApp
                  </a>
               </div>
               
               {/* Selos de Garantia (Design Premium extra) */}
               <div className="mt-8 grid grid-cols-2 gap-4 border-t border-gray-100 pt-8">
                  <div className="flex items-center gap-3">
                     <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-primaria"><path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" /></svg>
                     <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest text-left leading-4">Corte Premium<br/>Tecelagem Artesanal</p>
                  </div>
                  <div className="flex items-center gap-3">
                     <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-primaria"><path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" /></svg>
                     <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest text-left leading-4">Referência e<br/>Alta Exclusividade</p>
                  </div>
               </div>

            </div>
         </div>
       </div>
    </div>
  );
}

export default ProductDetail;
