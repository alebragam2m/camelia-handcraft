import React, { useState } from 'react';
import { db } from '../services/db';
import { formatCurrency } from '../utils/formatCurrency';

export default function StockHistoryModule({ produtos, onStockChange }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [adjustForm, setAdjustForm] = useState({ change_type: 'Entrada', quantity: '', reason: '' });

  const fetchLogs = async (productId) => {
     setLoading(true);
     try {
       const data = await db.getStockLogs(productId);
       setLogs(data || []);
     } catch (err) { console.error("Erro logs:", err); }
     setLoading(false);
  }

  const openLogViewer = (prod) => {
     setSelectedProduct(prod);
     fetchLogs(prod.id);
  }

  const handleAdjustStock = async (e) => {
     e.preventDefault();
     const qty = parseInt(adjustForm.quantity);
     if(isNaN(qty) || qty <= 0) return alert("Quantidade inválida.");

     const currentStock = selectedProduct.stock;
     let finalStock = currentStock;

     if(adjustForm.change_type === 'Entrada') finalStock += qty;
     else finalStock -= qty;

     if(finalStock < 0) return alert("Erro: O estoque não pode ficar negativo.");

     try {
       // Atualiza Produto diretamente
       await db.upsertProduct({ stock: finalStock }, selectedProduct.id);

       // Grava Auditoria diretamente
       await db.logInventoryChange({
          product_id: selectedProduct.id,
          change_type: adjustForm.change_type,
          quantity_changed: adjustForm.change_type === 'Entrada' ? qty : -qty,
          new_stock_total: finalStock,
          reason: adjustForm.reason || 'Ajuste manual via Painel PCP'
       });

       setIsAdjustModalOpen(false);
       setAdjustForm({ change_type: 'Entrada', quantity: '', reason: '' });
       setSelectedProduct(null); 
       alert("Estoque calibrado com sucesso!");
       if(onStockChange) onStockChange(); // Refresh local no Dashboard pai
     } catch (err) {
       alert("Falha operacional: " + err.message);
     }
  }

  const totalEmAcervo = produtos.reduce((acc, p) => acc + p.stock, 0);
  const valorEstocado = produtos.reduce((acc, p) => acc + (p.stock * Number(p.cost)), 0);

  return (
    <div className="animate-fade-in-down space-y-6">
       
       <div className="flex justify-between items-center bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
           <div>
               <h2 className="text-3xl font-serif font-bold text-secundaria mb-1 flex items-center gap-3">PCP & Inventário Fabril <span>📦</span></h2>
               <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">Controle de Saídas, Entradas e Custos Armazenados.</p>
           </div>
           <div className="text-right border-l pl-6 border-gray-100">
               <p className="text-2xl font-serif font-bold text-secundaria">{totalEmAcervo} <span className="text-sm font-sans text-gray-400">peças ativas</span></p>
               <p className="text-[10px] text-orange-500 uppercase font-bold tracking-widest mt-1">~{formatCurrency(valorEstocado)} imobilizados</p>
           </div>
       </div>

       {/* CATALOGO COM BOTOES DE PCP */}
       <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 font-bold uppercase tracking-widest text-[10px]">
               <tr>
                  <th className="p-5 pl-8">Obra de Arte (Produto)</th>
                  <th className="p-5 text-center">Peças no Galpão</th>
                  <th className="p-5 text-right pr-8">Auditoria de PCP</th>
               </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
               {produtos.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                     <td className="p-5 pl-8 font-bold text-secundaria text-base">{p.nome}</td>
                     <td className="p-5 text-center">
                        <span className={`px-4 py-2 rounded-lg font-bold text-lg ${p.stock <= 5 ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-700'}`}>{p.stock}</span>
                     </td>
                     <td className="p-5 text-right pr-8">
                        <button onClick={() => openLogViewer(p)} className="text-[10px] bg-secundaria text-white px-4 py-2 rounded-lg font-bold uppercase tracking-widest hover:bg-black transition-colors">Histórico de Cortes</button>
                     </td>
                  </tr>
               ))}
            </tbody>
          </table>
       </div>

       {/* MODAL VIEW HISTÓRICO & AJUSTE */}
       {selectedProduct && (
          <div className="fixed inset-0 bg-secundaria/80 backdrop-blur z-[100] flex items-center justify-center p-4">
             <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col border border-white/20">
                 <div className="bg-gray-50 px-8 py-6 border-b border-gray-100 flex justify-between items-center rounded-t-3xl">
                     <div>
                        <h3 className="font-serif font-bold text-secundaria text-2xl">Dossiê de Estoque</h3>
                        <p className="text-primaria font-bold uppercase text-[10px] tracking-widest mt-1">{selectedProduct.nome}</p>
                     </div>
                     <button onClick={() => setSelectedProduct(null)} className="text-gray-400 hover:text-red-500 font-bold text-[10px] uppercase">Fechar [X]</button>
                 </div>

                 <div className="flex flex-col md:flex-row h-full overflow-hidden">
                    {/* Painel de Logs */}
                    <div className="flex-1 p-8 overflow-y-auto bg-white border-r border-gray-100">
                       <h4 className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-6">Timeline Logística da Peça</h4>
                       {loading ? <p className="animate-pulse text-xs font-bold text-gray-400">Extraindo logs do Supabase...</p> : (
                          <div className="space-y-4">
                             {logs.length > 0 ? logs.map(l => (
                                <div key={l.id} className="bg-gray-50 border border-gray-100 p-4 rounded-xl flex justify-between items-center">
                                   <div>
                                      <p className="font-bold text-secundaria text-sm">{l.reason || 'Alteração Sistêmica'}</p>
                                      <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mt-1">{new Date(l.created_at).toLocaleString('pt-BR')} via {l.change_type}</p>
                                   </div>
                                   <div className="text-right">
                                      <p className={`font-bold text-lg ${l.quantity_changed > 0 ? 'text-emerald-500' : 'text-red-500'}`}>{l.quantity_changed > 0 ? '+' : ''}{l.quantity_changed}</p>
                                      <p className="text-[9px] text-gray-400 uppercase font-bold tracking-widest">Total: {l.new_stock_total}</p>
                                   </div>
                                </div>
                             )) : <p className="text-xs text-gray-400 bg-gray-50 p-6 rounded-xl border-dashed border font-bold text-center">Nenhum registro de movimentação rastreável anterior a migração do módulo.</p>}
                          </div>
                       )}
                    </div>
                    
                    {/* Painel de Interação (Ajuste) */}
                    <div className="w-full md:w-80 bg-gray-50 p-8 flex flex-col justify-center">
                       <div className="bg-secundaria text-white p-6 rounded-2xl shadow-lg mb-8 text-center border-b-[4px] border-primaria">
                           <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold mb-1">Peças Físicas Atuais</p>
                           <p className="text-5xl font-serif font-bold">{selectedProduct.stock}</p>
                       </div>

                       {!isAdjustModalOpen ? (
                          <button onClick={() => setIsAdjustModalOpen(true)} className="w-full bg-white border-2 border-primaria text-primaria font-bold py-4 rounded-xl uppercase tracking-widest text-[10px] hover:bg-primaria hover:text-white transition-colors">
                             Fazer Corte / Inserção Manual
                          </button>
                       ) : (
                          <form onSubmit={handleAdjustStock} className="animate-fade-in-up space-y-4">
                              <div>
                                 <label className="text-[9px] font-bold uppercase tracking-widest text-gray-500 mb-1 block">Ação Logística</label>
                                 <select value={adjustForm.change_type} onChange={e => setAdjustForm({...adjustForm, change_type: e.target.value})} className="w-full p-3 rounded-lg border text-sm font-bold text-secundaria outline-none">
                                    <option>Entrada</option>
                                    <option>Saída Manual</option>
                                    <option>Ajuste / Avária</option>
                                 </select>
                              </div>
                              <div>
                                 <label className="text-[9px] font-bold uppercase tracking-widest text-gray-500 mb-1 block">Qtd de Peças</label>
                                 <input type="number" min="1" required value={adjustForm.quantity} onChange={e => setAdjustForm({...adjustForm, quantity: e.target.value})} className="w-full p-3 rounded-lg border text-sm font-bold text-secundaria outline-none text-center" />
                              </div>
                              <div>
                                 <label className="text-[9px] font-bold uppercase tracking-widest text-gray-500 mb-1 block">Motivo Contábil</label>
                                 <input type="text" value={adjustForm.reason} onChange={e => setAdjustForm({...adjustForm, reason: e.target.value})} placeholder="Ex: Tecido Rasgou, Nova Remessa" className="w-full p-3 rounded-lg border text-sm font-bold text-secundaria outline-none" />
                              </div>
                              <div className="flex gap-2 pt-2">
                                 <button type="submit" className="flex-1 bg-secundaria text-white font-bold py-3 rounded-xl uppercase tracking-widest text-[10px] hover:bg-black">Salvar</button>
                                 <button type="button" onClick={() => setIsAdjustModalOpen(false)} className="bg-gray-200 text-gray-500 font-bold px-4 rounded-xl uppercase tracking-widest text-[10px]">X</button>
                              </div>
                          </form>
                       )}
                    </div>
                 </div>
             </div>
          </div>
       )}
    </div>
  )
}
