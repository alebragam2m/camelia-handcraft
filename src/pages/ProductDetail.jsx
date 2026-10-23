import { formatCurrency } from '../utils/formatCurrency';
import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useCatalog } from '../hooks/useCatalog';
import CatalogFeedback from '../components/CatalogFeedback';
function ProductDetail() {
  const { id } = useParams();
  const { data: products = [], isPending: loading, error } = useCatalog();
  const product = products.find(item => String(item.id) === id);
  const [selectedImage, setMainImage] = useState('');
  const [quantity, setQuantity] = useState(1);
  const { addToCart } = useCart();
  const currentImages = product ? [product.image_url, product.image_2, product.image_3, product.image_4].filter(Boolean) : [];
  const mainImage = currentImages.includes(selectedImage) ? selectedImage : currentImages[0] || '/logo.png';
  if (loading) return <div className="min-h-screen flex items-center justify-center">Carregando produto...</div>;
  if (error) return <CatalogFeedback error={error} />;
  if (!product) return <div className="min-h-screen flex items-center justify-center">Esta peça não está disponível na loja.</div>;
  // Reúne todas as imagens upadas ignorando nulas
  const imagesList = [product.image_url, product.image_2, product.image_3, product.image_4].filter(Boolean);

  const handleAddToCart = () => {
    addToCart(product, quantity);
  };

  const collections = (product.colecao || '').split(',').map(value => value.trim()).filter(name => name && name !== 'Sem linha / Coleção');
  const available = product.stock > 0 && !product.is_preorder;
  const whatsappOrder = `https://wa.me/5591991145232?text=${encodeURIComponent(`Olá, tenho interesse no produto: ${product.nome}`)}`;

  return (
    <div className="bg-fundo min-h-screen pb-28">
       <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 md:pt-16">

         <Link to="/produtos" className="inline-flex items-center gap-2 mb-8 text-secundaria/80 hover:text-primaria transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" /></svg>
            Voltar para as peças
         </Link>

         <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-start">

            {/* Foto principal e miniaturas */}
            <div className="flex flex-col gap-4">
               <div className="bg-[#ECEAF6] p-4 md:p-6 rounded-3xl">
                  <img src={mainImage} alt={product.nome} className="w-full aspect-[4/5] object-cover rounded-2xl" />
               </div>
               {imagesList.length > 1 && (
                 <div className="grid grid-cols-4 gap-3">
                    {imagesList.map((img, i) => (
                       <button key={img} type="button" onClick={() => setMainImage(img)} aria-label={`Ver foto ${i + 1} de ${product.nome}`} aria-pressed={mainImage === img}
                         className={`aspect-[4/5] overflow-hidden rounded-xl p-1.5 transition-colors ${mainImage === img ? 'bg-primaria' : 'bg-[#ECEAF6] hover:bg-[#D9C4E6]'}`}>
                          <img src={img} alt="" className="w-full h-full object-cover rounded-lg" />
                       </button>
                    ))}
                 </div>
               )}
            </div>

            {/* Informações e compra */}
            <div className="flex flex-col lg:pt-4">
               <h1 className="text-4xl md:text-5xl font-serif font-medium text-secundaria mb-4 leading-tight">{product.nome}</h1>
               <p className="text-3xl font-semibold text-primaria mb-6"><span>{formatCurrency(product.price)}</span> <span className="text-base font-normal text-secundaria/80">a unidade</span></p>
               {collections.length > 0 && (
                 <p className="-mt-3 mb-6 text-secundaria/80">{collections.length > 1 ? 'Coleções: ' : 'Coleção: '}
                   {collections.map((name, i) => (
                     <span key={name}>{i > 0 && ', '}<Link to={`/produtos?col=${encodeURIComponent(name)}`} className="underline underline-offset-4 hover:text-primaria">{name}</Link></span>
                   ))}
                 </p>
               )}

               {product.description && (
                 <p className="text-lg text-secundaria/90 mb-8 leading-relaxed whitespace-pre-line">{product.description}</p>
               )}
               {product.measure_cm && <p className="mb-8 text-secundaria/80">Medidas: {product.measure_cm} cm</p>}

               {/* Compra */}
               <div className="bg-white p-6 md:p-8 rounded-3xl space-y-5">
                  <p className="flex items-center gap-2 font-semibold text-secundaria">
                     <span className={`w-2.5 h-2.5 rounded-full ${available ? 'bg-green-600' : 'bg-[#B48BCB]'}`} aria-hidden="true"></span>
                     {product.is_preorder ? 'Feita sob encomenda' : (product.stock > 0 ? `${product.stock} ${Number(product.stock) === 1 ? 'pronta' : 'prontas'} para envio` : 'Esgotada no site, disponível sob encomenda')}
                  </p>

                  {(product.stock > 0 && !product.is_preorder) ? (
                    <div className="flex flex-wrap items-center gap-4">
                      <div className="flex items-center bg-fundo rounded-full">
                        <button type="button" aria-label="Diminuir quantidade"
                          onClick={() => setQuantity(Math.max(1, quantity - 1))}
                          className="w-12 h-12 rounded-full text-secundaria hover:bg-[#ECEAF6] transition-colors font-bold text-lg"
                        >−</button>
                        <span className="w-10 text-center font-semibold text-secundaria" aria-live="polite">{quantity}</span>
                        <button type="button" aria-label="Aumentar quantidade"
                          onClick={() => setQuantity(Math.min(Number(product.stock), quantity + 1))}
                          className="w-12 h-12 rounded-full text-secundaria hover:bg-[#ECEAF6] transition-colors font-bold text-lg"
                        >+</button>
                      </div>
                      <button type="button"
                        onClick={handleAddToCart}
                        disabled={quantity > Number(product.stock)}
                        className="flex-1 min-w-[200px] font-semibold py-4 rounded-full transition-colors bg-secundaria text-white hover:bg-primaria active:scale-[0.98] disabled:opacity-50">
                        Adicionar ao carrinho · {formatCurrency(quantity * Number(product.price))}
                      </button>
                    </div>
                  ) : (
                    <a href={whatsappOrder} target="_blank" rel="noreferrer"
                      className="block text-center font-semibold py-4 rounded-full transition-colors bg-[#D9C4E6] hover:bg-[#cdb2de] text-secundaria">
                      Encomendar pelo WhatsApp
                    </a>
                  )}

                  {available && (
                    <a href={`https://wa.me/5591991145232?text=${encodeURIComponent(`Olá, Camélia! Vi a peça ${product.nome} no site e tenho uma dúvida.`)}`} target="_blank" rel="noreferrer"
                       className="block text-center text-secundaria underline underline-offset-4 hover:text-primaria">
                       Tirar uma dúvida pelo WhatsApp
                    </a>
                  )}
               </div>

               {/* Entrega e trocas: fatos das políticas da loja */}
               <dl className="mt-8 grid grid-cols-2 gap-x-6 gap-y-5 text-secundaria">
                  <div><dt className="font-semibold">Postagem</dt><dd className="text-secundaria/80">1 dia útil depois do pagamento</dd></div>
                  <div><dt className="font-semibold">Retirada</dt><dd className="text-secundaria/80">Grátis no ateliê, em Belém</dd></div>
                  <div><dt className="font-semibold">Pagamento</dt><dd className="text-secundaria/80">Pix ou cartão</dd></div>
                  <div><dt className="font-semibold">Trocas</dt><dd className="text-secundaria/80">7 dias para desistir · <Link to="/legal?tab=trocas" className="underline underline-offset-4 hover:text-primaria">ver regras</Link></dd></div>
               </dl>
            </div>
         </div>
       </div>
    </div>
  );
}

export default ProductDetail;
