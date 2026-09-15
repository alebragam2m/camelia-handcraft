import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSession } from '../hooks/useSession';

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { session, loading } = useSession();
  const location = useLocation();
  if (loading) return <div role="status" className="min-h-screen flex items-center justify-center">Verificando acesso...</div>;
  if (!session) return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  return <>{children}</>;
}
