import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import './Auth.css';

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);
    
    // Conecta com o Supabase e dispara o SignIn
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      setErrorMsg("E-mail ou senha incorretos.");
      setLoading(false);
    } else if (data.session) {
      navigate('/admin');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="auth-title">Acesso Restrito</h1>
        <p style={{ color: '#888', marginBottom: '20px', fontSize: '0.9rem' }}>
          🔒 Painel Camélia Handcraft.
        </p>
        
        {errorMsg && (
          <div style={{ backgroundColor: '#FEE2E2', color: '#B91C1C', padding: '10px', borderRadius: '6px', marginBottom: '15px', fontSize: '14px', textAlign: 'center' }}>
            {errorMsg}
          </div>
        )}

        <form className="auth-form" onSubmit={handleLogin}>
          <div className="input-group">
            <label>E-mail</label>
            <input 
              type="email" 
              placeholder="seu@email.com" 
              required 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
            />
          </div>

          <div className="input-group">
            <label>Senha</label>
            <input 
              type="password" 
              placeholder="********" 
              required 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
            />
          </div>

          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? 'Acessando...' : 'Entrar na Gestão'}
          </button>
        </form>

        <div className="auth-footer">
          <p>Acesso exclusivo da administração.</p>
          <p style={{ marginTop: '10px' }}>
            <Link to="/" className="auth-link">Voltar para a Loja Virtual</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;