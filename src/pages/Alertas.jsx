import React, { useState } from 'react';
import './Alertas.css';

const Alertas = () => {
  // Estados para os configuradores
  const [limiteEstoque, setLimiteEstoque] = useState(30);
  const [limiteMeta, setLimiteMeta] = useState(80);
  const [limiteTaxa, setLimiteTaxa] = useState(500);
  const [limiteDesc, setLimiteDesc] = useState(1000);

  // Dados dos Produtos (Espelho do Dia)
  const produtosEstoque = [
    { nome: "PG Anastácia", perc: 28, estoque: "14 un" },
    { nome: "PG Limãozinho", perc: 75, estoque: "40 un" },
    { nome: "Guardanapo Linho", perc: 15, estoque: "8 un" },
  ];

  const produtosMetas = [
    { nome: "Coleção Círio", perc: 85 },
    { nome: "Jogos Americanos", perc: 30 },
    { nome: "Natal", perc: 78 },
  ];

  return (
    <div className="alertas-container">
      <div className="alertas-grid">
        
        {/* QUADRO 1: ESTOQUE */}
        <div className="alerta-card">
          <div className="alerta-header"><h3>🛡️ Alerta de Estoque</h3><ToggleButton /></div>
          <div className="config-box">
            <span>Avisar abaixo de:</span>
            <input type="number" className="input-alerta" value={limiteEstoque} onChange={(e) => setLimiteEstoque(e.target.value)} />
            <span>%</span>
          </div>
          {produtosEstoque.map((item, i) => (
            <AlertaBar key={i} label={item.nome} perc={item.perc} info={item.estoque} limite={limiteEstoque} inverter={true} />
          ))}
        </div>

        {/* QUADRO 2: METAS */}
        <div className="alerta-card">
          <div className="alerta-header"><h3>🎯 Alerta de Metas</h3><ToggleButton /></div>
          <div className="config-box">
            <span>Avisar ao atingir:</span>
            <input type="number" className="input-alerta" value={limiteMeta} onChange={(e) => setLimiteMeta(e.target.value)} />
            <span>%</span>
          </div>
          {produtosMetas.map((item, i) => (
            <AlertaBar key={i} label={item.nome} perc={item.perc} info={`${item.perc}%`} limite={limiteMeta} />
          ))}
        </div>

        {/* QUADRO 3: TAXAS (VALORES R$) */}
        <div className="alerta-card">
          <div className="alerta-header"><h3>💳 Taxas de Cartão</h3><ToggleButton /></div>
          <div className="config-box">
            <span>Limite Mensal: R$</span>
            <input type="number" className="input-alerta" value={limiteTaxa} onChange={(e) => setLimiteTaxa(e.target.value)} />
          </div>
          <ValorAlerta atual={180} limite={limiteTaxa} label="Taxas Acumuladas" />
        </div>

        {/* QUADRO 4: DESCONTOS (VALORES R$) */}
        <div className="alerta-card">
          <div className="alerta-header"><h3>🏷️ Teto de Descontos</h3><ToggleButton /></div>
          <div className="config-box">
            <span>Limite Mensal: R$</span>
            <input type="number" className="input-alerta" value={limiteDesc} onChange={(e) => setLimiteDesc(e.target.value)} />
          </div>
          <ValorAlerta atual={1200} limite={limiteDesc} label="Descontos Concedidos" />
        </div>

      </div>
    </div>
  );
};

// Componente de Barra com Lógica de Cor
const AlertaBar = ({ label, perc, info, limite, inverter = false }) => {
  // Para estoque: alerta se perc < limite. Para meta: alerta se perc >= limite.
  const isCritico = inverter ? perc <= limite : perc >= limite;
  const corBarra = isCritico ? "#e74c3c" : (inverter ? "#27ae60" : "#d4af37");

  return (
    <div className="item-alerta-row">
      <div className={`item-info ${isCritico ? 'critico' : ''}`}>
        <span>{label} {isCritico ? '⚠️' : ''}</span>
        <span>{info}</span>
      </div>
      <div className="bar-track-alerta">
        <div className="bar-fill-alerta" style={{ width: `${perc}%`, background: corBarra }}></div>
      </div>
    </div>
  );
};

const ValorAlerta = ({ atual, limite, label }) => {
  const isCritico = atual >= limite;
  return (
    <div style={{ textAlign: 'center', padding: '10px' }}>
      <div style={{ fontSize: '12px', color: isCritico ? '#e74c3c' : '#888' }}>{label}</div>
      <h4 style={{ color: isCritico ? '#e74c3c' : '#1a1a1a', margin: '5px 0' }}>R$ {atual.toLocaleString('pt-BR')}</h4>
      <div className="bar-track-alerta"><div className="bar-fill-alerta" style={{ width: `${Math.min((atual/limite)*100, 100)}%`, background: isCritico ? '#e74c3c' : '#d4af37' }}></div></div>
    </div>
  );
};

const ToggleButton = () => (
  <label className="switch"><input type="checkbox" defaultChecked /><span className="slider"></span></label>
);

export default Alertas;