import React from 'react';

function Dashboard({ subsecao }) {
  if (subsecao === 'Visão Geral') {
    return (
      <div style={{ width: '100%' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '30px' }}>
          {['Vendas Hoje', 'Pedidos Ativos', 'Estoque Baixo', 'Novos Clientes'].map((t, i) => (
            <div key={i} style={{ background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid rgba(102, 103, 171, 0.1)', textAlign: 'center' }}>
              <span style={{ fontSize: '10px', color: '#888', textTransform: 'uppercase' }}>{t}</span>
              <h3 style={{ color: '#6667AB', fontSize: '22px', marginTop: '8px' }}>--</h3>
            </div>
          ))}
        </div>
        <div style={{ background: 'white', padding: '30px', borderRadius: '16px', border: '1px solid rgba(102, 103, 171, 0.1)' }}>
          <h2 style={{ color: '#6667AB', fontSize: '18px' }}>Desempenho Semanal</h2>
          <div style={{ height: '250px', marginTop: '20px', background: '#F8F8FC', borderRadius: '12px', border: '1px dashed #DDD', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888' }}>
            [ Gráfico em processamento ]
          </div>
        </div>
      </div>
    );
  }
  return <div style={{ background: 'white', padding: '30px', borderRadius: '16px' }}><h2 style={{ color: '#6667AB' }}>{subsecao}</h2></div>;
}

export default Dashboard;