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
       // Verificação inteligente de perfil: Admin ou Cliente?
       const { data: { user } } = await supabase.auth.getUser();
       const { data: adminRecord } = await supabase
         .from('admin_users')
         .select('role')
         .eq('auth_user_id', user.id)
         .single();

       if (adminRecord) {
         navigate('/admin');
       } else {
         navigate('/minha-conta');
       }
    }
  };

  const handleSocialLogin = async (provider) => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: window.location.origin + '/minha-conta' // Por padrão envia pra conta, mas o App fará o check no mount se necessário
      }
    });
    if (error) setErrorInput(error.message);
  };

  return (
    <div className="min-h-screen bg-fundo flex flex-col items-center justify-center px-4 relative overflow-hidden">
      {/* Glow Effects */}
      <div className="absolute top-0 left-0 w-full h-full opacity-30 pointer-events-none" style={{background: 'radial-gradient(circle at 10% 10%, #6667AB, transparent 50%), radial-gradient(circle at 90% 90%, #6667AB, transparent 50%)'}}></div>
      
      <img src="/logo camelia vetor (1).svg" onError={(e) => { e.target.src = '/logo.png' }} alt="Camélia Logo" className="h-20 mb-8 relative z-10 drop-shadow-md" />

      <div className="bg-white p-8 md:p-12 rounded-[40px] shadow-2xl w-full max-w-md relative z-10 border border-gray-50">
        <h2 className="text-3xl font-serif text-center font-bold text-secundaria mb-2">Minha Conta</h2>
        <p className="text-center text-sm text-gray-400 mb-10 font-medium">Acesse seu mundo Camélia Handcraft</p>
        
        {errorInput && (
          <div className="bg-red-50 text-red-500 text-xs p-4 rounded-2xl mb-8 text-center border border-red-100 font-bold uppercase tracking-wider">
            {errorInput === 'Invalid login credentials' ? 'E-mail ou senha incorretos' : errorInput}
          </div>
        )}

        {/* Social Logins */}
        <div className="space-y-4 mb-10">
          <button 
            onClick={() => handleSocialLogin('google')}
            className="w-full flex items-center justify-center gap-3 py-4 border border-gray-200 rounded-2xl hover:bg-gray-50 transition-all font-bold text-[11px] uppercase tracking-[2px] text-gray-600 shadow-sm"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" />
            Continuar com Google
          </button>
          
          <button 
            onClick={() => handleSocialLogin('facebook')}
            className="w-full flex items-center justify-center gap-3 py-4 bg-[#1877F2] text-white rounded-2xl hover:bg-[#166fe5] transition-all font-bold text-[11px] uppercase tracking-[2px] shadow-lg shadow-blue-500/20"
          >
            <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.248h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
            Continuar com Facebook
          </button>
          
          <button 
            onClick={() => handleSocialLogin('apple')}
            className="w-full flex items-center justify-center gap-3 py-4 bg-black text-white rounded-2xl hover:bg-gray-900 transition-all font-bold text-[11px] uppercase tracking-[2px] shadow-lg shadow-black/20"
          >
            <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.03 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-1.312-3.792-1.455-4.591-1.494-.8-.042-1.187-.03-1.652-.03c-.454 0-1.29.043-2.25.043h-.001zm1.026-4.437c1.192-1.453.844-3.403.844-3.403s-1.939.087-3.21 1.54c-1.192 1.453-.844 3.403-.844 3.403s1.939-.087 3.21-1.54z"/></svg>
            Continuar com iCloud
          </button>
        </div>

        <div className="flex items-center gap-4 mb-10 text-gray-300">
          <div className="h-[1px] bg-gray-100 flex-1"></div>
          <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400">Ou use seu e-mail</span>
          <div className="h-[1px] bg-gray-100 flex-1"></div>
        </div>

        <form onSubmit={handleLogin} className="flex flex-col gap-5">
          <input 
            type="email" 
            placeholder="E-mail" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            required 
            className="p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:border-primaria focus:bg-white transition-all font-sans text-sm"
          />
          <input 
            type="password" 
            placeholder="Senha" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
            className="p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:border-primaria focus:bg-white transition-all font-sans text-sm"
          />
          <button 
            type="submit" 
            disabled={loading}
            className="bg-primaria text-white font-bold py-5 rounded-2xl mt-4 hover:bg-[#5556A0] transition-all disabled:opacity-50 uppercase tracking-[3px] text-[11px] shadow-xl shadow-primaria/20 active:scale-95"
          >
            {loading ? 'Acessando...' : 'Entrar Agora'}
          </button>
        </form>
        
        <p className="text-center mt-8 text-[11px] text-gray-400 font-medium">
          Ainda não tem conta? <span className="text-primaria cursor-pointer hover:underline">Cadastre-se</span>
        </p>
      </div>
      <p className="text-xs text-gray-400 mt-12 relative z-10 font-bold uppercase tracking-widest">Camélia Handcraft Ateliê</p>
    </div>
  );
}

export default Login;