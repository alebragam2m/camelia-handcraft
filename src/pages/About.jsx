import './About.css'

function About() {
  return (
    <div className="about-container">
      <h1>Nossa Essência</h1>
      
      <div className="about-content">
        <p>
          A Camélia Handcraft nasceu do desejo de trazer alma para os ambientes. 
          Acreditamos que cada casa conta uma história, e os objetos que escolhemos 
          são as palavras dessa narrativa.
        </p>
        <p>
          Nossa produção é 100% "Tailor Made" (feita sob medida). Não trabalhamos 
          com estoques massivos, mas sim com a dedicação de criar peças únicas, 
          respeitando o tempo e a beleza dos materiais naturais.
        </p>
        
        {/* Sua escolha (Opção 3) com destaque */}
        <p className="about-final">
          Deixe a delicadeza do feito à mão encontrar o seu lar. Estamos prontos 
          para dar forma, cor e textura aos seus momentos mais especiais.
        </p>

        <span className="about-highlight">Feito à mão, com o coração.</span>
      </div>
    </div>
  )
}

export default About