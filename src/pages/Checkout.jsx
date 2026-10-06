import { formatCurrency } from '../utils/formatCurrency';
import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useQuery } from '@tanstack/react-query';
import { BRAZIL_STATES as UFS, shippingCentsForState } from '../lib/shipping';


export default function Checkout() {
  const { cartItems, totalPrice, rememberCheckout, catalogReady, checkoutAttempt, beginCheckout, finishAttempt } = useCart();
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const { data: shippingRates, isPending: shippingLoading, error: shippingError, refetch: retryShipping } = useQuery({
    queryKey: ['shipping-rates', 'checkout'],
    queryFn: async ({ signal }) => {
      const { data, error } = await supabase.from('shipping_rates').select('state,cost').abortSignal(signal);
      if (error) throw new Error('Não foi possível consultar o frete.');
      return data || [];
    },
    refetchInterval: 30000,
  });


  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    telefone: '',
    cep: '',
    endereco: '',
    numero: '',
    bairro: '',
    cidade: '',
    estado: 'PA'
  });

  useEffect(() => { checkUser(); }, []);
  let shippingEstimate = null;
  let shippingMessage = shippingLoading ? 'Consultando frete...' : shippingError ? shippingError.message : '';
  if (shippingRates && !shippingError) {
    try { shippingEstimate = shippingCentsForState(shippingRates, formData.estado) / 100; }
    catch (error) { shippingMessage = error.message; }
  }

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUser(user);
      // Buscar dados do cliente se já existir
      const { data: client } = await supabase
        .from('clients')
        .select('full_name,email,phone,cep,address,address_number,neighborhood,city,state')
        .eq('email', user.email)
        .single();
      
      setFormData(prev => ({ ...prev, email: user.email || prev.email }));
      if (client) {
        setFormData(prev => ({
          ...prev,
          nome: client.full_name || '',
          email: client.email || '',
          telefone: client.phone || '',
          cep: client.cep || '', endereco: client.address || '', numero: client.address_number || '',
          bairro: client.neighborhood || '', cidade: client.city || '', estado: client.state || 'PA',
        }));
      }
    }
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFinishOrder = async (e) => {
    e.preventDefault();
    if (cartItems.length === 0 && !checkoutAttempt) return;
    if (!checkoutAttempt && (!catalogReady || cartItems.some(item => item.unavailable))) {
      alert('Aguarde a atualização do catálogo e ajuste os itens indisponíveis no carrinho.');
      return;
    }

    if (!checkoutAttempt && shippingEstimate === null) { alert(shippingMessage || 'Aguarde o cálculo de frete.'); return; }

    setLoading(true);

    try {
      const { data: authData, error: authError } = await supabase.auth.getSession();
      if (authError) throw new Error('Não foi possível verificar sua sessão. Entre novamente.');
      const attempt = await beginCheckout(formData, cartItems, authData.session?.user.id ?? null);
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(authData.session ? { Authorization: 'Bearer ' + authData.session.access_token } : {}) },
        body: JSON.stringify({
          requestId: attempt.requestId,
          cartItems: attempt.items.map(({ id, quantity, price }) => ({ id, quantity, price })),
          customer: attempt.customer,
        }),
      });

      const result = await response.json();
      if (result.terminal) await finishAttempt(attempt.requestId);
      if (!response.ok) throw new Error(result.error || 'Não foi possível preparar o pagamento.');
      if (!result.url || !result.sessionId) throw new Error('A sessão de pagamento não foi criada.');
      // Salva o snapshot, mas mantém os itens até a confirmação do pagamento.
      await rememberCheckout(result.sessionId, attempt.items, attempt.requestId);
      window.location.href = result.url;

    } catch (err) {
      console.error("Erro ao finalizar pedido:", err);
      alert("Houve um problema ao processar seu pedido: " + (err.message || "Tente novamente."));
    } finally {
      setLoading(false);
    }
  };

  const cancelAttempt = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;
      const response = await fetch('/api/cancel-checkout', { method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(data.session ? { Authorization: 'Bearer ' + data.session.access_token } : {}) },
        body: JSON.stringify({ requestId: checkoutAttempt.requestId }) });
      const result = await response.json();
      if (!response.ok || result.state !== 'expired') throw new Error(result.error || 'Cancelamento não confirmado.');
      await finishAttempt(checkoutAttempt.requestId);
    } catch (error) { alert(error.message || 'Não foi possível cancelar. Tente novamente.'); }
    finally { setLoading(false); }
  };

  if (checkoutAttempt) return (
    <div className="min-h-screen bg-fundo px-4 py-24"><div className="max-w-xl mx-auto bg-white p-8 rounded-2xl">
      <h1 className="font-serif text-2xl mb-4">Você tem uma tentativa em andamento</h1>
      <p className="mb-6">Retome o pagamento com os dados e itens enviados anteriormente. Para alterar o pedido, cancele esta tentativa primeiro. Os itens do carrinho serão preservados.</p>
      <button disabled={loading} onClick={handleFinishOrder} className="bg-primaria text-white rounded-xl p-4 w-full mb-4">{loading ? 'Consultando...' : 'Retomar pagamento'}</button>
      <button disabled={loading} onClick={cancelAttempt} className="border rounded-xl p-4 w-full">Cancelar tentativa e liberar reserva</button>
      <Link to="/contato" className="block mt-6 underline">Preciso de ajuda com esta tentativa</Link>
    </div></div>
  );

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-fundo flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <span className="text-6xl mb-6 grayscale opacity-20 block">🛍️</span>
          <h2 className="font-serif text-2xl font-bold text-secundaria mb-4">Seu carrinho está vazio</h2>
          <Link to="/produtos" className="text-primaria font-bold uppercase tracking-widest text-xs underline decoration-2 underline-offset-8">
            Ir para as Coleções
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-fundo min-h-screen py-20 px-4 md:px-0">
      <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-12 lg:gap-20">
        
        {/* Formulário de Entrega */}
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-6 bg-emerald-50/50 px-5 py-4 rounded-2xl border border-emerald-100/50 shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 text-emerald-600"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" /></svg>
            <div>
              <p className="text-sm font-bold tracking-wide text-emerald-800">Checkout Seguro (SSL de Ponta a Ponta)</p>
              <p className="text-xs text-emerald-600 font-medium">Os seus pagamentos são processados pela Stripe. Dados de cartão não são armazenados.</p>
            </div>
          </div>

          {(!catalogReady || cartItems.some(item => item.unavailable)) && <p role="alert" className="mb-4 rounded-xl bg-amber-50 p-4 text-sm text-amber-900">A compra está aguardando preços e disponibilidade atualizados. Confira os itens no carrinho.</p>}
          <h2 className="font-serif text-3xl font-bold text-secundaria mb-4 border-b border-gray-100 pb-6">Detalhes de Entrega</h2>
          {!user && (
            <div className="bg-primaria/5 p-4 rounded-2xl mb-8 flex justify-between items-center border border-primaria/10">
              <span className="text-[11px] text-primaria font-bold uppercase tracking-widest">Já é cliente?</span>
              <Link to="/login" state={{ from: '/checkout' }} className="text-[11px] font-bold uppercase tracking-widest bg-primaria text-white px-4 py-2 rounded-lg hover:bg-secundaria transition-all">Entrar agora</Link>
            </div>
          )}

          <form onSubmit={handleFinishOrder} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2 space-y-2">
              <label className="text-[10px] uppercase font-bold text-gray-400 tracking-widest">Nome Completo</label>
              <input required name="nome" value={formData.nome} onChange={handleInputChange} className="w-full bg-white border border-gray-100 p-4 rounded-xl shadow-sm focus:border-primaria transition-colors outline-none text-secundaria" />
            </div>
            
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold text-gray-400 tracking-widest">E-mail</label>
              <input required readOnly={!!user} type="email" name="email" value={formData.email} onChange={handleInputChange} className="w-full bg-white border border-gray-100 p-4 rounded-xl shadow-sm focus:border-primaria transition-colors outline-none text-secundaria" />
            </div>
            
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold text-gray-400 tracking-widest">WhatsApp</label>
              <input required name="telefone" value={formData.telefone} onChange={handleInputChange} placeholder="(00) 00000-0000" className="w-full bg-white border border-gray-100 p-4 rounded-xl shadow-sm focus:border-primaria transition-colors outline-none text-secundaria" />
            </div>

            <div className="md:col-span-1 space-y-2">
              <label className="text-[10px] uppercase font-bold text-gray-400 tracking-widest">CEP (Opcional)</label>
              <input name="cep" value={formData.cep} onChange={handleInputChange} className="w-full bg-white border border-gray-100 p-4 rounded-xl shadow-sm focus:border-primaria transition-colors outline-none text-secundaria" />
            </div>

            <div className="md:col-span-1 space-y-2">
              <label className="text-[10px] uppercase font-bold text-gray-400 tracking-widest">Cidade</label>
              <input required name="cidade" value={formData.cidade} onChange={handleInputChange} className="w-full bg-white border border-gray-100 p-4 rounded-xl shadow-sm focus:border-primaria transition-colors outline-none text-secundaria" />
            </div>

            <div className="md:col-span-1 space-y-2">
              <label className="text-[10px] uppercase font-bold text-gray-400 tracking-widest">Estado</label>
              <select required name="estado" value={formData.estado} onChange={handleInputChange} className="w-full bg-white border border-gray-100 p-4 rounded-xl shadow-sm focus:border-primaria transition-colors outline-none text-secundaria">
                {UFS.map(uf => <option key={uf} value={uf}>{uf}</option>)}
              </select>
            </div>

            <div className="md:col-span-2 space-y-2">
              <label className="text-[10px] uppercase font-bold text-gray-400 tracking-widest">Endereço de Entrega</label>
              <input required name="endereco" value={formData.endereco} onChange={handleInputChange} placeholder="Rua, Número, Complemento..." className="w-full bg-white border border-gray-100 p-4 rounded-xl shadow-sm focus:border-primaria transition-colors outline-none text-secundaria" />
            </div>

            <div className="md:col-span-2 pt-10">
              <button disabled={loading || shippingEstimate === null || !catalogReady || cartItems.some(item => item.unavailable)} className="w-full bg-secundaria text-white font-bold py-6 rounded-2xl shadow-xl hover:bg-black transition-all uppercase tracking-[4px] text-sm active:scale-[0.98] disabled:bg-gray-400 flex items-center justify-center gap-3">
                {loading ? "Preparando Pagamento..." : (
                  <>
                    Ir para o Pagamento
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" /></svg>
                  </>
                )}
              </button>
              <p className="text-[10px] text-gray-400 text-center mt-6 uppercase font-bold tracking-widest">
                Pagamento com cartão processado pela Stripe.
              </p>
            </div>
          </form>
        </div>

        {/* Resumo do Pedido (Sticky Sidebar) */}
        <div className="w-full lg:w-96">
          <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-50 sticky top-32">
            <h3 className="font-serif text-xl font-bold text-secundaria mb-8">Resumo</h3>
            <div className="space-y-6 mb-8 overflow-y-auto max-h-64 pr-2 custom-scrollbar">
              {cartItems.map(item => (
                <div key={item.id} className="flex justify-between items-center text-sm">
                  <span className="text-gray-500 font-light flex-1 pr-4">
                    <strong className="text-secundaria font-bold">{item.quantity}x</strong> {item.nome}
                  </span>
                  <span className="font-bold text-secundaria">{formatCurrency(Number(item.price) * item.quantity)}</span>
                </div>
              ))}
            </div>
            
            <div className="border-t border-gray-100 pt-8 space-y-4">
              <div className="flex justify-between items-center text-gray-400 uppercase tracking-widest text-[10px] font-bold">
                <span>Itens</span>
                <span>{cartItems.length}</span>
              </div>
              <div className="flex justify-between items-center text-gray-400 uppercase tracking-widest text-[10px] font-bold">
                <span>Entrega ({formData.estado})</span>
                {shippingEstimate === null ? <span>A confirmar</span> : shippingEstimate > 0
                  ? <span className="text-secundaria font-bold">{formatCurrency(shippingEstimate)}</span>
                  : <span className="text-green-500 font-bold uppercase">Grátis</span>}
              </div>
              <div className="flex justify-between items-center pt-4">
                <span className="font-serif text-3xl font-bold text-primaria">Total</span>
                <span className="font-serif text-3xl font-bold text-primaria">{shippingEstimate === null ? 'A confirmar' : formatCurrency(totalPrice + shippingEstimate)}</span>
              </div>
              {shippingMessage && <p role="alert" className="text-sm text-amber-800">{shippingMessage} <button type="button" onClick={() => retryShipping()} className="underline">Consultar novamente</button></p>}
              <p className="text-xs text-gray-500 text-center">Frete estimado — o valor final é confirmado no pagamento.</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
