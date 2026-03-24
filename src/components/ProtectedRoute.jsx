import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '../supabase';

function ProtectedRoute({ children }) {
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
      setLoading(false);
    };

    checkAuth();

    // Listener para mudanças de login/logout no Supabase
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8F8FC' }}>
        <p style={{ color: '#6667AB', fontWeight: 'bold' }}>Verificando segurança...</p>
      </div>
    );
  }

  // Se a verificação terminou e não há sessão no Supabase, manda pra /login com replace
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Passou o bloqueio, exibe o painel ou módulo protegido
  return children;
}

export default ProtectedRoute;