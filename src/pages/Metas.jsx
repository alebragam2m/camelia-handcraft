import React from 'react';
import './Metas.css';

const Metas = () => {
  // Dados Simulados (Atingido vs Meta)
  const metaFaturamento = { atingido: 15000, meta: 25000 };
  const metaClientes = { atingido: 42, meta: 60 };
  
  const calcularPerc = (real, obj) => Math.min((real / obj) * 100, 100).toFixed(1);

  return (
    <div className="metas-container">
      <div className="metas-grid">
        
        {/* Meta 1: Faturamento Mensal */}
        <div className="meta-card">
          <div className="meta-header">
            <h3>Meta de Faturamento</h3>
            <span className="meta-badge">Janeiro 2026</span>
          </div>
          <div className="meta-progress-wrapper">
            <div className="meta-value-display">
              {calcularPerc(metaFaturamento.atingido, metaFaturamento.meta)}%
            </div>
            <div className="meta-bar-bg">
              <div className="meta-bar-fill" style={{ width: `${calcularPerc(metaFaturamento.atingido, metaFaturamento.meta)}%` }}></div>
            </div>
          </div>
          <div className="meta-footer">
            <span>Atingido: <strong>R$ {metaFaturamento.atingido.toLocaleString('pt-BR')}</strong></span>
            <span>Meta: <strong>R$ {metaFaturamento.meta.toLocaleString('pt-BR')}</strong></span>
          </div>
        </div>

        {/* Meta 2: Novas Clientes */}
        <div className="meta-card">
          <div className="meta-header">
            <h3>Novas Clientes (VIP)</h3>
            <span className="meta-badge">Fidelização</span>
          </div>
          <div className="meta-progress-wrapper">
            <div className="meta-value-display">
              {calcularPerc(metaClientes.atingido, metaClientes.meta)}%
            </div>
            <div className="meta-bar-bg">
              <div className="meta-bar-fill" style={{ width: `${calcularPerc(metaClientes.atingido, metaClientes.meta)}%`, background: '#5d4037' }}></div>
            </div>
          </div>
          <div className="meta-footer">
            <span>Atingido: <strong>{metaClientes.atingido}</strong></span>
            <span>Meta: <strong>{metaClientes.meta}</strong></span>
          </div>
        </div>
      </div>

      {/* Seção Inferior: Meta por Produto (Com mesmo padrão Atingido x Meta) */}
      <h3 style={{ fontFamily: 'Playfair Display', margin: '30px 0 20px 10px', color: '#d4af37' }}>Meta por Produto</h3>
      
      <div className="metas-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <ProductMetaCard label="Porta Guardanapos" atingido={120} meta={200} />
        <ProductMetaCard label="Jogos Americanos" atingido={30} meta={50} />
        <ProductMetaCard label="Coleção Círio" atingido={85} meta={100} />
      </div>
    </div>
  );
};

// Sub-componente para os cards de produtos com o padrão Atingido x Meta
const ProductMetaCard = ({ label, atingido, meta }) => {
  const perc = Math.min((atingido / meta) * 100, 100).toFixed(1);
  return (
    <div className="meta-card" style={{ padding: '20px' }}>
      <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '15px', color: '#1a1a1a' }}>{label}</div>
      <div style={{ textAlign: 'center', marginBottom: '10px' }}>
        <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#d4af37' }}>{perc}%</span>
      </div>
      <div className="meta-bar-bg" style={{ height: '12px', marginBottom: '15px' }}>
        <div className="meta-bar-fill" style={{ width: `${perc}%` }}></div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', fontSize: '12px', color: '#888' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Atingido:</span> <strong>{atingido} un</strong>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Meta:</span> <strong>{meta} un</strong>
        </div>
      </div>
    </div>
  );
};

export default Metas;