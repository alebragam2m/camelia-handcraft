import { useLocation, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { formatCurrency } from '../utils/formatCurrency';
import { useCatalog } from '../hooks/useCatalog';
import CatalogFeedback from '../components/CatalogFeedback';
import { inCollection } from '../lib/catalog';
const WHATSAPP_NUMBER = '5591991145232';
function ProductsPage() {
  const { data: products = [], isPending: loading, error } = useCatalog();
  const { addToCart } = useCart();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const queryCol = params.get('col');
  const queryCategory = params.get('cat');
  const search = (params.get('search') || '').trim().toLocaleLowerCase('pt-BR');
  const displayed = products.filter(product => {
    if (queryCol && !inCollection(product, queryCol)) return false;
    if (queryCategory && product.category !== queryCategory) return false;
    return !search || (product.nome + ' ' + (product.description || '')).toLocaleLowerCase('pt-BR').includes(search);
  });
  if (loading) {
    return (
      <div className="p-10 text-center text-gray-400">
      <CatalogFeedback error={error} />
        Carregando peças...
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 md:py-20">
      <CatalogFeedback error={error} />
      <div className="flex flex-wrap items-baseline justify-between gap-4 mb-10">
        <h1 className="text-4xl md:text-5xl font-serif text-secundaria">
          {queryCol ? queryCol : 'Nossas Peças'}
        </h1>
        <p className="text-secundaria/80">{displayed.length} {displayed.length === 1 ? 'peça' : 'peças'} feitas à mão</p>
      </div>
      {displayed.length === 0 ? (
        <p className="text-secundaria/80">Nenhuma peça encontrada. <Link to="/produtos" className="underline underline-offset-4">Ver todas as peças</Link></p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-10 md:gap-x-6">
          {displayed.map((prod, index) => (
            <div key={prod.id} className="group flex flex-col">
              <Link to={`/produtos/${prod.id}`} className="block bg-[#ECEAF6] p-3 md:p-4 rounded-2xl mb-4">
                <img
                  src={prod.image_url || '/logo.png'}
                  alt={prod.nome}
                  loading={index < 8 ? "eager" : "lazy"}
                  className="w-full aspect-[4/5] object-cover rounded-xl transition-transform duration-500 group-hover:scale-[1.02]"
                />
              </Link>
              <Link to={`/produtos/${prod.id}`} className="block mb-1">
                <h3 className="font-semibold text-secundaria text-base leading-snug group-hover:text-primaria transition-colors">{prod.nome}</h3>
              </Link>
              <p className="text-secundaria/80 mb-4">
                {formatCurrency(prod.price)}
                {prod.is_preorder && <span className="ml-2 text-sm">· sob encomenda</span>}
              </p>

              {prod.is_preorder ? (
                <a
                  href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(`Olá, tenho interesse no produto: ${prod.nome}`)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-auto w-full text-center bg-[#D9C4E6] hover:bg-[#cdb2de] text-secundaria font-semibold py-3 rounded-full text-sm transition-colors"
                >
                  Encomendar pelo WhatsApp
                </a>
              ) : prod.stock > 0 ? (
                <button
                  onClick={() => addToCart(prod, 1)}
                  className="mt-auto w-full bg-secundaria hover:bg-primaria text-white font-semibold py-3 rounded-full text-sm transition-colors"
                >
                  Adicionar ao carrinho
                </button>
              ) : (
                <span className="mt-auto w-full text-center bg-gray-100 text-gray-600 font-semibold py-3 rounded-full text-sm cursor-not-allowed">
                  Esgotado
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ProductsPage;