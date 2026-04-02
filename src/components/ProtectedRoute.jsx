import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '../supabase';

function ProtectedRoute({ children }) {
  // null = ainda verificando, true = autenticado, false = não autenticado
  const [authState, setAuthState] = useState(null);

  useEffect(() => {
    // onAuthStateChange com INITIAL_SESSION é o único evento confiável
    // para detectar sessão restaurada do localStorage após um Refresh (F5)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'INITIAL_SESSION') {
        // Sessão inicial verificada — pode ou não ter usuário
        setAuthState(!!session);
      } else if (event === 'SIGNED_IN') {
        setAuthState(true);
      } else if (event === 'SIGNED_OUT') {
        setAuthState(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Aguarda a sessão ser verificada — sem timeout, sem redirecionamento precipitado
  if (authState === null) {
    return (
      <div style={{ display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8F8FC', flexDirection: 'column', gap: '12px' }}>
        <div style={{ width: '32px', height: '32px', border: '3px solid #6667AB', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}></div>
        <p style={{ color: '#6667AB', fontWeight: 'bold', fontSize: '12px', letterSpacing: '2px', textTransform: 'uppercase' }}>Verificando acesso...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!authState) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default ProtectedRoute;