import { formatCurrency } from '../utils/formatCurrency';
import React from 'react';
import './Financeiro.css';

const Financeiro = ({ subsecao }) => {
  const lancamentos = [
    { data: '23/01', desc: 'Venda PG (Banco Inter)', tipo: 'Entrada', valor: 210.00, taxa: 6.30, desconto: 0 },
    { data: '22/01', desc: 'Parcela Banco Inter', tipo: 'Saída', valor: 450.00, taxa: 0, desconto: 0 },
  ];

  return (
    <div className="financeiro-container">
      <div className="financeiro-topo" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px', marginBottom: '20px' }}>
        <div className="mini-card-fin" style={{ background: 'white', padding: '15px', borderRadius: '20px', border: '1px solid #f5e6ba', textAlign: 'center' }}>
          <span style={{ fontSize: '10px', color: '#888' }}>SALDO BANCO INTER</span>
          <h3 style={{ color: '#27ae60', margin: '5px 0' }}>R$ 12.450</h3>
        </div>
        <div className="mini-card-fin" style={{ background: 'white', padding: '15px', borderRadius: '20px', border: '1px solid #f5e6ba', textAlign: 'center' }}>
          <span style={{ fontSize: '10px', color: '#888' }}>A PAGAR (MÊS)</span>
          <h3 style={{ color: '#e74c3c', margin: '5px 0' }}>R$ 3.200</h3>
        </div>
        <div className="mini-card-fin" style={{ background: 'white', padding: '15px', borderRadius: '20px', border: '1px solid #f5e6ba', textAlign: 'center' }}>
          <span style={{ fontSize: '10px', color: '#888' }}>TAXAS / DEDUÇÕES</span>
          <h3 style={{ color: '#e74c3c', margin: '5px 0' }}>R$ 180</h3>
        </div>
        <div className="mini-card-fin" style={{ background: 'white', padding: '15px', borderRadius: '20px', border: '1px solid #f5e6ba', textAlign: 'center' }}>
          <span style={{ fontSize: '10px', color: '#888' }}>LUCRO LÍQUIDO</span>
          <h3 style={{ color: '#d4af37', margin: '5px 0' }}>R$ 11.370</h3>
        </div>
      </div>

      <div className="fin-card" style={{ background: 'white', padding: '25px', borderRadius: '25px', border: '1px solid #f5e6ba' }}>
        <h3 style={{ fontFamily: 'Playfair Display', color: '#d4af37', marginBottom: '20px' }}>{subsecao}</h3>
        
        {subsecao === 'Fluxo de Caixa' && (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', color: '#d4af37', borderBottom: '2px solid #fdfaf3' }}>
                <th style={{ padding: '12px' }}>Data</th>
                <th>Descrição</th>
                <th>Tipo</th>
                <th>Valor</th>
                <th>Taxa</th>
                <th>Líquido</th>
              </tr>
            </thead>
            <tbody>
              {lancamentos.map((l, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #f9f6f0' }}>
                  <td style={{ padding: '12px' }}>{l.data}</td>
                  <td>{l.desc}</td>
                  <td style={{ color: l.tipo === 'Entrada' ? '#27ae60' : '#e74c3c' }}>{l.tipo}</td>
                  <td>{formatCurrency(l.valor)}</td>
                  <td style={{ color: '#e74c3c' }}>- {formatCurrency(l.taxa)}</td>
                  <td><strong>R$ {(l.valor - l.taxa).toFixed(2)}</strong></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {subsecao === 'Contas a Pagar' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '15px', background: '#fdfaf3', borderRadius: '15px', marginBottom: '10px', borderLeft: '5px solid #ff7a00' }}>
              <div><strong>Parcela Banco Inter</strong><br/><small>Vence: 05/02/2026</small></div>
              <div style={{ textAlign: 'right' }}><span style={{ color: '#e74c3c' }}>R$ 450,00</span><br/><button style={{ fontSize: '10px', cursor: 'pointer' }}>Google Calendar</button></div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '15px', background: '#fdfaf3', borderRadius: '15px', borderLeft: '5px solid #888' }}>
              <div><strong>Imposto DAS (MEI)</strong><br/><small>Vence: 20/02/2026</small></div>
              <div style={{ textAlign: 'right' }}><span style={{ color: '#e74c3c' }}>R$ 75,00</span><br/><button style={{ fontSize: '10px', cursor: 'pointer' }}>Google Calendar</button></div>
            </div>
          </div>
        )}

        {subsecao === 'Relatórios' && (
          <div style={{ padding: '20px', background: '#fdfaf3', borderRadius: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}><span>Faturamento Bruto</span><strong>R$ 15.000,00</strong></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', color: '#e74c3c' }}><span>Taxas e Impostos</span><strong>- R$ 255,00</strong></div>
            <hr style={{ border: '0.5px solid #f5e6ba' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px', color: '#27ae60', marginTop: '10px' }}><span>Lucro Projetado</span><strong>R$ 14.745,00</strong></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Financeiro;