import { useParams, Link } from 'react-router-dom';
import { products } from '../data/productsData';
import './Collections.css'; // Vamos reaproveitar o estilo

function CollectionProducts() {
  const { categoryName } = useParams();

  // Filtra os produtos para mostrar APENAS os da categoria clicada
  const filteredProducts = products.filter(
    product => product.category === categoryName
  );

  return (
    <div className="collections-container">
      {/* Botãozinho de voltar sutil */}
      <Link to="/colecoes" className="back-link">← Voltar para Coleções</Link>

      <h1 className="collection-title" style={{ marginTop: '20px' }}>
        {categoryName}
      </h1>

      {filteredProducts.length > 0 ? (
        <div className="collection-grid">
          {filteredProducts.map(product => (
            <div key={product.id} className="collection-card">
              <div className="card-image">
                <img src={product.image} alt={product.name} />
              </div>
              <div className="card-info">
                <h3>{product.name}</h3>
                <p className="card-price">{product.price}</p>
                <Link to={`/produto/${product.id}`}>
                  <button>Ver Detalhes</button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="no-products">Nenhum produto encontrado nesta coleção.</p>
      )}
    </div>
  );
}

export default CollectionProducts;