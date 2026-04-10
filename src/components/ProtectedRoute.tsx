import React, { useEffect, useState, ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

interface ProtectedRouteProps {
  children: ReactNode;
}

/**
 * MOTOR DE PROTEÇÃO (MISSION CRITICAL)
 * 
 * PILLAR 1: TypeScript Estrito
 * PILLAR 4: Error Handling (Timeout de Sessão)
 */
export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Apenas getSession() — sem onAuthStateChange aqui.
    // App.tsx já tem um onAuthStateChange global registrado.
    // Dois listeners simultâneos competiam pelo lock do Supabase Auth.
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setIsAuthenticated(!!session);
      } catch (err) {
        console.error("[Auth] Erro crítico de sessão:", err);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8F8FC] gap-4">
        <div className="w-10 h-10 border-4 border-primaria border-t-transparent rounded-full animate-spin"></div>
        <p className="text-primaria font-bold text-[10px] uppercase tracking-[0.3em] animate-pulse">Verificando Credenciais...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
