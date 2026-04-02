import { formatCurrency } from '../utils/formatCurrency';
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { useNavigate } from 'react-router-dom';
import FinanceModule from '../components/FinanceModule';
import StockHistoryModule from '../components/StockHistoryModule';
import SuppliersModule from '../components/SuppliersModule';
import ProductsModule from '../components/ProductsModule';
import UsersModule from '../components/UsersModule';
import { db } from '../services/db';

import { useData } from '../context/DataContext';

function AdminDashboard() {
  const { isOnline } = useData();

  const [activeTab, setActiveTab] = useState('visao_geral');
  const [userRole, setUserRole] = useState('Vendedor');
  const isAdmin = userRole === 'Admin';
  
  // --- ESTADOS DE DADOS (Restaurados para Local) ---
  const [produtos, setProdutos] = useState([]);
  const [vendas, setVendas] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastSync, setLastSync] = useState(null);

  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [isClientDossierOpen, setIsClientDossierOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const navigate = useNavigate();

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const [p, s, c] = await Promise.all([
        db.getProducts(),
        db.getSales(),
        db.getClients()
      ]);
      setProdutos(p);
      setVendas(s);
      setClientes(c);
      setLastSync(new Date());
    } catch (err) {
      console.error("Erro ao carregar dados:", err);
    } finally {
      setLoading(false);
    }
  };

  const detectUserRole = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { navigate('/login'); return; }
    const { data } = await supabase.from('admin_users').select('role').eq('auth_user_id', user.id).single();
    if (!data) { navigate('/'); return; }
    setUserRole(data.role);
  };

  const [clientForm, setClientForm] = useState({
    full_name: '', rg: '', cpf: '', cep: '', address: '', address_number: '', address_complement: '', 
    neighborhood: '', city: '', state: '', phone: '', is_whatsapp: true, whatsapp: '',
    email: '', birth_date: '', is_vip: false, internal_notes: ''
  });
  const defaultClientForm = { ...clientForm };
  const [selectedClient, setSelectedClient] = useState(null); 
  const [isSavingClient, setIsSavingClient] = useState(false);
  const [aniversariantes, setAniversariantes] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  const handleCepChange = async (e, isUpdate = false) => {
    let cep = e.target.value.replace(/\D/g, '');
    if (isUpdate) setSelectedClient({...selectedClient, cep: e.target.value});
    else setClientForm({...clientForm, cep: e.target.value});

    if (cep.length === 8) {
      try {
        const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
        const data = await res.json();
        if (!data.erro) {
           const addressData = { cep: data.cep, address: data.logradouro, neighborhood: data.bairro, city: data.localidade, state: data.uf };
           if (isUpdate) setSelectedClient(prev => ({ ...prev, ...addressData }));
           else setClientForm(prev => ({ ...prev, ...addressData }));
        }
      } catch (err) { console.error("ViaCEP error:", err); }
    }
  };

  const [formData, setFormData] = useState({ nome: '', price: '', cost: '', category: 'Porta Guardanapos', colecao: 'Avulso', stock: '', description: '' });
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isSavingProduct, setIsSavingProduct] = useState(false);
  const [isSavingSale, setIsSavingSale] = useState(false);
  const [saleForm, setSaleForm] = useState({ client_id: '', payment_method: 'Pix', shipping_cost: '', discount: '', status: 'Paga' });
  const [cartItems, setCartItems] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedQuantity, setSelectedQuantity] = useState('');

  const checkBirthdays = (clientsArray) => {
    const today = new Date();
    const currentM = today.getMonth() + 1;
    const currentD = today.getDate();
    const bd = clientsArray.filter(c => {
       if(!c.birth_date) return false;
       const p = c.birth_date.split('-');
       const m = parseInt(p[1]);
       const d = parseInt(p[2]);
       return m === currentM && (d >= currentD && d <= currentD + 7);
    });
    setAniversariantes(bd);
  };

  useEffect(() => {
    if (clientes.length > 0) checkBirthdays(clientes);
    if (produtos.length > 0 && !selectedProductId) {
       const firstRealProduct = produtos.find(p => !p.is_insumo);
       if (firstRealProduct) setSelectedProductId(firstRealProduct.id);
    }
  }, [clientes, produtos]);

  useEffect(() => { 
    detectUserRole(); 
    fetchData();
  }, []);

  const handleLogout = async () => { await supabase.auth.signOut(); navigate('/login'); };
  const handleFileChange = (e) => { if (e.target.files) setSelectedFiles(Array.from(e.target.files).slice(0, 4)); };

  const handleRegisterClient = async (e) => {
    e.preventDefault();
    setIsSavingClient(true);
    try {
      await db.upsertClient({ ...clientForm, whatsapp: clientForm.is_whatsapp ? clientForm.phone : clientForm.whatsapp });
      setIsClientModalOpen(false);
      setClientForm(defaultClientForm);
      fetchData();
    } catch (err) { alert("Erro ao registrar cliente: " + err.message); }
    setIsSavingClient(false);
  };

  const openClientDossier = (client) => { setSelectedClient(client); setIsClientDossierOpen(true); };

  const handleUpdateClient = async (e) => {
    e.preventDefault();
    setIsSavingClient(true);
    try {
      await db.upsertClient(selectedClient, selectedClient.id);
      setIsClientDossierOpen(false);
      fetchData();
    } catch (err) { alert("Erro no update: " + err.message); }
    setIsSavingClient(false);
  };

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    setIsSavingProduct(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const photoUrls = [];
      for (const file of selectedFiles) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `products/${fileName}`;
        const { error: uploadError } = await supabase.storage.from('products').upload(filePath, file);
        if (uploadError) throw uploadError;
        const { data: { publicUrl } } = supabase.storage.from('products').getPublicUrl(filePath);
        photoUrls.push(publicUrl);
      }
      await db.upsertProduct({ ...formData, images: photoUrls, user_id: user.id });
      setIsProductModalOpen(false);
      setFormData({ nome: '', price: '', cost: '', category: 'Porta Guardanapos', colecao: 'Avulso', stock: '', description: '' });
      setSelectedFiles([]);
      fetchData();
    } catch (err) { alert("Erro ao criar produto: " + err.message); }
    setIsSavingProduct(false);
  };

  const stripLeadingZeros = (val) => val === '' ? '' : Number(val).toString();

  const addToSaleCart = () => {
    if (!selectedProductId || !selectedQuantity) return;
    const p = produtos.find(x => x.id === selectedProductId);
    if (!p) return;
    const existing = cartItems.find(item => item.id === p.id);
    if (existing) {
      setCartItems(cartItems.map(item => item.id === p.id ? { ...item, quantity: (Number(item.quantity) || 0) + (Number(selectedQuantity) || 0) } : item));
    } else {
      setCartItems([...cartItems, { ...p, quantity: selectedQuantity }]);
    }
  };

  const removeSaleCartItem = (id) => setCartItems(cartItems.filter(i => i.id !== id));

  const subtotal = cartItems.reduce((acc, item) => acc + (Number(item.price) * Number(item.quantity)), 0);
  const discountAmount = (Number(saleForm.discount || 0) / 100) * subtotal;
  const finalSaleTotal = subtotal - discountAmount + Number(saleForm.shipping_cost || 0);

  const handleRegisterSale = async (e) => {
    e.preventDefault();
    if (cartItems.length === 0) return;
    setIsSavingSale(true);
    try {
      const itemsToSave = cartItems.map(item => ({
        product_id: item.id,
        quantity: item.quantity,
        price_at_time: item.price,
        cost_at_time: item.cost || 0
      }));
      const totalCost = cartItems.reduce((acc, item) => acc + (Number(item.cost || 0) * Number(item.quantity)), 0);
      await db.createSale({
        client_id: saleForm.client_id,
        payment_method: saleForm.payment_method,
        total_amount: finalSaleTotal,
        total_cost: totalCost,
        shipping_cost: saleForm.shipping_cost || 0,
        discount: discountAmount,
        status: saleForm.status
      }, itemsToSave);
      setIsSaleModalOpen(false);
      setCartItems([]);
      setSaleForm({ client_id: '', payment_method: 'Pix', shipping_cost: '', discount: '', status: 'Paga' });
      fetchData();
    } catch (err) { alert("Falha na Venda: " + err.message); }
    setIsSavingSale(false);
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const currM = new Date().getMonth();
  const currY = new Date().getFullYear();
  const vMes = vendas.filter(v => { const d = new Date(v.created_at); return d.getMonth() === currM && d.getFullYear() === currY; });
  const fatDia = vendas.filter(v => v.created_at.startsWith(todayStr)).reduce((acc, v) => acc + Number(v.total_amount), 0);
  const fatMes = vMes.reduce((acc, v) => acc + Number(v.total_amount), 0);
  const lucroMes = vMes.reduce((acc, v) => acc + (Number(v.total_amount) - Number(v.total_cost || 0)), 0);
  const totCartao = vMes.filter(v => v.payment_method?.includes('Cartão')).reduce((acc, v) => acc + Number(v.total_amount), 0);
  const totPix = vMes.filter(v => v.payment_method?.includes('Pix')).reduce((acc, v) => acc + Number(v.total_amount), 0);
  const descontosMes = vMes.reduce((acc, k) => acc + Number(k.discount || 0), 0);
  const receitaTotal = vendas.reduce((acc, v) => acc + Number(v.total_amount), 0);
  const qtdVendasDia = vendas.filter(v => v.created_at.startsWith(todayStr)).length;
  const qtdVendasMes = vMes.length;

  if (loading && produtos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-[#F8F8FC] gap-4">
          <div className="w-12 h-12 border-4 border-[#333333]/10 border-t-[#333333] rounded-full animate-spin"></div>
          <p className="text-[#333333] font-serif font-bold text-lg animate-pulse tracking-widest uppercase">Carregando Camélia...</p>
      </div>
    );
  }

  return (
    <div className="bg-[#F8F8FC] min-h-screen text-[#333333] font-sans selection:bg-[#7262F1] selection:text-white">
      
      <header className="bg-white border-b border-gray-100 sticky top-0 z-[100] px-6 py-4 flex justify-between items-center shadow-sm backdrop-blur-md bg-white/95">
         <div className="flex items-center gap-4">
            {/* Hamburger para Mobile */}
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
              className="md:hidden p-2 text-[#333333] hover:bg-gray-50 rounded-lg flex items-center justify-center transition-colors"
            >
               <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
               </svg>
            </button>
             <div className="flex items-center gap-4 cursor-pointer group" onClick={() => navigate('/')}>
                <div className="flex items-center gap-3">
                   <img src="/logo camelia vetor (1).svg" alt="Camélia Handcraft" className="h-10 md:h-14 w-auto object-contain" />
                </div>
             </div>
            <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-gray-50 border border-gray-100 rounded-full ml-2">
               <div className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-red-500 animate-pulse'}`}></div>
               <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-gray-400">
                  {isOnline ? 'CONEXÃO ESTÁVEL' : 'OFFLINE'}
               </span>
            </div>
         </div>

         <div className="flex items-center gap-4">
            {lastSync && <span className="hidden lg:block text-[9px] text-gray-400 font-bold uppercase tracking-widest">Atualizado: {lastSync.toLocaleTimeString()}</span>}
            <button onClick={handleLogout} className="px-4 py-2 bg-red-50 text-red-500 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all">Sair</button>
         </div>
      </header>

      <div className="flex">
        {/* Sidebar Overlay Mobile */}
        {isSidebarOpen && <div className="fixed inset-0 bg-secundaria/50 backdrop-blur-sm z-[70] md:hidden" onClick={() => setIsSidebarOpen(false)}></div>}

        <aside className={`w-72 bg-[#2D2B52] h-[calc(100vh-64px)] fixed flex flex-col p-6 z-[80] transition-transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 shadow-2xl`}>
           <div className="mb-10 px-2">
              <img src="/logo camelia vetor (1).svg" alt="Camélia Handcraft" className="h-12 w-auto brightness-0 invert" />
           </div>

           <nav className="space-y-1 flex-1 overflow-y-auto pr-2 custom-scrollbar">
              <button onClick={() => { setActiveTab('visao_geral'); setIsSidebarOpen(false); }} className={`w-full text-left px-4 py-3 rounded-xl font-bold text-[11px] uppercase tracking-[0.1em] transition-all flex items-center gap-3 ${activeTab === 'visao_geral' ? 'bg-[#5B4BBF] text-white shadow-lg' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}>
                 <span className="text-sm">📊</span> Visão Geral
              </button>
              <button onClick={() => { setActiveTab('produtos'); setIsSidebarOpen(false); }} className={`w-full text-left px-4 py-3 rounded-xl font-bold text-[11px] uppercase tracking-[0.1em] transition-all flex items-center gap-3 ${activeTab === 'produtos' ? 'bg-[#5B4BBF] text-white shadow-lg' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}>
                 <span className="text-sm">📦</span> Produtos
              </button>
              <button onClick={() => { setActiveTab('estoque'); setIsSidebarOpen(false); }} className={`w-full text-left px-4 py-3 rounded-xl font-bold text-[11px] uppercase tracking-[0.1em] transition-all flex items-center gap-3 ${activeTab === 'estoque' ? 'bg-[#5B4BBF] text-white shadow-lg' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}>
                 <span className="text-sm">📦</span> Estoque (PCP)
              </button>
              <button onClick={() => { setActiveTab('clientes'); setIsSidebarOpen(false); }} className={`w-full text-left px-4 py-3 rounded-xl font-bold text-[11px] uppercase tracking-[0.1em] transition-all flex items-center gap-3 ${activeTab === 'clientes' ? 'bg-[#5B4BBF] text-white shadow-lg' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}>
                 <span className="text-sm">🤝</span> CRM Completo
              </button>
              <button onClick={() => { setActiveTab('vendas'); setIsSidebarOpen(false); }} className={`w-full text-left px-4 py-3 rounded-xl font-bold text-[11px] uppercase tracking-[0.1em] transition-all flex items-center gap-3 ${activeTab === 'vendas' ? 'bg-[#5B4BBF] text-white shadow-lg' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}>
                 <span className="text-sm">💰</span> Central de Vendas
              </button>
              {isAdmin && <button onClick={() => { setActiveTab('financeiro'); setIsSidebarOpen(false); }} className={`w-full text-left px-4 py-3 rounded-xl font-bold text-[11px] uppercase tracking-[0.1em] transition-all flex items-center gap-3 ${activeTab === 'financeiro' ? 'bg-[#5B4BBF] text-white shadow-lg' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}>
                 <span className="text-sm">🏦</span> Financeiro (DRE)
              </button>}
              {isAdmin && <button onClick={() => { setActiveTab('fornecedores'); setIsSidebarOpen(false); }} className={`w-full text-left px-4 py-3 rounded-xl font-bold text-[11px] uppercase tracking-[0.1em] transition-all flex items-center gap-3 ${activeTab === 'fornecedores' ? 'bg-[#5B4BBF] text-white shadow-lg' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}>
                 <span className="text-sm">🧵</span> Fornecedores
              </button>}
              {isAdmin && <button onClick={() => { setActiveTab('usuarios'); setIsSidebarOpen(false); }} className={`w-full text-left px-4 py-3 rounded-xl font-bold text-[11px] uppercase tracking-[0.1em] transition-all flex items-center gap-3 ${activeTab === 'usuarios' ? 'bg-[#5B4BBF] text-white shadow-lg' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}>
                 <span className="text-sm">👥</span> Usuários
              </button>}
              <button onClick={() => navigate('/')} className="w-full text-left px-4 py-3 rounded-xl font-bold text-[11px] uppercase tracking-[0.1em] text-gray-400 hover:bg-white/5 hover:text-white transition-all flex items-center gap-3">
                 <span className="text-sm">🌐</span> Ver Site Público
              </button>
           </nav>
           
           <div className="mt-auto pt-6">
              <button onClick={handleLogout} className="w-full bg-[#4A324A] text-white font-bold py-4 rounded-xl text-[10px] uppercase tracking-widest hover:bg-[#5C3F5C] transition-colors shadow-lg">
                 Sair do Painel
              </button>
           </div>
        </aside>

        <main className="flex-1 ml-0 md:ml-64 p-10 bg-[#F0F2F9] pb-32 min-h-[calc(100vh-64px)]">
          <header className="mb-10 flex justify-between items-center border-b border-gray-200 pb-6 relative">
            <h2 className="text-3xl font-serif font-bold text-secundaria">
               {activeTab === 'visao_geral' && 'Resumo Financeiro'}
               {activeTab === 'estoque' && 'Controle de Estoque'}
               {activeTab === 'clientes' && 'Gestão de Clientes VIPs'}
               {activeTab === 'vendas' && 'Livro de Registros'}
               {activeTab === 'financeiro' && 'Tesouraria'}
               {activeTab === 'fornecedores' && 'Cadeia de Suprimentos'}
            </h2>
            
            <div className="flex gap-4 items-center">
              <div className="relative">
                 <button onClick={() => setShowNotifications(!showNotifications)} className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-200 hover:border-primaria transition-colors relative">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-gray-400"><path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" /></svg>
                    {aniversariantes.length > 0 && <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>}
                 </button>
                 {showNotifications && (
                   <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 p-5">
                      <h4 className="font-bold text-secundaria mb-3 text-sm flex items-center gap-2">🎂 Alertas na Semana</h4>
                      {aniversariantes.length > 0 ? (
                         <ul className="space-y-3">
                            {aniversariantes.map(a => (
                               <li key={a.id} className="text-xs bg-gray-50 p-3 rounded-lg border border-gray-100">
                                  <strong className="block text-sm text-secundaria">{a.full_name}</strong>
                                  {a.is_vip && <span className="text-yellow-600 font-bold block mb-1 text-[10px] uppercase">🌟 Cliente VIP Especial</span>}
                                  <span className="text-gray-500 block">📞 {a.phone}</span>
                                  <span className="text-gray-500">Nasc: {new Date(a.birth_date).toLocaleDateString('pt-BR')}</span>
                               </li>
                            ))}
                         </ul>
                      ) : <p className="text-xs text-gray-400">Sem aniversariantes nos próximos 7 dias.</p>}
                   </div>
                 )}
              </div>

              {activeTab === 'clientes' && <button onClick={() => { setClientForm(defaultClientForm); setIsClientModalOpen(true); }} className="bg-secundaria text-white px-6 py-4 rounded-xl shadow-lg hover:-translate-y-1 font-bold text-sm uppercase tracking-widest">+ Novo Cliente</button>}
              {activeTab === 'vendas' && <button onClick={() => setIsSaleModalOpen(true)} className="bg-emerald-600 text-white px-6 py-4 rounded-xl shadow-lg hover:-translate-y-1 font-bold text-sm uppercase">🛒 Nova Venda</button>}
              {activeTab === 'estoque' && <button onClick={() => setIsProductModalOpen(true)} className="bg-primaria text-white px-6 py-4 rounded-xl shadow-lg hover:-translate-y-1 font-bold text-sm uppercase">📦 Novo Produto</button>}
            </div>
          </header>

          <div className="space-y-6">
            {activeTab === 'visao_geral' && (
              <div className="space-y-6 animate-fade-in-down">
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-white p-6 rounded-3xl shadow-sm border-2 border-emerald-500/20 border-l-[6px] border-l-emerald-500">
                       <h3 className="text-gray-400 text-[9px] font-bold uppercase tracking-widest mb-1 flex justify-between">Faturamento (Hoje) <span className="opacity-50">📊</span></h3>
                       <p className="text-3xl font-serif text-secundaria font-bold tracking-tighter">{formatCurrency(fatDia)}</p>
                       <p className="text-[10px] text-gray-400 mt-2 font-bold"><span className="text-emerald-500">{qtdVendasDia}</span> pedidos processados hoje.</p>
                    </div>
                    <div className="bg-white p-6 rounded-3xl shadow-sm border-2 border-indigo-500/20 border-l-[6px] border-l-indigo-500">
                       <h3 className="text-gray-400 text-[9px] font-bold uppercase tracking-widest mb-1 flex justify-between">Faturamento (Mês) <span className="opacity-50">📈</span></h3>
                       <p className="text-3xl font-serif text-secundaria font-bold tracking-tighter">{formatCurrency(fatMes)}</p>
                       <p className="text-[10px] text-gray-400 mt-2 font-bold"><span className="text-indigo-500">{qtdVendasMes}</span> pedidos neste mês.</p>
                    </div>
                    <div className="bg-[#131722] p-6 rounded-3xl shadow-xl border-l-[6px] border-l-indigo-400">
                       <h3 className="text-gray-500 text-[9px] font-bold uppercase tracking-widest mb-1 flex justify-between">Lucro Estimado (Mês) <span className="opacity-50 text-indigo-400">💎</span></h3>
                       <p className="text-3xl font-serif text-[#34D399] font-bold tracking-tighter">{formatCurrency(lucroMes)}</p>
                       <p className="text-[9px] text-gray-500 mt-1 font-medium italic">Receita menos custos de fabricação.</p>
                    </div>
                    <div className="bg-white p-6 rounded-3xl shadow-sm border-2 border-yellow-500/20 border-l-[6px] border-l-yellow-500">
                       <h3 className="text-gray-400 text-[9px] font-bold uppercase tracking-widest mb-1 flex justify-between">Base CRM <span className="opacity-50">🤝</span></h3>
                       <p className="text-3xl font-sans text-secundaria font-bold tracking-tighter">{clientes.length}</p>
                       <p className="text-[10px] text-gray-400 mt-2 font-bold">Clientes VIPs e Padrão.</p>
                    </div>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                       <h3 className="text-secundaria text-[11px] font-serif font-bold uppercase tracking-widest mb-6 flex items-center gap-2"><span>💳</span> Balancete de Entradas (Mês)</h3>
                       <div className="space-y-4">
                          <div className="flex justify-between items-center bg-gray-50/50 p-4 rounded-xl border border-gray-100">
                             <div><p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Volume Pix</p><p className="text-xl font-bold text-secundaria">{formatCurrency(totPix)}</p></div>
                             <span className="bg-emerald-100 text-emerald-700 font-bold text-[8px] tracking-widest uppercase px-3 py-1 rounded-lg">Dinheiro na Hora</span>
                          </div>
                          <div className="flex justify-between items-center bg-gray-50/50 p-4 rounded-xl border border-gray-100">
                             <div><p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Volume Cartões</p><p className="text-xl font-bold text-secundaria">{formatCurrency(totCartao)}</p></div>
                             <span className="bg-blue-100 text-blue-700 font-bold text-[8px] tracking-widest uppercase px-3 py-1 rounded-lg">Crédito / Débito</span>
                          </div>
                       </div>
                    </div>
                    <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                       <h3 className="text-secundaria text-[11px] font-serif font-bold uppercase tracking-widest mb-6 flex items-center gap-2"><span>🔥</span> Perdas e Concessões (Mês)</h3>
                       <div className="space-y-4">
                          <div className="flex justify-between items-center bg-red-50/30 p-4 rounded-xl border border-red-50">
                             <div><p className="text-[9px] font-bold text-red-800 uppercase tracking-widest">Descontos Concedidos</p><p className="text-xl font-bold text-red-700">{formatCurrency(descontosMes)}</p></div>
                             <span className="text-[20px]">🎁</span>
                          </div>
                          <div className="flex justify-between items-center bg-orange-50/30 p-4 rounded-xl border border-orange-100">
                             <div><p className="text-[9px] font-bold text-orange-800 uppercase tracking-widest">Taxas Estimadas (Cartões)</p><p className="text-xl font-bold text-orange-700">{formatCurrency(totCartao * 0.0499)}</p></div>
                             <span className="text-[20px]">🏦</span>
                          </div>
                       </div>
                    </div>
                 </div>

                 <div className="bg-secundaria text-white p-8 rounded-3xl shadow-xl flex justify-between items-center relative overflow-hidden">
                    <div className="relative z-10 w-full flex flex-col md:flex-row justify-between items-center gap-6">
                       <header className="flex justify-between items-center mb-10">
             <div>
                <h1 className="text-4xl font-serif font-bold text-secundaria tracking-tight">Resumo Financeiro</h1>
                <p className="text-gray-400 text-[10px] font-bold uppercase tracking-[0.3em] mt-1">Status Operacional em Tempo Real</p>
             </div>
             <p className="text-4xl font-serif font-bold">{formatCurrency(receitaTotal)}</p>
                       </header>
                       <div className="text-center md:text-right">
                          <p className="text-xs text-gray-300 font-bold">Desde o início da operação na Camélia</p>
                       </div>
                    </div>
                 </div>
              </div>
            )}

            {activeTab === 'clientes' && (
              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 font-bold uppercase tracking-widest text-[10px]"><tr><th className="p-5 pl-8">Identidade VIP</th><th className="p-5">Contatos Diretos</th><th className="p-5 text-center">Status CRM</th><th className="p-5 text-right pr-8">Ação</th></tr></thead>
                  <tbody className="divide-y divide-gray-100">
                    {clientes.map(c => (
                      <tr key={c.id} className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => openClientDossier(c)}>
                        <td className="p-5 pl-8 font-bold text-secundaria text-base">{c.full_name} {c.is_vip && <span className="ml-2 text-yellow-500 text-sm">🌟</span>}</td>
                        <td className="p-5 text-gray-600 font-medium text-xs">{c.phone && <span className="block mb-1 font-bold">{c.is_whatsapp ? '📱 (Whats)' : '📞'} {c.phone}</span>}{c.email}</td>
                        <td className="p-5 text-center">{c.is_vip ? <span className="bg-yellow-100 text-yellow-800 font-bold px-3 py-2 text-[10px] uppercase rounded-lg border border-yellow-200">Cliente VIP</span> : <span className="bg-gray-100 text-gray-500 font-bold px-3 py-2 text-[10px] uppercase rounded-lg">Padrão</span>}</td>
                        <td className="p-5 text-right pr-8"><button className="text-white hover:bg-black font-bold text-[10px] uppercase tracking-widest bg-secundaria px-4 py-2 rounded-lg">Ver Ficha</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'vendas' && (
              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 font-bold uppercase tracking-widest text-[10px]"><tr><th className="p-5 pl-8">ID</th><th className="p-5">Cliente Comprador</th><th className="p-5">Data da Compra</th><th className="p-5">Método</th><th className="p-5 text-right pr-8">Total Cobrado</th></tr></thead>
                  <tbody className="divide-y divide-gray-100">
                    {vendas.map(v => (
                      <tr key={v.id} className="hover:bg-gray-50 transition-colors">
                        <td className="p-5 pl-8 font-bold text-gray-400 text-xs">#{v.id}</td>
                        <td className="p-5 font-bold text-secundaria">{v.clients?.full_name || v.client_name} {v.clients?.is_vip && <span className="text-yellow-500 leading-none">🌟</span>}</td>
                        <td className="p-5 text-gray-500 text-xs font-bold">{new Date(v.created_at).toLocaleDateString('pt-BR')}</td>
                        <td className="p-5"><span className="px-3 py-1 rounded text-[10px] font-bold uppercase tracking-widest border bg-blue-50/50 text-blue-600 border-blue-200/50">{v.payment_method}</span></td>
                        <td className="p-5 text-right pr-8 font-bold text-green-600 text-sm">{formatCurrency(v.total_amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'estoque' && <StockHistoryModule produtos={produtos} onStockChange={actions.refresh} />}
            {activeTab === 'financeiro' && <FinanceModule />}
            {activeTab === 'fornecedores' && <SuppliersModule />}
            {activeTab === 'usuarios' && isAdmin && <UsersModule />}
          </div>
        </main>
      </div>

      {isClientModalOpen && (
         <div className="fixed inset-0 bg-secundaria/80 backdrop-blur z-[100] flex items-center justify-center p-4">
           <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] overflow-y-auto border border-white/20">
               <div className="sticky top-0 bg-white z-10 px-8 border-b border-gray-100 py-6 flex justify-between items-center shadow-sm">
                   <h3 className="text-2xl font-serif font-bold text-secundaria">Nova Ficha Cadastral</h3>
                   <button type="button" onClick={() => setIsClientModalOpen(false)} className="bg-gray-100 px-4 py-2 rounded-lg font-bold uppercase text-[10px] text-gray-500 hover:bg-gray-200">Cancelar [X]</button>
               </div>
               <form onSubmit={handleRegisterClient} className="p-8 space-y-6">
                  <div>
                    <h4 className="font-bold text-xs uppercase tracking-widest text-primaria border-b pb-2 mb-4">Identidade e Contato</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       <input type="text" required value={clientForm.full_name} onChange={e => setClientForm({...clientForm, full_name: e.target.value})} placeholder="Nome Completo" className="w-full px-4 py-3 bg-gray-50 border rounded-lg text-sm font-bold" />
                       <input type="text" value={clientForm.cpf} onChange={e => setClientForm({...clientForm, cpf: e.target.value})} placeholder="CPF" className="w-full px-4 py-3 bg-gray-50 border rounded-lg text-sm font-bold" />
                       <input type="text" required value={clientForm.phone} onChange={e => setClientForm({...clientForm, phone: e.target.value})} placeholder="Telefone Primário" className="w-full px-4 py-3 bg-gray-50 border rounded-lg text-sm font-bold" />
                       <input type="email" value={clientForm.email} onChange={e => setClientForm({...clientForm, email: e.target.value})} placeholder="Email (Opcional)" className="w-full px-4 py-3 bg-gray-50 border rounded-lg text-sm font-bold" />
                    </div>
                  </div>
                  <div>
                    <h4 className="font-bold text-xs uppercase tracking-widest text-primaria border-b pb-2 mb-4 mt-4">Logística</h4>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                       <input type="text" maxLength="9" value={clientForm.cep} onChange={handleCepChange} placeholder="CEP" className="w-full px-4 py-3 bg-blue-50 border rounded-lg text-sm font-bold md:col-span-1" />
                       <input type="text" value={clientForm.address} onChange={e => setClientForm({...clientForm, address: e.target.value})} placeholder="Rua" className="w-full px-4 py-3 bg-gray-50 border rounded-lg text-sm font-bold md:col-span-3" />
                    </div>
                  </div>
                  <button type="submit" disabled={isSavingClient} className="w-full bg-secundaria text-white font-bold py-5 rounded-xl uppercase tracking-widest text-sm shadow-xl hover:bg-black transition-colors">
                     {isSavingClient ? "Registrando..." : "Confirmar Cadastro CRM"}
                  </button>
               </form>
           </div>
         </div>
      )}

      {isClientDossierOpen && selectedClient && (
         <div className="fixed inset-0 bg-secundaria/80 backdrop-blur z-[100] flex items-center justify-center p-4">
           <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl max-h-[95vh] flex flex-col border border-white/20">
             <div className="px-8 py-6 bg-gray-50 border-b flex justify-between items-center rounded-t-3xl">
                <h3 className="text-3xl font-serif font-bold text-secundaria">{selectedClient.full_name}</h3>
                <button onClick={() => setIsClientDossierOpen(false)} className="bg-gray-100 p-3 rounded-full font-bold text-xs text-gray-500 hover:bg-red-50 hover:text-red-500">Fechar X</button>
             </div>
             <form onSubmit={handleUpdateClient} className="p-10 space-y-6">
                <div className="grid grid-cols-2 gap-6">
                   <div><label className="text-[10px] uppercase font-bold text-gray-400">Telefone</label><input type="text" value={selectedClient.phone || ''} onChange={(e) => setSelectedClient({...selectedClient, phone: e.target.value})} className="w-full border-b py-3 font-bold" /></div>
                   <div><label className="text-[10px] uppercase font-bold text-gray-400">Email</label><input type="text" value={selectedClient.email || ''} onChange={(e) => setSelectedClient({...selectedClient, email: e.target.value})} className="w-full border-b py-3 font-bold" /></div>
                   <div className="col-span-2">
                      <label className="flex items-center gap-2 cursor-pointer text-xs font-bold uppercase text-yellow-700">
                         <input type="checkbox" checked={selectedClient.is_vip} onChange={(e) => setSelectedClient({...selectedClient, is_vip: e.target.checked})} className="w-5 h-5 accent-yellow-500" /> RECONHECER COMO VIP 🌟
                      </label>
                   </div>
                </div>
                <button type="submit" disabled={isSavingClient} className="w-full bg-secundaria text-white py-5 rounded-xl font-bold uppercase tracking-widest">{isSavingClient ? 'Salvando...' : 'Atualizar Ficha'}</button>
             </form>
           </div>
         </div>
      )}

      {isSaleModalOpen && (
        <div className="fixed inset-0 bg-secundaria/80 backdrop-blur z-[100] flex items-center justify-center p-4">
           <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-white/20">
             <div className="sticky top-0 bg-white px-8 py-6 border-b flex justify-between items-center">
                <h3 className="text-xl font-serif font-bold text-secundaria">Painel de Vendas</h3>
                <button onClick={() => setIsSaleModalOpen(false)} className="bg-gray-100 p-2 rounded-full text-gray-400 hover:text-red-500">X</button>
             </div>
             <form onSubmit={handleRegisterSale} className="p-8 space-y-6">
                <select required value={saleForm.client_id} onChange={e => setSaleForm({...saleForm, client_id: e.target.value})} className="w-full px-4 py-3 bg-yellow-50 border rounded-xl font-bold outline-none">
                   <option value="">[ Selecione a Cliente ]</option>
                   {clientes.map(c => <option key={c.id} value={c.id}>{c.full_name} {c.is_vip ? '🌟' : ''}</option>)}
                </select>

                <div className="bg-gray-50 p-6 rounded-2xl border border-dashed border-gray-200">
                   <div className="flex gap-2">
                      <select value={selectedProductId} onChange={e => setSelectedProductId(e.target.value)} className="flex-1 px-4 py-2 bg-white border rounded-lg text-sm font-bold">
                         {produtos.filter(p => !p.is_insumo).map(p => <option key={p.id} value={p.id}>{p.nome} ({p.stock}) - {formatCurrency(p.price)}</option>)}
                      </select>
                      <input type="number" value={selectedQuantity} onChange={e => setSelectedQuantity(e.target.value)} className="w-20 px-4 py-2 border rounded-lg text-center font-bold" placeholder="Qtd" />
                      <button type="button" onClick={addToSaleCart} className="bg-secundaria text-white px-4 rounded-lg font-bold">Add</button>
                   </div>
                   <div className="mt-4 space-y-2">
                      {cartItems.map(i => (
                         <div key={i.id} className="flex justify-between items-center bg-white p-3 rounded-lg border shadow-sm">
                            <span className="text-sm font-bold">{i.nome} x {i.quantity}</span>
                            <button onClick={() => removeSaleCartItem(i.id)} className="text-red-500 font-bold">X</button>
                         </div>
                      ))}
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <input type="number" placeholder="Desconto %" value={saleForm.discount} onChange={e => setSaleForm({...saleForm, discount: e.target.value})} className="px-4 py-3 border rounded-xl font-bold" />
                   <input type="number" placeholder="Frete R$" value={saleForm.shipping_cost} onChange={e => setSaleForm({...saleForm, shipping_cost: e.target.value})} className="px-4 py-3 border rounded-xl font-bold" />
                </div>

                <div className="bg-secundaria text-white p-6 rounded-2xl text-center">
                   <p className="text-[10px] uppercase font-bold tracking-widest opacity-60">Total Líquido</p>
                   <h2 className="text-4xl font-serif font-bold">{formatCurrency(finalSaleTotal)}</h2>
                </div>

                <button type="submit" disabled={isSavingSale || cartItems.length === 0} className="w-full bg-emerald-600 text-white font-bold py-5 rounded-xl uppercase tracking-widest shadow-xl hover:bg-emerald-700">
                   {isSavingSale ? "Processando..." : "Gravar Venda no CRM"}
                </button>
             </form>
           </div>
        </div>
      )}

      {isProductModalOpen && (
        <div className="fixed inset-0 bg-secundaria/60 backdrop-blur z-[100] flex items-center justify-center p-4">
           <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[95vh] overflow-y-auto p-10">
               <h3 className="text-2xl font-serif font-bold mb-6">Cadastrar Peça</h3>
               <form onSubmit={handleCreateProduct} className="space-y-4">
                  <input type="file" multiple onChange={handleFileChange} className="w-full border-dashed border-2 p-6 rounded-xl text-center cursor-pointer" />
                  <div className="grid grid-cols-2 gap-4">
                     <input type="text" placeholder="Nome" value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} className="px-4 py-3 border rounded-xl font-bold" />
                     <input type="number" placeholder="Preço" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="px-4 py-3 border rounded-xl font-bold" />
                     <input type="number" placeholder="Estoque Inicial" value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})} className="px-4 py-3 border rounded-xl font-bold" />
                     <input type="number" placeholder="Custo Un." value={formData.cost} onChange={e => setFormData({...formData, cost: e.target.value})} className="px-4 py-3 border rounded-xl font-bold" />
                  </div>
                  <button type="submit" disabled={isSavingProduct} className="w-full bg-primaria text-white py-5 rounded-xl font-bold uppercase tracking-widest">
                     {isSavingProduct ? "Sincronizando..." : "Gravar no Catálogo Pro"}
                  </button>
               </form>
           </div>
        </div>
      )}

    </div>
  );
}

export default AdminDashboard;