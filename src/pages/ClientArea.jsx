import { formatCurrency } from '../utils/formatCurrency';
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import './Auth.css';

function ClientArea() {
  const [activeTab, setActiveTab] = useState('pedidos');
  const [user, setUser] = useState(null);
  const [clientData, setClientData] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate('/login');
      return;
    }
    setUser(user);

    // Verificação de Admin
    const { data: adminRecord } = await supabase
      .from('admin_users')
      .select('role')
      .eq('auth_user_id', user.id)
      .single();
    
    if (adminRecord) setIsAdmin(true);

    // Fetch client record
    const { data: client } = await supabase
      .from('clients')
      .select('*')
      .eq('email', user.email)
      .single();

    if (client) {
      setClientData(client);
      
      // Fetch orders
      const { data: saleData } = await supabase
        .from('sales')
        .select('*')
        .eq('client_id', client.id)
        .order('created_at', { ascending: false });
      
      if (saleData) setOrders(saleData);
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const updates = {
      nome: formData.get('nome'),
      telefone: formData.get('telefone'),
    };

    const { error } = await supabase
      .from('clients')
      .update(updates)
      .eq('id', clientData.id);

    if (error) alert("Erro ao atualizar!");
    else alert("Dados atualizados com sucesso!");
  };

  // Ícones SVG
  const IconUser = () => (
    <svg className="menu-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
  );
  const IconMap = () => (
    <svg className="menu-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
  );
  const IconBox = () => (
    <svg className="menu-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
  );
  const IconSettings = () => (
    <svg className="menu-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73v.18a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
  );

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-fundo">Carregando seus detalhes...</div>;

  return (
    <div className="auth-container" style={{ alignItems: 'flex-start', paddingTop: '50px' }}>
      <div className="auth-card" style={{ maxWidth: '900px', textAlign: 'left', width: '100%' }}>
        
        <div style={{ borderBottom: '1px solid #eee', paddingBottom: '15px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 className="auth-title" style={{ fontSize: '1.8rem', margin: 0 }}>Minha Conta</h1>
          <div className="text-right">
            <span style={{ color: '#888' }} className="block text-xs uppercase font-bold tracking-widest">Bem-vinda de volta</span>
            <span className="text-secundaria font-bold">{clientData?.nome || user?.user_metadata?.full_name || user?.user_metadata?.name || 'Cliente'}</span>
          </div>
        </div>
        
        <div className="client-grid">
          <div className="sidebar-menu">
            <button className={activeTab === 'pedidos' ? 'menu-btn active' : 'menu-btn'} onClick={() => setActiveTab('pedidos')}><IconBox /> Meus Pedidos</button>
            <button className={activeTab === 'dados' ? 'menu-btn active' : 'menu-btn'} onClick={() => setActiveTab('dados')}><IconUser /> Meus Dados</button>
            <button className={activeTab === 'enderecos' ? 'menu-btn active' : 'menu-btn'} onClick={() => setActiveTab('enderecos')}><IconMap /> Endereço</button>
            
            {isAdmin && (
              <button 
                onClick={() => navigate('/admin')}
                className="menu-btn mt-4 bg-secundaria text-white border-none shadow-sm hover:bg-black transition-colors"
                style={{ borderRadius: '12px', padding: '12px 15px' }}
              >
                <IconSettings /> Painel de Gestão
              </button>
            )}
            
            <button onClick={handleLogout} className="logout-btn text-left mt-8 border-t border-gray-50 pt-4">Sair da Conta</button>
          </div>

          <div className="content-area">
            {activeTab === 'pedidos' && (
              <div className="fade-in">
                <h3 className="section-title">Histórico de Pedidos</h3>
                {orders.length === 0 ? (
                  <div className="py-10 text-center text-gray-400">
                    <p>Você ainda não realizou pedidos em nossa loja.</p>
                    <Link to="/produtos" className="text-primaria font-bold mt-4 block">Ver Catálogo</Link>
                  </div>
                ) : (
                  orders.map(order => (
                    <div key={order.id} className="order-item">
                      <div className="order-header">
                        <span>Pedido <strong>#{order.id.slice(0, 5)}</strong></span>
                        <span className={`status ${order.status === 'Pago' ? 'delivered' : 'processing'}`}>{order.status}</span>
                      </div>
                      <p className="order-date">{new Date(order.created_at).toLocaleDateString('pt-BR')}</p>
                      <p className="order-total">Total: <strong>{formatCurrency(order.total_price)}</strong></p>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'dados' && (
              <div className="fade-in">
                <h3 className="section-title">Dados Cadastrais</h3>
                <form onSubmit={handleUpdateProfile} className="auth-form" style={{ maxWidth: '100%' }}>
                  <div className="row-2">
                    <div className="input-group"><label>Nome Completo</label><input name="nome" type="text" defaultValue={clientData?.nome} /></div>
                    <div className="input-group"><label>E-mail</label><input type="email" defaultValue={user?.email} disabled style={{ opacity: 0.6 }} /></div>
                  </div>
                  <div className="row-2">
                    <div className="input-group"><label>WhatsApp / Celular</label><input name="telefone" type="tel" defaultValue={clientData?.telefone} /></div>
                  </div>
                  <button type="submit" className="auth-button" style={{ width: 'auto', padding: '12px 30px' }}>Salvar Alterações</button>
                </form>
              </div>
            )}

            {activeTab === 'enderecos' && (
              <div className="fade-in">
                <h3 className="section-title">Meus Endereços</h3>
                <div className="address-card">
                  <strong>{clientData?.neighborhood || 'Endereço Principal'}</strong>
                  <p>{clientData?.address || 'Não cadastrado'}</p>
                  <p>{clientData?.city} - {clientData?.state}</p>
                  <div className="card-actions"><button>Editar</button></div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ClientArea;