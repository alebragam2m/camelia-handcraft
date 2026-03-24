import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorInput, setErrorInput] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorInput('');

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setErrorInput(error.message);
      setLoading(false);
    } else {
      navigate('/admin');
    }
  };

  return (
    <div className="min-h-screen bg-[#F0F2F9] flex flex-col items-center justify-center relative overflow-hidden">
      {/* Efeitos de brilho (Glow radial estilo Manus) */}
      <div className="absolute top-0 left-0 w-full h-full opacity-30 pointer-events-none" style={{background: 'radial-gradient(circle at 10% 10%, #6667AB, transparent 50%), radial-gradient(circle at 90% 90%, #6667AB, transparent 50%)'}}></div>
      
      <img src="https://d2xsxph8kpxj0f.cloudfront.net/310519663333311457/jYnyUezM2roqgsENRZ6eYf/camelia-logo_6a948d64.png" alt="Camélia Logo" className="h-16 mb-8 relative z-10 opacity-90 drop-shadow-sm" />

      <div className="bg-white p-10 rounded-3xl shadow-2xl w-full max-w-sm relative z-10 border border-white/50">
        <h2 className="text-2xl font-serif text-center font-bold text-secundaria mb-2">Painel de Gestão</h2>
        <p className="text-center text-sm text-gray-500 mb-8">Acesse com suas credenciais</p>
        
        {errorInput && (
          <div className="bg-red-50 text-red-500 text-sm p-4 rounded-xl mb-6 text-center border border-red-100 font-medium">
            Senha ou e-mail inválidos.
          </div>
        )}

        <form onSubmit={handleLogin} className="flex flex-col gap-5">
          <input 
            type="email" 
            placeholder="Seu E-mail" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            required 
            className="p-4 border border-gray-200 rounded-xl outline-none focus:border-primaria focus:ring-4 focus:ring-primaria/10 transition-all font-sans text-sm bg-gray-50/50"
          />
          <input 
            type="password" 
            placeholder="Sua Senha" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
            className="p-4 border border-gray-200 rounded-xl outline-none focus:border-primaria focus:ring-4 focus:ring-primaria/10 transition-all font-sans text-sm bg-gray-50/50"
          />
          <button 
            type="submit" 
            disabled={loading}
            className="bg-primaria text-white font-bold py-4 rounded-xl mt-4 hover:bg-[#5556A0] transition-transform hover:-translate-y-1 active:translate-y-0 disabled:opacity-70 disabled:cursor-not-allowed shadow-lg hover:shadow-primaria/40"
          >
            {loading ? 'Autenticando...' : 'Entrar na Gestão'}
          </button>
        </form>
      </div>
      <p className="text-sm text-gray-400 mt-12 relative z-10 font-medium">&copy; 2026 Camélia Handcraft</p>
    </div>
  );
}

export default Login;