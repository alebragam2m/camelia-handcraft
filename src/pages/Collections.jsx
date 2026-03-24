import { Link } from 'react-router-dom';
import './Collections.css';

function Collections() {
  // Agora deixamos apenas as coleções sazonais/festivas aqui
  const collectionsList = [
    { name: "Coleção Natal", image: "/logo.png" },
    { name: "Coleção Círio", image: "/logo.png" },
    { name: "Coleção Páscoa", image: "/logo.png" }
  ];

  return (
    <div className="collections-container">
      <h1 className="page-title">Coleções Especiais</h1>
      <p className="page-subtitle">Edições limitadas para datas inesquecíveis</p>

      <div className="categories-grid">
        {collectionsList.map((col, index) => (
          <Link 
            to={`/colecoes/${col.name}`} 
            key={index} 
            className="category-card"
          >
            <div className="category-image-wrapper">
              <img src={col.image} alt={col.name} />
            </div>
            
            <div className="category-content">
              <h3>{col.name}</h3>
              <span className="view-link">Ver coleção →</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default Collections;