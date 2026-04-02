import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '../supabase';

function ProtectedRoute({ children }) {
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Timeout de segurança: se o Supabase demorar mais de 5s, não trava a tela
    const timeoutId = setTimeout(() => {
      console.warn("Timeout na verificação de sessão — redirecionando para login.");
      setLoading(false);
    }, 5000);

    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setIsAuthenticated(!!session);
      } catch (err) {
        console.error("Erro ao verificar sessão:", err);
        setIsAuthenticated(false);
      } finally {
        clearTimeout(timeoutId);
        setLoading(false);
      }
    };

    checkAuth();

    // Listener para mudanças de login/logout no Supabase
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
      setLoading(false);
    });

    return () => {
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8F8FC', flexDirection: 'column', gap: '12px' }}>
        <div style={{ width: '32px', height: '32px', border: '3px solid #6667AB', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}></div>
        <p style={{ color: '#6667AB', fontWeight: 'bold', fontSize: '12px', letterSpacing: '2px', textTransform: 'uppercase' }}>Verificando acesso...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default ProtectedRoute;