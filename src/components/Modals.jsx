import React from 'react';

const ModalRelatorio = ({ modalTipo, setModalTipo, listaParados, contagem, contagemColecao, veryPeri, branco }) => {
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

export default ModalRelatorio;