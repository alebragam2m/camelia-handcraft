import { useState } from 'react';
import { Link } from 'react-router-dom';
import './Auth.css';

function ClientArea() {
  const [activeTab, setActiveTab] = useState('dados');

  // Ícones SVG minimalistas (Padrão Camélia)
  const IconUser = () => (
    <svg className="menu-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
  );
  
  const IconMap = () => (
    <svg className="menu-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
  );

  const IconBox = () => (
    <svg className="menu-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
  );

  return (
    <div className="auth-container" style={{ alignItems: 'flex-start', paddingTop: '50px' }}>
      <div className="auth-card" style={{ maxWidth: '900px', textAlign: 'left', width: '100%' }}>
        
        {/* Cabeçalho */}
        <div style={{ borderBottom: '1px solid #eee', paddingBottom: '15px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 className="auth-title" style={{ fontSize: '1.8rem', margin: 0 }}>Minha Conta</h1>
          <span style={{ color: '#888' }}>Olá, <strong>Maria Silva</strong></span>
        </div>
        
        <div className="client-grid">
          
          {/* --- MENU LATERAL ELEGANTE --- */}
          <div className="sidebar-menu">
            <button 
              className={activeTab === 'dados' ? 'menu-btn active' : 'menu-btn'}
              onClick={() => setActiveTab('dados')}
            >
              <IconUser /> Meus Dados
            </button>
            <button 
              className={activeTab === 'enderecos' ? 'menu-btn active' : 'menu-btn'}
              onClick={() => setActiveTab('enderecos')}
            >
              <IconMap /> Meus Endereços
            </button>
            <button 
              className={activeTab === 'pedidos' ? 'menu-btn active' : 'menu-btn'}
              onClick={() => setActiveTab('pedidos')}
            >
              <IconBox /> Meus Pedidos
            </button>
            
            <Link to="/login" className="logout-btn">Sair</Link>
          </div>

          {/* --- CONTEÚDO --- */}
          <div className="content-area">
            
            {/* ABA 1: DADOS PESSOAIS */}
            {activeTab === 'dados' && (
              <div className="fade-in">
                <h3 className="section-title">Dados Cadastrais</h3>
                <form className="auth-form" style={{ maxWidth: '100%' }}>
                  
                  {/* Linha 1 */}
                  <div className="row-2">
                    <div className="input-group">
                      <label>Nome Completo</label>
                      <input type="text" defaultValue="Maria Silva" />
                    </div>
                    <div className="input-group">
                      <label>CPF</label>
                      <input type="text" defaultValue="123.456.789-00" />
                    </div>
                  </div>

                  {/* Linha 2 */}
                  <div className="row-2">
                    <div className="input-group">
                      <label>E-mail</label>
                      <input type="email" defaultValue="maria@email.com" disabled style={{ background: '#eee' }} />
                    </div>
                    <div className="input-group">
                      <label>WhatsApp / Celular</label>
                      <input type="tel" defaultValue="(11) 99999-9999" />
                    </div>
                  </div>

                  {/* Linha 3 (NOVA: DATA DE NASCIMENTO) */}
                  <div className="row-2">
                    <div className="input-group">
                      <label>Data de Nascimento</label>
                      <input type="date" defaultValue="1990-05-20" />
                    </div>
                    <div className="input-group">
                      {/* Espaço vazio para alinhar ou outro campo futuro */}
                    </div>
                  </div>

                  <button className="auth-button" style={{ width: 'auto' }}>Salvar Alterações</button>
                </form>
              </div>
            )}

            {/* ABA 2: ENDEREÇOS */}
            {activeTab === 'enderecos' && (
              <div className="fade-in">
                <h3 className="section-title">Meus Endereços</h3>
                
                <div className="address-card">
                  <strong>Casa (Principal)</strong>
                  <p>Av. Paulista, 1000 - Apto 50</p>
                  <p>Bela Vista - São Paulo / SP</p>
                  <p>CEP: 01310-100</p>
                  <div className="card-actions">
                    <button>Editar</button>
                    <button style={{ color: 'red' }}>Excluir</button>
                  </div>
                </div>

                <button className="auth-button" style={{ marginTop: '20px', background: 'transparent', border: '1px solid #6667AB', color: '#6667AB' }}>
                  + Adicionar Novo Endereço
                </button>
              </div>
            )}

            {/* ABA 3: PEDIDOS */}
            {activeTab === 'pedidos' && (
              <div className="fade-in">
                <h3 className="section-title">Histórico de Pedidos</h3>
                
                <div className="order-item">
                  <div className="order-header">
                    <span>Pedido <strong>#1024</strong></span>
                    <span className="status delivered">Entregue</span>
                  </div>
                  <p className="order-date">Realizado em 15/10/2023</p>
                  <p>2x Guardanapos de Linho, 2x Porta Guardanapos...</p>
                  <p className="order-total">Total: <strong>R$ 150,00</strong></p>
                  <button className="track-btn">Ver Detalhes</button>
                </div>

                <div className="order-item">
                  <div className="order-header">
                    <span>Pedido <strong>#1028</strong></span>
                    <span className="status processing">Em Produção</span>
                  </div>
                  <p className="order-date">Realizado em 20/01/2026</p>
                  <p>1x Coleção Natal Completa</p>
                  <p className="order-total">Total: <strong>R$ 450,00</strong></p>
                  <button className="track-btn">Acompanhar</button>
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