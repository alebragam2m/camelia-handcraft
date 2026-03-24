import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';

function AdminDashboard() {
  const [menuAtivo, setMenuAtivo] = useState('Dashboard');
  const [submenuAtivo, setSubmenuAtivo] = useState('Visão Geral');
  const [modalTipo, setModalTipo] = useState(null);

  // --- ESTADO PARA CONFIGURAÇÃO DE METAS ---
  const [metas, setMetas] = useState({
    pg: 100,
    ja: 50,
    guardanapo: 200,
    pgColecao: 80,
    combo: 30
  });

  const handleMetaChange = (e) => {
    const { name, value } = e.target;
    setMetas(prev => ({ ...prev, [name]: parseInt(value) || 0 }));
  };

  // --- SUPABASE DATA ---
  const [estoqueProdutos, setEstoqueProdutos] = useState([]);
  const [motorVendas, setMotorVendas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const { data: prods } = await supabase.from('products').select('*');
      const { data: vendas } = await supabase.from('sales').select('*');
      
      if (prods) {
        setEstoqueProdutos(prods.map(p => ({ nome: p.nome, atual: p.atual, dataEntrada: p.data_entrada, colecao: p.colecao })));
      }
      if (vendas) {
        setMotorVendas(vendas.map(v => ({ id: v.id, produto: v.produto, valor: Number(v.valor), custo: Number(v.custo), metodo: v.metodo, desconto: Number(v.desconto), taxaCartao: Number(v.taxa_cartao), colecao: v.colecao })));
      }
      setLoading(false);
    }
    fetchData();
  }, []);

  // --- LÓGICA DE CÁLCULOS ---
  const fin = motorVendas.reduce((acc, v) => {
    acc.faturamento += v.valor;
    acc.custos += v.custo;
    acc.descontos += v.desconto;
    acc.taxas += v.taxaCartao;
    if (v.metodo === 'Pix') acc.pix += v.valor;
    if (v.metodo === 'Cartão de crédito') acc.cartao += v.valor;
    return acc;
  }, { faturamento: 0, custos: 0, pix: 0, cartao: 0, taxas: 0, descontos: 0 });

  const lucroReal = fin.faturamento - fin.custos - fin.taxas - fin.descontos;
  const ticketMedio = motorVendas.length > 0 ? fin.faturamento / motorVendas.length : 0;
  const contagem = motorVendas.reduce((acc, v) => { acc[v.produto] = (acc[v.produto] || 0) + 1; return acc; }, {});
  const maisVendidoNome = Object.keys(contagem).reduce((a, b) => contagem[a] > contagem[b] ? a : b, '---');
  const contagemColecao = motorVendas.reduce((acc, v) => { acc[v.colecao] = (acc[v.colecao] || 0) + 1; return acc; }, {});
  const colecaoDestaque = Object.keys(contagemColecao).reduce((a, b) => contagemColecao[a] > contagemColecao[b] ? a : b, '---');
  
  const listaParados = estoqueProdutos.filter(p => {
    const entrada = new Date(p.dataEntrada);
    const meses = (new Date('2026-01-24').getFullYear() - entrada.getFullYear()) * 12 + (new Date('2026-01-24').getMonth() - entrada.getMonth());
    return meses >= 3;
  });

  const menuEstrutura = {
    Dashboard: ['Visão Geral', 'Metas', 'Alertas'],
    Financeiro: ['Fluxo de Caixa', 'Contas a Pagar', 'Relatórios'],
    Vendas: ['Pedidos Pendentes', 'Histórico', 'Faturamento'],
    Estoque: ['Visão Geral', 'Catálogo', 'Fornecedores', 'Entrada'],
    CLIENTES: ['Clientes', 'Cliente VIP']
  };

  const veryPeri = '#6667AB';
  const branco = '#FFFFFF';
  const borda = 'rgba(102, 103, 171, 0.1)';

  // --- MODAL INTERATIVO ---
  const ModalRelatorio = () => {
    if (!modalTipo) return null;
    let titulo = "";
    let conteudo = [];
    if (modalTipo === 'parados') {
      titulo = "Modelos Parados (+3 meses)";
      conteudo = listaParados.map(p => ({ n: p.nome, v: `${p.atual} un.` }));
    } else if (modalTipo === 'vendidos') {
      titulo = "Ranking de Modelos";
      conteudo = Object.entries(contagem).map(([n, q]) => ({ n, v: `${q} un.` }));
    } else if (modalTipo === 'colecao') {
      titulo = "Vendas por Coleção";
      conteudo = Object.entries(contagemColecao).map(([n, q]) => ({ n, v: `${q} pedidos` }));
    }
    return (
      <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
        <div style={{ backgroundColor: branco, padding: '25px', borderRadius: '16px', width: '380px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
            <h2 style={{ color: veryPeri, fontSize: '14px', fontWeight: '700', margin: 0 }}>{titulo}</h2>
            <button onClick={() => setModalTipo(null)} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '18px' }}>✕</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {conteudo.map((item, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', paddingBottom: '5px', borderBottom: '1px solid #F0F0F0' }}>
                <span>{item.n}</span><strong>{item.v}</strong>
              </div>
            ))}
          </div>
          <button onClick={() => setModalTipo(null)} style={{ width: '100%', marginTop: '20px', padding: '10px', backgroundColor: veryPeri, color: branco, border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>Fechar</button>
        </div>
      </div>
    );
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: "'Inter', sans-serif", backgroundColor: '#F8F8FC', overflow: 'hidden' }}>
      
      <aside style={{ width: '240px', backgroundColor: branco, borderRight: `1px solid ${borda}`, display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <h2 style={{ color: veryPeri, margin: 0, letterSpacing: '2px', fontSize: '20px' }}>CAMÉLIA</h2>
          <span style={{ fontSize: '10px', opacity: 0.5, letterSpacing: '4px' }}>HANDCRAFT</span>
        </div>
        <nav style={{ padding: '10px', flexGrow: 1, overflowY: 'auto' }}>
          {Object.keys(menuEstrutura).map(menu => (
            <div key={menu} style={{ marginBottom: '5px' }}>
              <div onClick={() => { setMenuAtivo(menu); setSubmenuAtivo(menuEstrutura[menu][0]); }}
                style={{ padding: '10px 14px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', backgroundColor: menuAtivo === menu ? veryPeri : 'transparent', color: menuAtivo === menu ? branco : '#444', fontWeight: '600' }}>
                {menu}
              </div>
              {menuAtivo === menu && (
                <div style={{ paddingLeft: '15px', marginTop: '4px' }}>
                  {menuEstrutura[menu].map(sub => (
                    <div key={sub} onClick={(e) => { e.stopPropagation(); setSubmenuAtivo(sub); }}
                      style={{ padding: '6px 10px', fontSize: '12px', cursor: 'pointer', color: submenuAtivo === sub ? veryPeri : '#888', fontWeight: submenuAtivo === sub ? '600' : '400' }}>
                      {sub}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>
      </aside>

      <main style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <header style={{ height: '60px', backgroundColor: branco, borderBottom: `1px solid ${borda}`, display: 'flex', alignItems: 'center', padding: '0 30px', justifyContent: 'space-between' }}>
          <div style={{ fontSize: '12px', color: '#888' }}>{menuAtivo} ❯ <strong>{submenuAtivo}</strong> {loading && <span style={{marginLeft:'10px', color: '#6667AB', fontSize:'10px', fontWeight:'600'}}>(Atualizando Supabase...)</span>}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
             <span style={{ fontSize: '13px', fontWeight: '600' }}>Cecília</span>
             <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: veryPeri, color: branco, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>C</div>
             <button onClick={handleLogout} style={{marginLeft:'10px', padding:'6px 12px', borderRadius:'6px', cursor:'pointer', border:'1px solid #ccc', backgroundColor:'#fff', fontSize:'12px', fontWeight:'bold', color:veryPeri}}>Sair</button>
          </div>
        </header>

        <section style={{ padding: '25px', overflowY: 'auto', flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
          {submenuAtivo === 'Visão Geral' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', height: '100%' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px' }}>
                <div style={{ backgroundColor: branco, padding: '15px', borderRadius: '12px', border: `1px solid ${borda}`, textAlign: 'center' }}>
                  <span style={{ fontSize: '10px', color: '#888', textTransform: 'uppercase', fontWeight: '600' }}>Faturamento</span>
                  <h3 style={{ color: veryPeri, fontSize: '20px', marginTop: '5px' }}>R$ {fin.faturamento.toFixed(2)}</h3>
                </div>
                <div style={{ backgroundColor: branco, padding: '15px', borderRadius: '12px', border: `1px solid ${borda}`, textAlign: 'center' }}>
                  <span style={{ fontSize: '10px', color: '#888', textTransform: 'uppercase', fontWeight: '600' }}>Lucro Real</span>
                  <h3 style={{ color: '#27AE60', fontSize: '20px', marginTop: '5px' }}>R$ {lucroReal.toFixed(2)}</h3>
                </div>
                <div style={{ backgroundColor: branco, padding: '15px', borderRadius: '12px', border: `1px solid ${borda}`, textAlign: 'center' }}>
                  <span style={{ fontSize: '10px', color: '#888', textTransform: 'uppercase', fontWeight: '600' }}>Pedidos Faturados</span>
                  <h3 style={{ color: veryPeri, fontSize: '20px', marginTop: '5px' }}>{motorVendas.length}</h3>
                </div>
                <div style={{ backgroundColor: branco, padding: '15px', borderRadius: '12px', border: `1px solid ${borda}`, textAlign: 'center' }}>
                  <span style={{ fontSize: '10px', color: '#888', textTransform: 'uppercase', fontWeight: '600' }}>Novos Clientes</span>
                  <h3 style={{ color: veryPeri, fontSize: '20px', marginTop: '5px' }}>3</h3>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', gap: '20px', flexGrow: 1 }}>
                <div style={{ backgroundColor: branco, padding: '25px', borderRadius: '16px', border: `1px solid ${borda}`, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <h2 style={{ color: veryPeri, fontSize: '16px', marginBottom: '15px', fontWeight: '600' }}>Financeiro Mensal</h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Faturamento Acumulado:</span> <strong>R$ {fin.faturamento.toFixed(2)}</strong></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Vendas via Pix:</span> <strong style={{color: '#27AE60'}}>R$ {fin.pix.toFixed(2)}</strong></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Vendas via Cartão:</span> <strong>R$ {fin.cartao.toFixed(2)}</strong></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Taxas e Descontos:</span> <strong style={{color: '#E74C3C'}}>-R$ {(fin.taxas + fin.descontos).toFixed(2)}</strong></div>
                  </div>
                </div>
                <div style={{ backgroundColor: branco, padding: '25px', borderRadius: '16px', border: `1px solid ${borda}`, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <h2 style={{ color: veryPeri, fontSize: '16px', marginBottom: '15px', fontWeight: '600' }}>Estoque Atual</h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px' }}>
                     {estoqueProdutos.map(p => (
                       <div key={p.nome} style={{ display: 'flex', justifyContent: 'space-between' }}><span>{p.nome}:</span> <strong>{p.atual} un.</strong></div>
                     ))}
                  </div>
                </div>
                <div style={{ backgroundColor: branco, padding: '25px', borderRadius: '16px', border: `1px solid ${borda}`, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <h2 style={{ color: veryPeri, fontSize: '16px', marginBottom: '15px', fontWeight: '600' }}>Inteligência de Vendas</h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px' }}>
                    <div onClick={() => setModalTipo('vendidos')} style={{ display: 'flex', justifyContent: 'space-between', cursor: 'pointer' }}>
                      <span>Mais vendido no mês:</span>
                      <strong style={{color: veryPeri}}>{maisVendidoNome} ({contagem[maisVendidoNome]}) ❯</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #F0F0F0', paddingTop: '10px' }}>
                      <span>Ticket Médio:</span>
                      <strong>R$ {ticketMedio.toFixed(2)}</strong>
                    </div>
                    <div onClick={() => setModalTipo('parados')} style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #F0F0F0', paddingTop: '10px', cursor: 'pointer', color: '#E74C3C' }}>
                      <span>Produtos Parados (+3 meses):</span> <strong>{listaParados.length} modelos ❯</strong>
                    </div>
                  </div>
                </div>
                <div style={{ backgroundColor: branco, padding: '25px', borderRadius: '16px', border: `1px solid ${borda}`, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <h2 style={{ color: veryPeri, fontSize: '16px', marginBottom: '15px', fontWeight: '600' }}>Vendas por Coleção</h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px' }}>
                    <div onClick={() => setModalTipo('colecao')} style={{ display: 'flex', flexDirection: 'column', cursor: 'pointer' }}>
                      <span style={{color: '#888'}}>Coleção em Destaque:</span>
                      <strong style={{color: veryPeri, fontSize: '15px', marginTop: '5px'}}>{colecaoDestaque} ({contagemColecao[colecaoDestaque]} un.) ❯</strong>
                    </div>
                    <div style={{ borderTop: '1px solid #F0F0F0', paddingTop: '10px', marginTop: '5px' }}><span>Status:</span> <strong>{Object.keys(contagemColecao).length} coleções ativas</strong></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {submenuAtivo === 'Metas' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', height: '100%' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div style={{ backgroundColor: branco, padding: '20px', borderRadius: '16px', border: `1px solid ${borda}` }}>
                  <h2 style={{ color: veryPeri, fontSize: '14px', marginBottom: '15px', fontWeight: '600', textTransform: 'uppercase' }}>Metas do Mês (Unidades)</h2>
                  <div style={{ display: 'flex', justifyContent: 'space-around' }}>
                    <div style={{ textAlign: 'center' }}><span>PG</span><br/><strong>{metas.pg}</strong></div>
                    <div style={{ textAlign: 'center' }}><span>JA</span><br/><strong>{metas.ja}</strong></div>
                    <div style={{ textAlign: 'center' }}><span>Guardanapo</span><br/><strong>{metas.guardanapo}</strong></div>
                  </div>
                </div>
                <div style={{ backgroundColor: branco, padding: '20px', borderRadius: '16px', border: `1px solid ${borda}` }}>
                  <h2 style={{ color: veryPeri, fontSize: '14px', marginBottom: '15px', fontWeight: '600', textTransform: 'uppercase' }}>Meta Campanha</h2>
                  <div style={{ display: 'flex', justifyContent: 'space-around' }}>
                    <div style={{ textAlign: 'center' }}><span>PG Coleção</span><br/><strong>{metas.pgColecao}</strong></div>
                    <div style={{ textAlign: 'center' }}><span>Combos</span><br/><strong>{metas.combo}</strong></div>
                  </div>
                </div>
              </div>
              <div style={{ backgroundColor: branco, padding: '30px', borderRadius: '16px', border: `1px solid ${borda}`, flexGrow: 1 }}>
                <h2 style={{ color: veryPeri, fontSize: '18px', marginBottom: '25px', fontWeight: '600' }}>Configuração de Meta</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '30px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <h3 style={{ fontSize: '12px', color: '#888', textTransform: 'uppercase' }}>Por Produto</h3>
                    <label style={{ fontSize: '13px' }}>Meta PG (un):</label>
                    <input type="number" name="pg" value={metas.pg} onChange={handleMetaChange} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #DDD' }} />
                    <label style={{ fontSize: '13px' }}>Meta JA (un):</label>
                    <input type="number" name="ja" value={metas.ja} onChange={handleMetaChange} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #DDD' }} />
                    <label style={{ fontSize: '13px' }}>Meta Guardanapo (un):</label>
                    <input type="number" name="guardanapo" value={metas.guardanapo} onChange={handleMetaChange} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #DDD' }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <h3 style={{ fontSize: '12px', color: '#888', textTransform: 'uppercase' }}>Especiais</h3>
                    <label style={{ fontSize: '13px' }}>Meta PG Coleção (un):</label>
                    <input type="number" name="pgColecao" value={metas.pgColecao} onChange={handleMetaChange} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #DDD' }} />
                    <label style={{ fontSize: '13px' }}>Meta Combo (PG+JA+G):</label>
                    <input type="number" name="combo" value={metas.combo} onChange={handleMetaChange} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #DDD' }} />
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>
      </main>
      <ModalRelatorio />
    </div>
  );
}

export default AdminDashboard;