import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { formatCurrency } from '../utils/formatCurrency';
import { productService } from '../services/productService';
import { saleService } from '../services/saleService';
import { clientService } from '../services/clientService';

// Components
import FinanceModule from '../components/FinanceModule';
import StockHistoryModule from '../components/StockHistoryModule';
import SuppliersModule from '../components/SuppliersModule';
import ProductsModule from '../components/ProductsModule';
import UsersModule from '../components/UsersModule';
import SalesModule from '../components/SalesModule';
import ClientsModule from '../components/ClientsModule';
import ErrorBoundary from '../components/ErrorBoundary';

/**
 * DASHBOARD ADMINISTRATIVO - CAMÉLIA HANDCRAFT (MOT PRO v3)
 * 
 * RBAC v2: Baseado em Níveis Numéricos (1-4)
 * - 4: Admin/Proprietário (Acesso Total)
 * - 3: Gestor (Financeiro + Operacional)
 * - 2: Vendedor (Vendas + Produtos)
 * - 1: Visualizador (Relatórios base)
 */

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('visao_geral');
  const [userLevel, setUserLevel] = useState(1);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // TanStack Query (Sincronização e Cache)
  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => productService.getAll(),
  });

  const { data: sales = [], isError: isErrorSales } = useQuery({
    queryKey: ['sales'],
    queryFn: () => saleService.getAll(),
  });

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { data: _clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => clientService.getAll(),
  });

  // Auth & Level detection
  useEffect(() => {
    const detectUserLevel = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate('/login'); return; }
      
      const { data, error } = await supabase
        .from('admin_users')
        .select('access_level, is_active')
        .eq('auth_user_id', user.id)
        .single();

      if (error || !data || !data.is_active) {
        console.warn("[Auth] Usuário não autorizado ou inativo.");
        await supabase.auth.signOut();
        navigate('/login');
        return;
      }

      setUserLevel(data.access_level);
    };
    detectUserLevel();
  }, [navigate]);

  const canAccessFullAdmin = userLevel >= 4;
  const canAccessFinance = userLevel >= 3;
  
  const handleLogout = async () => { await supabase.auth.signOut(); navigate('/login'); };

  // Resumo Financeiro
  const todayStr = new Date().toISOString().split('T')[0];
  const currM = new Date().getMonth();
  const currY = new Date().getFullYear();
  
  const vMes = sales.filter((v: any) => { 
     if(!v.created_at) return false;
     const d = new Date(v.created_at); 
     return d.getMonth() === currM && d.getFullYear() === currY; 
  });
  
  const fatDia = sales.filter((v: any) => v.created_at?.startsWith(todayStr)).reduce((acc, v: any) => acc + Number(v.total_amount), 0);
  const fatMes = vMes.reduce((acc, v: any) => acc + Number(v.total_amount), 0);
  const lucroMes = vMes.reduce((acc, v: any) => acc + (Number(v.total_amount) - Number(v.total_cost || 0)), 0);

  return (
    <ErrorBoundary>
      <div className="bg-[#F8F8FC] min-h-screen text-[#333333] font-sans">
        <header className="bg-white border-b border-gray-100 sticky top-0 z-[100] px-6 py-4 flex justify-between items-center shadow-sm backdrop-blur-md bg-white/95">
           <div className="flex items-center gap-4">
              <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="md:hidden p-2 text-[#333333] hover:bg-gray-50 rounded-lg transition-colors">
                 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></svg>
              </button>
              <div className="flex items-center gap-4 cursor-pointer group" onClick={() => navigate('/')}>
                 <img src="/logo camelia vetor (1).svg" alt="Camélia Handcraft" className="h-16 md:h-24 w-auto object-contain" />
              </div>
           </div>
           <div className="flex items-center gap-4">
              <span className="hidden lg:block text-[9px] text-emerald-500 font-bold uppercase tracking-widest">Sincronização Ativa (Motor Pro v3)</span>
              <button onClick={handleLogout} className="px-4 py-2 bg-red-50 text-red-500 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all">Sair</button>
           </div>
        </header>

        <div className="flex">
          {isSidebarOpen && <div className="fixed inset-0 bg-secundaria/50 backdrop-blur-sm z-[70] md:hidden" onClick={() => setIsSidebarOpen(false)}></div>}

          <aside className={`w-72 bg-[#2D2B52] h-[calc(100vh-64px)] fixed flex flex-col p-6 z-[80] transition-transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 shadow-2xl`}>
             <nav className="space-y-1 flex-1 overflow-y-auto pr-2 custom-scrollbar mt-10">
                {[
                  { id: 'visao_geral', label: 'Visão Geral', icon: '📊' },
                  { id: 'produtos', label: 'Produtos', icon: '📦' },
                  { id: 'estoque', label: 'Estoque (PCP)', icon: '📉' },
                  { id: 'clientes', label: 'CRM Completo', icon: '🤝' },
                  { id: 'vendas', label: 'Central de Vendas', icon: '💰' },
                  { id: 'fornecedores', label: 'Fornecedores', icon: '🚛' },
                  { id: 'financeiro', label: 'Financeiro (DRE)', icon: '🏦', levelRequired: 3 },
                  { id: 'usuarios', label: 'Acessos/RBAC', icon: '👥', levelRequired: 4 },
                ].map(item => (
                  (!item.levelRequired || userLevel >= item.levelRequired) && (
                    <button key={item.id} onClick={() => { setActiveTab(item.id); setIsSidebarOpen(false); }} className={`w-full text-left px-4 py-3 rounded-xl font-bold text-[11px] uppercase tracking-widest transition-all flex items-center gap-3 ${activeTab === item.id ? 'bg-[#5B4BBF] text-white shadow-lg' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}>
                       <span className="text-sm">{item.icon}</span> {item.label}
                    </button>
                  )
                ))}
             </nav>
          </aside>

          <main className="flex-1 ml-0 md:ml-72 p-10 bg-[#F0F2F9] pb-32 min-h-[calc(100vh-64px)]">
            <header className="mb-10 flex justify-between items-center border-b border-gray-200 pb-6 relative">
              <h2 className="text-3xl font-serif font-bold text-secundaria uppercase tracking-tight">
                 {activeTab === 'visao_geral' && 'Resumo Financeiro'}
                 {activeTab === 'produtos' && 'Catálogo de Peças'}
                 {activeTab === 'estoque' && 'Controle de Estoque'}
                 {activeTab === 'clientes' && 'Gestão de Clientes VIPs'}
                 {activeTab === 'vendas' && 'Livro de Registros'}
                 {activeTab === 'fornecedores' && 'Rede de Suprimentos'}
                 {activeTab === 'financeiro' && 'Tesouraria'}
                 {activeTab === 'usuarios' && 'Gestão de Perfis'}
              </h2>
              {isErrorSales && (
                <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-100 flex items-center gap-3 animate-pulse">
                   <div className="flex flex-col">
                      <p className="text-[10px] font-bold uppercase tracking-widest">Alerta de Rede</p>
                      <p className="text-[9px] font-bold opacity-80">Sincronização Lenta</p>
                   </div>
                </div>
              )}
            </header>

            <div className="space-y-6">
              {activeTab === 'visao_geral' && (
                <div className="space-y-6 animate-fade-in-down">
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      <div className="bg-white p-6 rounded-3xl shadow-sm border-l-[6px] border-l-emerald-500">
                         <h3 className="text-gray-400 text-[9px] font-bold uppercase tracking-widest mb-1">Faturamento (Hoje)</h3>
                         <p className="text-3xl font-serif text-secundaria font-bold tracking-tighter">{formatCurrency(fatDia)}</p>
                      </div>
                      <div className="bg-white p-6 rounded-3xl shadow-sm border-l-[6px] border-l-indigo-500">
                         <h3 className="text-gray-400 text-[9px] font-bold uppercase tracking-widest mb-1">Faturamento (Mês)</h3>
                         <p className="text-3xl font-serif text-secundaria font-bold tracking-tighter">{formatCurrency(fatMes)}</p>
                      </div>
                      <div className="bg-[#131722] p-6 rounded-3xl shadow-xl border-l-[6px] border-l-indigo-400">
                         <h3 className="text-gray-500 text-[9px] font-bold uppercase tracking-widest mb-1">Lucro Estimado (Mês)</h3>
                         <p className="text-2xl font-serif text-[#34D399] font-bold tracking-tighter">{canAccessFinance ? formatCurrency(lucroMes) : 'Restrito'}</p>
                      </div>
                   </div>
                </div>
              )}

              {activeTab === 'produtos' && <ProductsModule />}
              {activeTab === 'financeiro' && canAccessFinance && <FinanceModule />}
              {activeTab === 'estoque' && <StockHistoryModule produtos={products} />}
              {activeTab === 'fornecedores' && <SuppliersModule />}
              {activeTab === 'usuarios' && canAccessFullAdmin && <UsersModule />}
              
              {activeTab === 'vendas' && <SalesModule />}
              {activeTab === 'clientes' && <ClientsModule />}
            </div>
          </main>
        </div>
      </div>
    </ErrorBoundary>
  );
}
