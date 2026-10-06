import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { formatCurrency } from '../utils/formatCurrency';

const MESSAGES = {
  paid: ['Pagamento confirmado!', 'Seu pedido está confirmado e será preparado pelo nosso ateliê.'],
  pending: ['Aguardando confirmação', 'Seu pagamento ainda não foi confirmado. Esta página consulta o andamento automaticamente por até um minuto.'],
  cancelled: ['Pedido cancelado', 'Este pedido foi cancelado. Se houve cobrança, entre em contato para acompanhar o reembolso.'],
  expired: ['Pagamento expirado', 'O prazo desta sessão terminou. Seu carrinho foi preservado para uma nova tentativa.'],
};

export default function PaymentSuccess() {
  const [params] = useSearchParams();
  const sessionId = params.get('session_id');
  const { completeCheckout } = useCart();
  const [cartError, setCartError] = useState(false);
  const { data, error, isPending, isFetching, refetch } = useQuery({
    queryKey: ['payment-status', sessionId], enabled: !!sessionId,
    queryFn: async ({ signal }) => {
      const response = await fetch('/api/payment-status', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }), signal,
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Não foi possível consultar o pagamento.');
      return result;
    },
    retry: false, staleTime: 0,
    refetchInterval: query => query.state.data?.status === 'pending' && query.state.dataUpdateCount + query.state.errorUpdateCount < 12 ? 5000 : false,
  });
  useEffect(() => {
    if (data?.status === 'paid') {
      completeCheckout(sessionId).catch(() => setCartError(true));
    }
  }, [data?.status, sessionId, completeCheckout]);
  const [title, message] = !sessionId
    ? ['Sessão não informada', 'Abra o link de retorno do pagamento para consultar seu pedido.']
    : error ? ['Não foi possível confirmar', error.message]
    : isPending ? ['Consultando pagamento', 'Aguarde enquanto verificamos seu pedido.']
    : MESSAGES[data?.status] || ['Confirmação indisponível', 'Tente consultar novamente em instantes.'];
  const paid = !error && data?.status === 'paid';
  return (
    <div className="min-h-screen bg-fundo flex items-center justify-center px-4 py-20">
      <div className="max-w-2xl w-full bg-white rounded-3xl p-8 md:p-16 text-center shadow-xl">
        <div aria-hidden="true" className={paid ? 'text-5xl text-green-600 mb-6' : 'text-5xl text-amber-600 mb-6'}>{paid ? '✓' : '⏳'}</div>
        <h1 className="font-serif text-3xl font-bold text-secundaria mb-4">{title}</h1>
        <p role="status" className="text-gray-600 mb-8">{message}</p>
        {cartError && <p role="alert" className="text-amber-800 mb-6">O pagamento foi confirmado, mas não conseguimos atualizar seu carrinho. Confira os itens antes de comprar novamente.</p>}
        {data?.order && <div className="bg-gray-50 rounded-2xl p-6 mb-8 text-left">
          <p>Pedido #{String(data.order.id).slice(0, 8)}</p>
          <p className="font-bold mt-2">{paid ? 'Total pago: ' : 'Total do pedido: '}{formatCurrency(data.order.total)}</p>
        </div>}
        {sessionId && !paid && <button onClick={() => refetch()} disabled={isFetching} className="w-full border border-primaria rounded-xl p-4 mb-4 text-primaria font-bold disabled:opacity-50">{isFetching ? 'Consultando...' : 'Consultar novamente'}</button>}
        <Link to="/minha-conta" className="block bg-primaria text-white rounded-xl p-4 mb-4 font-bold">Pedidos da minha conta</Link>
        <Link to="/contato" className="block text-primaria mb-4">Comprou sem entrar? Fale conosco com o número do pedido.</Link>
        <Link to={paid ? '/produtos' : '/checkout'} className="block text-gray-600">{paid ? 'Voltar para a loja' : 'Voltar ao carrinho'}</Link>
      </div>
    </div>
  );
}
