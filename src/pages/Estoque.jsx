import React, { useState } from 'react';
import './Financeiro.css';

const Estoque = ({ subsecao }) => {
  const [pastaAtiva, setPastaAtiva] = useState('Insumos');
  const [itemSelecionado, setItemSelecionado] = useState(null);
  const [nfDigitada, setNfDigitada] = useState('');

  // Banco de Dados Simulado
  const [fornecedores] = useState([
    { id: 1, nome: 'Armarinho Belém', cidade: 'Belém/PA', contato: 'Dona Maria', tel: '(91) 98888-7777' },
    { id: 2, nome: 'Tecidos Import', cidade: 'São Paulo/SP', contato: 'Ricardo', tel: '(11) 97777-6666' }
  ]);

  return (
    <div className="pagina-container">
      {/* 1. TOPO DE RESUMO - PADRONIZADO */}
      <div className="topo-resumo">
        <div className="mini-card"><span>Total Itens</span><h3>820</h3></div>
        <div className="mini-card"><span>Custo Total</span><h3 style={{color: '#e74c3c'}}>R$ 11.940</h3></div>
        <div className="mini-card"><span>Valor Venda</span><h3 style={{color: '#27ae60'}}>R$ 33.700</h3></div>
        <div className="mini-card"><span>Lucro Previsto</span><h3 style={{color: '#d4af37'}}>R$ 21.760</h3></div>
      </div>

      {/* 2. SELEÇÃO DE PASTAS (Apenas no Catálogo) */}
      {subsecao === 'Catálogo' && (
        <div style={{ display: 'flex', gap: '5px' }}>
          {['Insumos', 'Porta Guardanapo', 'Jogo Americano', 'Guardanapo', 'Diversos'].map(pasta => (
            <button 
              key={pasta} 
              onClick={() => {setPastaAtiva(pasta); setItemSelecionado(null);}}
              style={{
                padding: '12px 20px', borderRadius: '15px 15px 0 0', border: '1px solid #f5e6ba', borderBottom: 'none',
                background: pastaAtiva === pasta ? '#d4af37' : 'white',
                color: pastaAtiva === pasta ? 'white' : '#888', cursor: 'pointer', fontFamily: 'Playfair Display'
              }}
            >
              {pasta}
            </button>
          ))}
        </div>
      )}

      {/* 3. QUADRO BRANCO PRINCIPAL */}
      <div className="quadro-branco" style={{ borderRadius: subsecao === 'Catálogo' ? '0 25px 25px 25px' : '25px' }}>
        <h3 style={{ fontFamily: 'Playfair Display', marginBottom: '25px', color: '#5d4037' }}>
          {subsecao} {subsecao === 'Catálogo' && ` ❯ ${pastaAtiva}`}
        </h3>

        {/* CONTEÚDO: VISÃO GERAL */}
        {subsecao === 'Visão Geral' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
            {['Porta Guardanapos', 'Guardanapos', 'Jogo Americano', 'Diversos'].map(cat => (
              <div key={cat} style={{ padding: '20px', background: '#fdfaf3', borderRadius: '20px', border: '1px solid #f5e6ba' }}>
                <h4 style={{ color: '#d4af37', marginBottom: '10px' }}>{cat}</h4>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}><span>Modelos:</span><strong>--</strong></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginTop: '5px' }}><span>Lucro:</span><strong style={{color: '#27ae60'}}>R$ 0,00</strong></div>
              </div>
            ))}
          </div>
        )}

        {/* CONTEÚDO: CATÁLOGO */}
        {subsecao === 'Catálogo' && !itemSelecionado && (
          <table className="tabela-padrao">
            <thead>
              <tr><th>Item</th><th>Saldo Atual</th><th>Custo Unit.</th><th>NF Ref.</th></tr>
            </thead>
            <tbody>
              <tr className="linha-clicavel" onClick={() => setItemSelecionado({nome: 'Fita Neon'})}>
                <td><strong>Exemplo de Item</strong></td><td>--</td><td>R$ 0,00</td><td>--</td>
              </tr>
            </tbody>
          </table>
        )}

        {/* CONTEÚDO: FORNECEDORES */}
        {subsecao === 'Fornecedores' && (
          <>
            <div style={{ background: '#fdfaf3', padding: '20px', borderRadius: '20px', marginBottom: '30px', border: '1px solid #f5e6ba' }}>
              <h4 style={{ marginBottom: '15px', fontSize: '14px', color: '#5d4037' }}>Novo Fornecedor</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                <input type="text" placeholder="Nome / Empresa" className="input-manual" style={{ padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }} />
                <input type="text" placeholder="Cidade/UF" className="input-manual" style={{ padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }} />
                <input type="text" placeholder="Contato Pessoal" className="input-manual" style={{ padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }} />
                <input type="text" placeholder="Telefone/WhatsApp" className="input-manual" style={{ padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }} />
                <input type="email" placeholder="E-mail" className="input-manual" style={{ padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }} />
                <button style={{ background: '#d4af37', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>CADASTRAR</button>
              </div>
            </div>

            <table className="tabela-padrao">
              <thead>
                <tr><th>Nome</th><th>Localidade</th><th>Contato</th><th>WhatsApp</th></tr>
              </thead>
              <tbody>
                {fornecedores.map(f => (
                  <tr key={f.id}>
                    <td><strong>{f.nome}</strong></td>
                    <td>{f.cidade}</td>
                    <td>{f.contato}</td>
                    <td><button style={{ background: '#25d366', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '5px', fontSize: '11px', cursor: 'pointer' }}>WhatsApp</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        {/* CONTEÚDO: ENTRADA (ATUALIZADO COM NOVAS CATEGORIAS E UNIDADES) */}
        {subsecao === 'Entrada' && (
          <div style={{ maxWidth: '800px' }}>
            <div style={{ background: '#fdfaf3', padding: '25px', borderRadius: '20px', border: '1px solid #f5e6ba' }}>
              <h4 style={{ marginBottom: '20px', color: '#5d4037' }}>Registrar Entrada Manual</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
                
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ fontSize: '12px', color: '#888' }}>Nome do Item</label>
                  <input type="text" placeholder="Escreva o nome exato do item..." className="input-manual" style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #ddd', marginTop: '5px' }} />
                </div>

                <div>
                  <label style={{ fontSize: '12px', color: '#888' }}>Tipo de Produto / Categoria</label>
                  <select style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #ddd', marginTop: '5px', background: 'white' }}>
                    <option>Insumos</option>
                    <option>Porta Guardanapo</option>
                    <option>Jogo americano</option>
                    <option>Guardanapo</option>
                    <option>Diversos</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '12px', color: '#888' }}>Unidade de Medida</label>
                  <select style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #ddd', marginTop: '5px', background: 'white' }}>
                    <option>Unidades (un)</option>
                    <option>Centímetros (cm)</option>
                    <option>Metros (m)</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '12px', color: '#888' }}>Quantidade</label>
                  <input type="number" placeholder="0.00" style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #ddd', marginTop: '5px' }} />
                </div>

                <div>
                  <label style={{ fontSize: '12px', color: '#888' }}>Nº Nota Fiscal</label>
                  <input type="text" placeholder="Ex: 1234" value={nfDigitada} onChange={(e) => setNfDigitada(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #ddd', marginTop: '5px' }} />
                </div>

                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ fontSize: '12px', color: '#888' }}>Documentação</label>
                  {nfDigitada === '1234' ? (
                    <div style={{ background: '#e8f5e9', color: '#2e7d32', padding: '12px', borderRadius: '10px', marginTop: '5px', fontSize: '13px', border: '1px solid #c8e6c9' }}>
                      ✅ Foto da NF 1234 já vinculada.
                    </div>
                  ) : (
                    <button style={{ width: '100%', padding: '12px', background: '#d4af37', color: 'white', border: 'none', borderRadius: '10px', marginTop: '5px', cursor: 'pointer', fontWeight: 'bold' }}>
                      📷 Carregar Nova Foto da NF
                    </button>
                  )}
                </div>

                <button style={{ gridColumn: 'span 2', padding: '15px', background: '#1a1a1a', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', fontSize: '16px', marginTop: '10px', cursor: 'pointer' }}>
                  SALVAR NO ESTOQUE
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Estoque;