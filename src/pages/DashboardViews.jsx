import React from 'react';

// --- TELA VISÃO GERAL ---
export const VisaoGeralView = ({ fin, lucroReal, motorVendas, estoqueProdutos, maisVendidoNome, ticketMedio, listaParados, colecaoDestaque, contagemColecao, setModalTipo, veryPeri, borda, branco }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', height: '100%' }}>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px' }}>
      <div style={{ backgroundColor: branco, padding: '15px', borderRadius: '12px', border: `1px solid ${borda}`, textAlign: 'center' }}>
        <span style={{ fontSize: '10px', color: '#888', textTransform: 'uppercase' }}>Faturamento</span>
        <h3 style={{ color: veryPeri, fontSize: '20px' }}>R$ {fin.faturamento.toFixed(2)}</h3>
      </div>
      <div style={{ backgroundColor: branco, padding: '15px', borderRadius: '12px', border: `1px solid ${borda}`, textAlign: 'center' }}>
        <span style={{ fontSize: '10px', color: '#888', textTransform: 'uppercase' }}>Lucro Real</span>
        <h3 style={{ color: '#27AE60', fontSize: '20px' }}>R$ {lucroReal.toFixed(2)}</h3>
      </div>
      <div style={{ backgroundColor: branco, padding: '15px', borderRadius: '12px', border: `1px solid ${borda}`, textAlign: 'center' }}>
        <span style={{ fontSize: '10px', color: '#888', textTransform: 'uppercase' }}>Pedidos</span>
        <h3 style={{ color: veryPeri, fontSize: '20px' }}>{motorVendas.length}</h3>
      </div>
      <div style={{ backgroundColor: branco, padding: '15px', borderRadius: '12px', border: `1px solid ${borda}`, textAlign: 'center' }}>
        <span style={{ fontSize: '10px', color: '#888', textTransform: 'uppercase' }}>Clientes</span>
        <h3 style={{ color: veryPeri, fontSize: '20px' }}>3</h3>
      </div>
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', gap: '20px', flexGrow: 1 }}>
      <div style={{ backgroundColor: branco, padding: '25px', borderRadius: '16px', border: `1px solid ${borda}` }}>
        <h2 style={{ color: veryPeri, fontSize: '16px', marginBottom: '15px' }}>Financeiro Mensal</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Acumulado:</span> <strong>R$ {fin.faturamento.toFixed(2)}</strong></div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Pix:</span> <strong style={{color:'#27AE60'}}>R$ {fin.pix.toFixed(2)}</strong></div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Cartão:</span> <strong>R$ {fin.cartao.toFixed(2)}</strong></div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Taxas/Desc:</span> <strong style={{color:'#E74C3C'}}>-R$ {(fin.taxas + fin.descontos).toFixed(2)}</strong></div>
        </div>
      </div>
      <div style={{ backgroundColor: branco, padding: '25px', borderRadius: '16px', border: `1px solid ${borda}` }}>
        <h2 style={{ color: veryPeri, fontSize: '16px', marginBottom: '15px' }}>Estoque Atual</h2>
        {estoqueProdutos.map(p => (
          <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '5px' }}><span>{p.nome}:</span> <strong>{p.atual} un.</strong></div>
        ))}
      </div>
      <div style={{ backgroundColor: branco, padding: '25px', borderRadius: '16px', border: `1px solid ${borda}` }}>
        <h2 style={{ color: veryPeri, fontSize: '16px', marginBottom: '15px' }}>Inteligência</h2>
        <div onClick={() => setModalTipo('vendidos')} style={{ cursor: 'pointer', marginBottom: '10px' }}>Mais vendido: <strong>{maisVendidoNome} ❯</strong></div>
        <div style={{ marginBottom: '10px' }}>Ticket Médio: <strong>R$ {ticketMedio.toFixed(2)}</strong></div>
        <div onClick={() => setModalTipo('parados')} style={{ cursor: 'pointer', color: '#E74C3C' }}>Produtos Parados: <strong>{listaParados.length} ❯</strong></div>
      </div>
      <div style={{ backgroundColor: branco, padding: '25px', borderRadius: '16px', border: `1px solid ${borda}` }}>
        <h2 style={{ color: veryPeri, fontSize: '16px', marginBottom: '15px' }}>Coleções</h2>
        <div onClick={() => setModalTipo('colecao')} style={{ cursor: 'pointer' }}>Destaque: <strong>{colecaoDestaque} ({contagemColecao[colecaoDestaque]} un.) ❯</strong></div>
      </div>
    </div>
  </div>
);

