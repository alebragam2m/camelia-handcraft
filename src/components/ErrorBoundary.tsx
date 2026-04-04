import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * COMPONENTE DE ESCUDO (MISSION CRITICAL)
 * 
 * PILLAR 4: Error Boundaries
 * Impede que uma falha em um módulo (ex: Produto) derrube o site inteiro (Tela Branca).
 */
class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary] Falha Crítica Detectada:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="min-h-[400px] flex flex-col items-center justify-center p-8 text-center bg-rose-50 rounded-3xl border-2 border-dashed border-rose-200 m-4">
          <span className="text-6xl mb-4">⚠️</span>
          <h2 className="text-2xl font-serif font-bold text-rose-900 mb-2">Ops! Algo deu errado.</h2>
          <p className="text-rose-700/70 text-sm max-w-md mx-auto mb-6">
            O motor do Camélia Handcraft detectou uma falha de renderização, mas não se preocupe: o resto do sistema continua operacional.
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-rose-600 text-white px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-rose-700 transition-colors shadow-lg"
          >
            Tentar Restaurar Página
          </button>
          {process.env.NODE_ENV === 'development' && (
            <pre className="mt-8 p-4 bg-black text-rose-400 text-[10px] text-left rounded-lg overflow-auto max-w-full">
              {this.state.error?.toString()}
            </pre>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
