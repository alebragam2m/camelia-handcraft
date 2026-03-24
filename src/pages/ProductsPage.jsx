import { Link } from 'react-router-dom';
import './Collections.css';

function ProductsPage() {
  const productsList = [
    { name: "Guardanapos", image: "/logo.png" },
    { name: "Jogos Americanos", image: "/logo.png" },
    { name: "Porta Guardanapos", image: "/logo.png" },
    { name: "Diversos", image: "/logo.png" }
  ];

  return (
    <div className="collections-container">
      <h1 className="page-title">Nossos Produtos</h1>
      <p className="page-subtitle">Peças atemporais para compor a sua mesa</p>

      <div className="categories-grid">
        {productsList.map((prod, index) => (
          <Link to={`/colecoes/${prod.name}`} key={index} className="category-card">
            <div className="category-image-wrapper">
              <img src={prod.image} alt={prod.name} />
            </div>
            <div className="category-content">
              <h3>{prod.name}</h3>
              <span className="view-link">Ver peças →</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default ProductsPage;