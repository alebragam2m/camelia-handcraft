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
