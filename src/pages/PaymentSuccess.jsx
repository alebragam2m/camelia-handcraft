import { formatCurrency } from '../utils/formatCurrency';
import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [loading, setLoading] = useState(true);
  const [sale, setSale] = useState(null);
  const [fetchError, setFetchError] = useState(false);

  useEffect(() => {
    if (sessionId) {
      fetchSaleBySession();
    } else {
      setLoading(false);
    }
  }, [sessionId]);

  const fetchSaleBySession = async () => {
    try {
      const { data, error } = await supabase
        .from('sales')
        .select('*, clients(full_name, email)')
        .eq('stripe_session_id', sessionId)
        .single();

      if (error) {
        console.error("Erro ao buscar venda pelo session_id:", error);
        setFetchError(true);
      } else if (data) {
        setSale(data);
      }
    } catch (err) {
      console.error("Erro inesperado ao buscar venda:", err);
      setFetchError(true);
    } finally {
      setLoading(false);
    }
  };

  // Nome do cliente — compatível com coluna 'nome' ou 'full_name'
  const clientName = sale?.clients?.full_name || 'Cliente';

  if (loading) {
    return (
      <div className="min-h-screen bg-fundo flex items-center justify-center">
        <div className="animate-pulse text-primaria font-serif text-xl">Confirmando seu pagamento...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-fundo flex items-center justify-center px-4 py-20">
      <div className="max-w-2xl w-full bg-white rounded-[40px] p-8 md:p-16 text-center shadow-2xl border border-gray-50 relative overflow-hidden">
        {/* Decorative element */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-primaria/5 rounded-full blur-3xl"></div>

        <div className="w-24 h-24 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-10 text-5xl shadow-inner">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-10 h-10">
            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
          </svg>
        </div>

        <h2 className="font-serif text-4xl font-bold text-secundaria mb-4">Pagamento Confirmado!</h2>
        <p className="text-gray-500 mb-10 text-lg font-light max-w-md mx-auto">
          Obrigada, <strong className="text-secundaria">{clientName}</strong>! Seu pedido já está em processamento no nosso ateliê.
        </p>

        {fetchError && (
          <div className="bg-yellow-50 border border-yellow-100 text-yellow-700 rounded-2xl p-4 mb-10 text-sm font-medium">
            Seu pagamento foi confirmado, mas não conseguimos carregar os detalhes do pedido agora.
            Acesse <Link to="/minha-conta" className="underline font-bold">Minha Conta</Link> para acompanhar.
          </div>
        )}

        {sale && (
          <div className="bg-gray-50 rounded-3xl p-6 mb-10 text-left border border-gray-100">
            <div className="flex justify-between mb-4 border-b border-gray-200 pb-4">
              <span className="text-[10px] uppercase font-bold text-gray-400 tracking-widest">Pedido</span>
              <span className="font-bold text-secundaria">#{String(sale.id).slice(0, 8)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[10px] uppercase font-bold text-gray-400 tracking-widest">Total Pago</span>
              <span className="font-serif text-xl font-bold text-primaria">{formatCurrency(sale.total_amount)}</span>
            </div>
          </div>
        )}

        <div className="space-y-4">
          <Link to="/minha-conta" className="block w-full bg-primaria text-white py-5 rounded-2xl font-bold uppercase tracking-[3px] text-xs shadow-xl shadow-primaria/20 hover:bg-[#5556A0] transition-all transform hover:-translate-y-1">
            Acompanhar Pedido
          </Link>
          <Link to="/" className="block text-gray-400 font-bold uppercase tracking-widest text-[10px] hover:text-secundaria transition-colors">
            Voltar para a Loja
          </Link>
        </div>

        <p className="mt-12 text-[10px] text-gray-300 uppercase font-bold tracking-[4px]">Camélia Handcraft Ateliê</p>
      </div>
    </div>
  );
}
