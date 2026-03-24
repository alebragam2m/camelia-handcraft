import { Link } from 'react-router-dom'
import './Navbar.css'

function Navbar() {
  return (
    <nav className="navbar">
      {/* LADO ESQUERDO: Logo e Nome */}
      <Link to="/" className="brand-group">
        <img src="/logo.png" alt="Logo" className="logo-img" />
        <span className="brand-name">Camelia Handcraft</span>
      </Link>
      
      {/* LADO DIREITO: Links e Ícones */}
      <div className="nav-right">
        <ul className="nav-links">
          <li><Link to="/">Início</Link></li>
          <li><Link to="/produtos">Produtos</Link></li>
          <li><Link to="/colecoes">Coleções</Link></li>
          <li><Link to="/sobre">Sobre</Link></li>
          <li><Link to="/contato">Contato</Link></li>
        </ul>
        
        <Link to="/login" className="user-icon" title="Minha Conta">
          👤
        </Link>
        
        <button className="cart-button">
          🛍️ <span className="cart-text">Sacola (0)</span>
        </button>
      </div>
    </nav>
  )
}

export default Navbar