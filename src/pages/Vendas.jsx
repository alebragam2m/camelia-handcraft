import React from 'react';
import './Financeiro.css';

const Vendas = ({ subsecao }) => {
  return (
    <div className="pagina-container">
      <div className="topo-resumo">
        <div className="mini-card"><span>Pedidos Hoje</span><h3>12</h3></div>
        <div className="mini-card"><span>Ticket Médio</span><h3>R$ 185</h3></div>
        <div className="mini-card"><span>A Enviar</span><h3 style={{color: '#e74c3c'}}>05</h3></div>
        <div className="mini-card"><span>Faturado Mês</span><h3 style={{color: '#27ae60'}}>R$ 14.200</h3></div>
      </div>

      <div className="quadro-branco">
        <h3 style={{ fontFamily: 'Playfair Display', marginBottom: '20px' }}>{subsecao}</h3>
        
        {subsecao === 'Pedidos Pendentes' && (
          <table className="tabela-padrao">
            <thead>
              <tr><th>Pedido</th><th>Cliente</th><th>Data</th><th>Total</th><th>Status</th></tr>
            </thead>
            <tbody>
              <tr><td>#1025</td><td>Maria Silva</td><td>24/01/2026</td><td>R$ 350,00</td><td><span style={{color: '#d4af37'}}>Preparando</span></td></tr>
            </tbody>
          </table>
        )}

        {subsecao === 'Faturamento' && (
          <div style={{ padding: '20px', background: '#fdfaf3', borderRadius: '15px' }}>
            <p>Gráficos e relatórios de faturamento seguirão o mesmo padrão de linhas do financeiro.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Vendas;