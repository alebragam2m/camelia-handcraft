// ─── Limpeza defensiva de localStorage ───────────────────────────────────────
// Roda de forma síncrona antes do React renderizar qualquer coisa.
// Cada deploy na Vercel injeta um VERCEL_GIT_COMMIT_SHA único via vite define,
// garantindo que usuários com estado corrompido de deploys anteriores sejam
// limpos automaticamente na primeira visita após o deploy.
declare const __VITE_DEPLOY_STAMP__: string;
try {
  const stamp = localStorage.getItem('deploy_stamp');
  if (stamp !== __VITE_DEPLOY_STAMP__) {
    Object.keys(localStorage).forEach(k => localStorage.removeItem(k));
    localStorage.setItem('deploy_stamp', __VITE_DEPLOY_STAMP__);
  }
} catch (_) {}
// ─────────────────────────────────────────────────────────────────────────────

import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/query-client';
import ErrorBoundary from './components/ErrorBoundary';
import './index.css';
import App from './App';

/**
 * PONTO DE ENTRADA DO MOTOR CAMÉLIA (MISSION CRITICAL)
 *
 * PILLAR 2: TanStack Query (Provedor Global)
 * PILLAR 4: Error Boundary (Escudo Root)
 */
const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Falha crítica: Elemento root não encontrado no HTML.');

createRoot(rootElement).render(
  <StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </ErrorBoundary>
  </StrictMode>
);
