import { Link } from 'react-router-dom'
import './Hero.css'

function Hero() {
  return (
    <section className="hero">
      <div className="hero-content">
        <h1>A Arte do Feito à Mão</h1>
        <p>Peças exclusivas que contam histórias. Sofisticação e alma para vestir sua casa.</p>
        
        <Link to="/contato">
          <button className="hero-button">Solicitar Criação Sob Medida</button>
        </Link>
      </div>
    </section>
  )
}

export default Hero