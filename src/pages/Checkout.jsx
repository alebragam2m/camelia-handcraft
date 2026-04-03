import { formatCurrency } from '../utils/formatCurrency';
import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';

export default function Checkout() {
  const { cartItems, totalPrice, clearCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

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

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUser(user);
      // Buscar dados do cliente se já existir
      const { data: client } = await supabase
        .from('clients')
        .select('*')
        .eq('email', user.email)
        .single();
      
      if (client) {
        setFormData({
          nome: client.nome || '',
          email: client.email || '',
          telefone: client.telefone || '',
          cep: client.cep || '',
          endereco: client.address || '',
          numero: '',
          bairro: client.neighborhood || '',
          cidade: client.city || '',
          estado: client.state || 'PA'
        });
      }
    }
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFinishOrder = async (e) => {
    e.preventDefault();
    if (cartItems.length === 0) return;

    setLoading(true);
    try {
      // 1. Criar ou atualizar cliente no CRM
      const { data: client, error: clientErr } = await supabase
        .from('clients')
        .upsert({ 
          nome: formData.nome, 
          email: formData.email, 
          telefone: formData.telefone,
          address: formData.endereco,
          neighborhood: formData.bairro,
          city: formData.cidade,
          state: formData.estado
        }, { onConflict: 'email' })
        .select()
        .single();

      if (clientErr) throw clientErr;

      // 2. Criar a Venda no Supabase (Status Pendente)
      const { data: sale, error: saleErr } = await supabase
        .from('sales')
        .insert({
          client_id: client.id,
          client_name: formData.nome,
          payment_method: 'Stripe/Cartão-PIX',
          total_amount: totalPrice,
          total_cost: cartItems.reduce((acc, item) => acc + (Number(item.cost || 0) * item.quantity), 0),
          status: 'Pendente',
          shipping_cost: 0 
        })
        .select()
        .single();

      if (saleErr) throw saleErr;

      // 2.1 Inserir itens da venda (Vínculo para baixa de estoque futura)
      const saleItems = cartItems.map(item => ({
        sale_id: sale.id,
        product_id: item.id,
        quantity: item.quantity,
        unit_price: Number(item.price),
        unit_cost: Number(item.cost || 0),
        subtotal: Number(item.price) * item.quantity
      }));

      const { error: itemsErr } = await supabase.from('sale_items').insert(saleItems);
      if (itemsErr) throw itemsErr;

      // 3. Chamar nossa API Vercel para criar sessão do Stripe
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          saleId: sale.id,
          cartItems: cartItems,
          customerEmail: formData.email
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Erro no Servidor (${response.status}): ${errorData || "Sem detalhes da falha."}`);
      }

      const { url } = await response.json();
      
      if (url) {
        clearCart(); // Limpa carrinho antes de ir pro Stripe
        window.location.href = url; // Redireciona para o checkout do Stripe
      } else {
        throw new Error("A API não retornou uma URL de pagamento válida.");
      }

    } catch (err) {
      console.error("Erro ao finalizar pedido:", err);
      alert("Houve um problema ao processar seu pedido: " + (err.message || "Tente novamente."));
    } finally {
      setLoading(false);
    }
  };

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

          <h2 className="font-serif text-3xl font-bold text-secundaria mb-4 border-b border-gray-100 pb-6">Detalhes de Entrega</h2>
          {!user && (
            <div className="bg-primaria/5 p-4 rounded-2xl mb-8 flex justify-between items-center border border-primaria/10">
              <span className="text-[11px] text-primaria font-bold uppercase tracking-widest">Já é cliente?</span>
              <Link to="/login" className="text-[11px] font-bold uppercase tracking-widest bg-primaria text-white px-4 py-2 rounded-lg hover:bg-secundaria transition-all">Entrar agora</Link>
            </div>
          )}

          <form onSubmit={handleFinishOrder} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2 space-y-2">
              <label className="text-[10px] uppercase font-bold text-gray-400 tracking-widest">Nome Completo</label>
              <input required name="nome" value={formData.nome} onChange={handleInputChange} className="w-full bg-white border border-gray-100 p-4 rounded-xl shadow-sm focus:border-primaria transition-colors outline-none text-secundaria" />
            </div>
            
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold text-gray-400 tracking-widest">E-mail</label>
              <input required type="email" name="email" value={formData.email} onChange={handleInputChange} className="w-full bg-white border border-gray-100 p-4 rounded-xl shadow-sm focus:border-primaria transition-colors outline-none text-secundaria" />
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

            <div className="md:col-span-2 space-y-2">
              <label className="text-[10px] uppercase font-bold text-gray-400 tracking-widest">Endereço de Entrega</label>
              <input required name="endereco" value={formData.endereco} onChange={handleInputChange} placeholder="Rua, Número, Complemento..." className="w-full bg-white border border-gray-100 p-4 rounded-xl shadow-sm focus:border-primaria transition-colors outline-none text-secundaria" />
            </div>

            <div className="md:col-span-2 pt-10">
              <button disabled={loading} className="w-full bg-secundaria text-white font-bold py-6 rounded-2xl shadow-xl hover:bg-black transition-all uppercase tracking-[4px] text-sm active:scale-[0.98] disabled:bg-gray-400 flex items-center justify-center gap-3">
                {loading ? "Preparando Pagamento..." : (
                  <>
                    Ir para o Pagamento
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" /></svg>
                  </>
                )}
              </button>
              <p className="text-[10px] text-gray-400 text-center mt-6 uppercase font-bold tracking-widest">
                Ambiente de pagamento seguro via Stripe & PIX.
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
                <span>Entrega</span>
                <span className="text-green-500 font-bold uppercase">Grátis</span>
              </div>
              <div className="flex justify-between items-center pt-4">
                <span className="font-serif text-3xl font-bold text-primaria">Total</span>
                <span className="font-serif text-3xl font-bold text-primaria">{formatCurrency(totalPrice)}</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
