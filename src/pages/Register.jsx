import { Link, useNavigate } from 'react-router-dom';
import './Auth.css';

function Register() {
  const navigate = useNavigate();

  const handleRegister = (e) => {
    e.preventDefault();
    alert("Cadastro realizado! Bem-vindo(a) à Camélia.");
    navigate('/minha-conta');
  };

  return (
    <div className="auth-container">
      <div className="auth-card" style={{ maxWidth: '450px' }}>
        <h1 className="auth-title">Criar Conta</h1>
        
        <form className="auth-form" onSubmit={handleRegister}>
          <div className="input-group">
            <label>Nome Completo</label>
            <input type="text" placeholder="Ex: Maria Silva" required />
          </div>

          <div className="input-group">
            <label>E-mail</label>
            <input type="email" placeholder="seu@email.com" required />
          </div>

          <div className="input-group">
            <label>Senha</label>
            <input type="password" placeholder="Crie uma senha forte" required />
          </div>

          <div className="input-group">
            <label>Confirmar Senha</label>
            <input type="password" placeholder="Repita a senha" required />
          </div>

          <button type="submit" className="auth-button">Cadastrar</button>
        </form>

        <div className="auth-footer">
          <p>Já tem conta? <Link to="/login" className="auth-link">Fazer Login</Link></p>
        </div>
      </div>
    </div>
  );
}

export default Register;