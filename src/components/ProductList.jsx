import { Link } from 'react-router-dom'
import './ProductList.css'

function ProductList() {
  const products = [
    { 
      id: 1, 
      name: 'Porta Guardanapo Orquídea', 
      price: 'R$ 45,00', 
      img: '/orquidea.jpg' 
    },
    { 
      id: 2, 
      name: 'Porta Guardanapo Astromélia', 
      price: 'R$ 35,00', 
      img: '/astromelia.jpg' 
    },
    { 
      id: 3, 
      name: 'Jogo Americano Branco', 
      price: 'R$ 25,00', 
      img: '/jogo-americano.jpg' 
    }
  ]

  return (
    <section className="product-section">
      <h2 className="section-title">Coleção Destaque</h2>
      
      <div className="product-grid">
        {products.map((product) => (
          <div key={product.id} className="product-card">
            <Link to={`/produto/${product.id}`}>
              <img src={product.img} alt={product.name} />
            </Link>
            
            <h3>{product.name}</h3>
            <p>{product.price}</p>
            
            <Link to={`/produto/${product.id}`}>
              <button>Ver Detalhes</button>
            </Link>
          </div>
        ))}
      </div>
    </section>
  )
}

export default ProductList