// --- TELA METAS ---
export const MetasView = ({ metas, handleMetaChange, veryPeri, borda, branco }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', height: '100%' }}>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
      <div style={{ backgroundColor: branco, padding: '20px', borderRadius: '16px', border: `1px solid ${borda}` }}>
        <h2 style={{ color: veryPeri, fontSize: '14px', textTransform: 'uppercase' }}>Metas do Mês</h2>
        <p>PG: {metas.pg} | JA: {metas.ja} | G: {metas.guardanapo}</p>
      </div>
      <div style={{ backgroundColor: branco, padding: '20px', borderRadius: '16px', border: `1px solid ${borda}` }}>
        <h2 style={{ color: veryPeri, fontSize: '14px', textTransform: 'uppercase' }}>Meta Campanha</h2>
        <p>Coleção: {metas.pgColecao} | Combos: {metas.combo}</p>
      </div>
    </div>
    <div style={{ backgroundColor: branco, padding: '30px', borderRadius: '16px', border: `1px solid ${borda}`, flexGrow: 1 }}>
      <h2 style={{ color: veryPeri, fontSize: '18px', marginBottom: '20px' }}>Configurar Metas</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
        <input type="number" name="pg" value={metas.pg} onChange={handleMetaChange} placeholder="Meta PG" />
        <input type="number" name="ja" value={metas.ja} onChange={handleMetaChange} placeholder="Meta JA" />
        <input type="number" name="guardanapo" value={metas.guardanapo} onChange={handleMetaChange} placeholder="Meta Guardanapo" />
      </div>
    </div>
  </div>
);

// --- TELA ALERTAS ---
export const AlertasView = ({ estoqueProdutos, estoqueInsumos, regrasAlerta, novaRegra, setNovaRegra, adicionarRegra, removerRegra, alertasAtivos, veryPeri, borda, branco }) => (
  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', height: '100%' }}>
    <div style={{ backgroundColor: branco, padding: '20px', borderRadius: '16px', border: `1px solid ${borda}` }}>
      <h4 style={{ color: veryPeri }}>Novo Alerta Produto</h4>
      <select onChange={(e) => setNovaRegra({...novaRegra, alvo: e.target.value, tipo: 'produto'})} style={{width:'100%', margin:'10px 0'}}>
        <option value="">Selecionar...</option>
        {estoqueProdutos.map(p => <option key={p.id} value={p.nome}>{p.nome}</option>)}
      </select>
      <input type="number" placeholder="Limite" onChange={(e) => setNovaRegra({...novaRegra, limite: e.target.value})} style={{width:'100%'}} />
      <button onClick={adicionarRegra} style={{backgroundColor:veryPeri, color:'#fff', width:'100%', marginTop:'10px', border:'none', padding:'10px', borderRadius:'8px'}}>Adicionar</button>
    </div>
    <div style={{ backgroundColor: branco, padding: '20px', borderRadius: '16px', border: `1px solid ${borda}` }}>
      <h4 style={{ color: veryPeri }}>Novo Alerta Insumo</h4>
      <select onChange={(e) => setNovaRegra({...novaRegra, alvo: e.target.value, tipo: 'insumo'})} style={{width:'100%', margin:'10px 0'}}>
        <option value="">Selecionar...</option>
        {estoqueInsumos.map(i => <option key={i.id} value={i.nome}>{i.nome}</option>)}
      </select>
      <button onClick={adicionarRegra} style={{backgroundColor:'#444', color:'#fff', width:'100%', border:'none', padding:'10px', borderRadius:'8px'}}>Adicionar</button>
    </div>
    <div style={{ backgroundColor: branco, padding: '20px', borderRadius: '16px', border: `1px solid ${borda}` }}>
      <h4>Regras Ativas</h4>
      {regrasAlerta.map(r => <div key={r.id} style={{display:'flex', justifyContent:'space-between', fontSize:'12px'}}>{r.alvo} ({r.limite}) <button onClick={()=>removerRegra(r.id)} style={{color:'red'}}>X</button></div>)}
    </div>
    <div style={{ backgroundColor: branco, padding: '20px', borderRadius: '16px', border: `2px solid #E74C3C` }}>
      <h4>Monitor do Vigia</h4>
      {alertasAtivos.map(a => <div key={a.id} style={{color:'#E74C3C', fontWeight:'bold'}}>⚠️ {a.alvo} baixo!</div>)}
    </div>
  </div>
);