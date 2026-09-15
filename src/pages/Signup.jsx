import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';

function Signup() {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [password, setPassword] = useState('');
  const [errorInput, setErrorInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirmSent, setConfirmSent] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorInput('');

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: nome } },
    });

    if (error) {
      setErrorInput(error.message);
      setLoading(false);
      return;
    }

    if (data.session) {
      // Sessão já criada (confirmação de e-mail desativada): registra o
      // cadastro em `clients` agora e segue direto para onde o login foi
      // pedido (ex. checkout) ou para a área do cliente.
      const { error: rpcError } = await supabase.rpc('ensure_own_client_profile', {
        p_full_name: nome, p_phone: telefone,
      });
      if (rpcError) console.error('[Signup] Falha ao registrar cadastro do cliente:', rpcError.message);
      navigate(location.state?.from || '/minha-conta', { replace: true });
    } else {
      // Confirmação de e-mail exigida — o cadastro em `clients` acontece
      // automaticamente no primeiro acesso a /minha-conta após confirmar.
      setConfirmSent(true);
      setLoading(false);
    }
  };

  if (confirmSent) {
    return (
      <div className="min-h-screen bg-fundo flex flex-col items-center justify-center px-4 text-center">
        <h2 className="text-2xl font-serif font-bold text-secundaria mb-4">Confirme seu e-mail</h2>
        <p className="text-gray-500 max-w-md">
          Enviamos um link de confirmação para <strong>{email}</strong>. Assim que confirmar, é só entrar normalmente.
        </p>
        <Link to="/login" className="text-primaria font-bold uppercase tracking-widest text-xs mt-8 underline">Voltar para o login</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-fundo flex flex-col items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full opacity-30 pointer-events-none" style={{background: 'radial-gradient(circle at 10% 10%, #6667AB, transparent 50%), radial-gradient(circle at 90% 90%, #6667AB, transparent 50%)'}}></div>

      <img src="/logo camelia vetor (1).svg" onError={(e) => { e.target.src = '/logo.png' }} alt="Camélia Logo" className="h-32 mb-8 relative z-10 drop-shadow-md" />

      <div className="bg-white p-8 md:p-12 rounded-[40px] shadow-2xl w-full max-w-md relative z-10 border border-gray-50">
        <h2 className="text-3xl font-serif text-center font-bold text-secundaria mb-2">Criar Conta</h2>
        <p className="text-center text-sm text-gray-400 mb-10 font-medium">Cadastre-se para acompanhar seus pedidos</p>

        {errorInput && (
          <div className="bg-red-50 text-red-500 text-xs p-4 rounded-2xl mb-8 text-center border border-red-100 font-bold uppercase tracking-wider">
            {errorInput}
          </div>
        )}

        <form onSubmit={handleSignup} className="flex flex-col gap-5">
          <input
            type="text" placeholder="Nome completo" value={nome}
            onChange={(e) => setNome(e.target.value)} required
            className="p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:border-primaria focus:bg-white transition-all font-sans text-sm"
          />
          <input
            type="email" placeholder="E-mail" value={email}
            onChange={(e) => setEmail(e.target.value)} required
            className="p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:border-primaria focus:bg-white transition-all font-sans text-sm"
          />
          <input
            type="tel" placeholder="WhatsApp" value={telefone}
            onChange={(e) => setTelefone(e.target.value)}
            className="p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:border-primaria focus:bg-white transition-all font-sans text-sm"
          />
          <input
            type="password" placeholder="Senha (mínimo 6 caracteres)" value={password}
            onChange={(e) => setPassword(e.target.value)} required minLength={6}
            className="p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:border-primaria focus:bg-white transition-all font-sans text-sm"
          />
          <button
            type="submit" disabled={loading}
            className="bg-primaria text-white font-bold py-5 rounded-2xl mt-4 hover:bg-[#5556A0] transition-all disabled:opacity-50 uppercase tracking-[3px] text-[11px] shadow-xl shadow-primaria/20 active:scale-95"
          >
            {loading ? 'Criando conta...' : 'Criar Conta'}
          </button>
        </form>

        <p className="text-center mt-8 text-[11px] text-gray-400 font-medium">
          Já tem conta? <Link to="/login" state={location.state} className="text-primaria font-bold hover:underline">Entrar</Link>
        </p>
      </div>
      <p className="text-xs text-gray-400 mt-12 relative z-10 font-bold uppercase tracking-widest">Camélia Handcraft Ateliê</p>
    </div>
  );
}

export default Signup;
