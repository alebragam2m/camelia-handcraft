import { Link } from 'react-router-dom';
import { useCatalog } from '../hooks/useCatalog';
import { getCollections } from '../lib/catalog';
import CatalogFeedback from '../components/CatalogFeedback';
function Collections() {
  const { data: products = [], isPending: loading, error } = useCatalog();
  const collections = getCollections(products);
  return (
    <div className="bg-fundo min-h-screen relative overflow-hidden">
      <CatalogFeedback error={error} />

      {/* Hero Banner Interno */}
      <section className="relative bg-secundaria text-branco py-24 px-6 text-center">
        <div className="relative z-10 max-w-3xl mx-auto">
          {/* Texto 'Mesa Temática' removido conforme solicitado */}
          <h1 className="text-4xl md:text-5xl font-serif font-medium tracking-tight">
            Nossas Coleções
          </h1>
        </div>
      </section>

      {/* Grid de Coleções Dinâmico */}
      <section className="py-20 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 animate-pulse">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-[220px] bg-gray-100 rounded-2xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-10 md:gap-x-6">
            {collections.map(col => (
              <Link to={`/produtos?col=${encodeURIComponent(col.nome)}`} key={col.nome} className="group block">
                <span className="block bg-[#ECEAF6] p-3 md:p-4 rounded-2xl mb-4 transition-colors group-hover:bg-[#D9C4E6]">
                  <img
                    src={col.img || '/logo.png'}
                    alt=""
                    loading="lazy"
                    className="w-full aspect-[4/5] object-cover rounded-xl transition-transform duration-500 group-hover:scale-[1.02]"
                    onError={(e) => { e.target.src = '/logo.png'; }}
                  />
                </span>
                <h2 className="text-2xl font-serif text-secundaria group-hover:text-primaria transition-colors">{col.nome}</h2>
                <p className="text-secundaria/80">{col.count} {col.count === 1 ? 'peça' : 'peças'}</p>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default Collections;