import { formatCurrency } from '../utils/formatCurrency';
import React, { useState } from 'react';
import './Financeiro.css';

const Clientes = ({ subsecao }) => {
  const [clienteSelecionado, setClienteSelecionado] = useState(null);
  const [observacaoAtiva, setObservacaoAtiva] = useState("");

  // Banco de Dados Simulado com o novo campo 'observacoes'
  const clientesData = [
    { 
      id: 1, 
      nome: 'Beatriz Vasconcelos', 
      cidade: 'Belém', 
      estado: 'PA', 
      email: 'beatriz@email.com', 
      tel: '(91) 98122-3344', 
      status: 'VIP',
      observacoes: "Gosta de tons pastéis e mesas clássicas. Tem casa em Salinas e costuma comprar kits de 12 lugares para recepções de verão. Prefere acabamento em guipir.",
      historico: [
        { data: '15/01/2026', pedido: '#1050', itens: '12 Guardanapos Guipir Brancos', valor: 680.00 },
        { data: '10/11/2025', pedido: '#0980', itens: '12 Jogo Americano Linho', valor: 840.00 }
      ]
    },
    { 
      id: 2, 
      nome: 'Helena Ferreira', 
      cidade: 'São Paulo', 
      estado: 'SP', 
      email: 'helena@uol.com.br', 
      tel: '(11) 97766-5544', 
      status: 'Normal',
      observacoes: "Arquiteta, prefere itens minimalistas e cores sólidas.",
      historico: [
        { data: '20/12/2025', pedido: '#1012', itens: '2 PG Limão Siciliano', valor: 64.00 }
      ]
    },
  ];

  const clientesExibidos = subsecao === 'Cliente VIP' 
    ? clientesData.filter(c => c.status === 'VIP') 
    : clientesData;

  const selecionarCliente = (c) => {
    setClienteSelecionado(c);
    setObservacaoAtiva(c.observacoes);
  };

  return (
    <div className="pagina-container">
      <div className="topo-resumo">
        <div className="mini-card"><span>Base Total</span><h3>{clientesData.length}</h3></div>
        <div className="mini-card"><span>Ticket VIP</span><h3>R$ 760,00</h3></div>
        <div className="mini-card"><span>Ativos</span><h3 style={{color: '#27ae60'}}>18</h3></div>
        <div className="mini-card"><span>Sugestões IA</span><h3 style={{color: '#d4af37'}}>05</h3></div>
      </div>

      <div className="quadro-branco">
        <h3 style={{ fontFamily: 'Playfair Display', marginBottom: '25px' }}>
          {subsecao} {clienteSelecionado && ` ❯ Perfil de ${clienteSelecionado.nome}`}
        </h3>

        {!clienteSelecionado ? (
          <table className="tabela-padrao">
            <thead>
              <tr><th>Nome</th><th>Localidade</th><th>Telefone</th><th>Status</th><th>Ação</th></tr>
            </thead>
            <tbody>
              {clientesExibidos.map(c => (
                <tr key={c.id} className="linha-clicavel" onClick={() => selecionarCliente(c)}>
                  <td><strong>{c.nome}</strong></td>
                  <td>{c.cidade}/{c.estado}</td>
                  <td>{c.tel}</td>
                  <td><span style={{ color: c.status === 'VIP' ? '#d4af37' : '#888' }}>{c.status}</span></td>
                  <td><button style={{ cursor: 'pointer' }}>Ver Detalhes</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="perfil-cliente-vip">
            <button onClick={() => setClienteSelecionado(null)} style={{ marginBottom: '20px', cursor: 'pointer' }}>← Voltar</button>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
              
              {/* COLUNA ESQUERDA: OBSERVAÇÕES E IA */}
              <div>
                <div style={{ background: '#fdfaf3', padding: '20px', borderRadius: '20px', border: '1px solid #f5e6ba' }}>
                  <h4 style={{ marginBottom: '10px', color: '#5d4037' }}>📝 Observações da Cecília</h4>
                  <textarea 
                    value={observacaoAtiva}
                    onChange={(e) => setObservacaoAtiva(e.target.value)}
                    placeholder="Insira detalhes sobre gostos, datas especiais, estilo de decoração..."
                    style={{ width: '100%', height: '120px', padding: '10px', borderRadius: '10px', border: '1px solid #ddd', fontFamily: 'inherit', fontSize: '14px', resize: 'none' }}
                  />
                  <button style={{ marginTop: '10px', width: '100%', padding: '10px', background: '#1a1a1a', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                    ATUALIZAR NOTAS
                  </button>
                </div>

                {/* BOX DA INTELIGÊNCIA DE VENDAS */}
                <div style={{ marginTop: '20px', padding: '20px', background: 'linear-gradient(135deg, #fff 0%, #fdfaf3 100%)', borderRadius: '20px', border: '1px solid #d4af37', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: '-10px', right: '-10px', opacity: 0.1, fontSize: '60px' }}>💡</div>
                  <h4 style={{ color: '#d4af37', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>✨</span> Inteligência de Vendas (IA)
                  </h4>
                  <p style={{ fontSize: '13px', lineHeight: '1.6', color: '#555' }}>
                    {clienteSelecionado.status === 'VIP' ? (
                      <>
                        Baseado nas notas sobre <strong>Salinas</strong> e <strong>tons pastéis</strong>, 
                        sugiro oferecer o novo <em>Kit Riviera</em> em linho areia para a próxima temporada de julho. 
                        Como ela compra em grandes quantidades, ofereça o conjunto de 12 lugares com 10% de desconto antecipado.
                      </>
                    ) : (
                      "Adicione mais observações para que a IA possa gerar sugestões de venda personalizadas."
                    )}
                  </p>
                  <button style={{ marginTop: '15px', background: 'none', border: '1px solid #d4af37', color: '#d4af37', padding: '8px 15px', borderRadius: '20px', fontSize: '12px', cursor: 'pointer', fontWeight: 'bold' }}>
                    GERAR NOVA ESTRATÉGIA
                  </button>
                </div>
              </div>

              {/* COLUNA DIREITA: HISTÓRICO RÁPIDO */}
              <div>
                <h4 style={{ marginBottom: '15px' }}>📜 Últimos Pedidos</h4>
                <table className="tabela-padrao">
                  <thead>
                    <tr><th>Data</th><th>Pedido</th><th>Valor</th></tr>
                  </thead>
                  <tbody>
                    {clienteSelecionado.historico.map((h, i) => (
                      <tr key={i}>
                        <td>{h.data}</td>
                        <td><strong>{h.pedido}</strong></td>
                        <td style={{ color: '#27ae60' }}>{formatCurrency(h.valor)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div style={{ marginTop: '20px', padding: '15px', background: '#f9f9f9', borderRadius: '15px' }}>
                  <p style={{ fontSize: '14px' }}><strong>Status:</strong> Cliente {clienteSelecionado.status}</p>
                  <p style={{ fontSize: '14px' }}><strong>Local:</strong> {clienteSelecionado.cidade}/{clienteSelecionado.estado}</p>
                  <p style={{ fontSize: '14px' }}><strong>WhatsApp:</strong> {clienteSelecionado.tel}</p>
                </div>
              </div>

            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Clientes;