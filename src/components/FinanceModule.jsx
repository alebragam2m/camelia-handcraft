import React, { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { db } from '../services/db';
import { formatCurrency } from '../utils/formatCurrency';

export default function FinanceModule() {
  const { transactions, loading, actions } = useData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const todayStr = new Date().toISOString().split('T')[0];
  const defaultForm = {
     transaction_type: 'Despesa', category: 'Insumos Fabris', description: '', amount: '', status: 'Pago', due_date: todayStr
  };
  const [formData, setFormData] = useState(defaultForm);

  const handleSubmit = async (e) => {
     e.preventDefault();
     setIsSaving(true);
     try {
       const payload = { ...formData, amount: Number(formData.amount.toString().replace(',', '.')) };
       await actions.upsertTransaction(payload);
       setIsModalOpen(false);
       setFormData(defaultForm);
     } catch (err) {
       alert("Erro ao salvar: " + err.message);
     } finally {
       setIsSaving(false);
     }
  };

  const delTrans = async (id) => {
     if(window.confirm('Excluir este lançamento para sempre? Não há volta.')) {
        try {
          await actions.deleteTransaction(id);
        } catch (err) { alert("Erro ao excluir: " + err.message); }
     }
  };
  
  const markAsPaid = async (id) => {
     try {
       await actions.upsertTransaction({ status: 'Pago', payment_date: todayStr }, id);
     } catch (err) { alert("Erro ao atualizar status: " + err.message); }
  };

  // Matematica Mestra
  const receitas = transactions.filter(t => t.transaction_type === 'Receita' && t.status === 'Pago').reduce((a, b) => a + Number(b.amount), 0);
  const despesas = transactions.filter(t => t.transaction_type === 'Despesa' && t.status === 'Pago').reduce((a, b) => a + Number(b.amount), 0);
  const saldo = receitas - despesas;
  
  const contasApagar = transactions.filter(t => t.transaction_type === 'Despesa' && t.status === 'Pendente').reduce((a, b) => a + Number(b.amount), 0);
  const pendenciasAtrasadas = transactions.filter(t => t.transaction_type === 'Despesa' && t.status === 'Pendente' && new Date(t.due_date) < new Date(todayStr)).length;

  return (
    <div className="animate-fade-in-down space-y-8">
      
      {/* HEADER DA PÁGINA */}
      <div className="flex justify-between items-center mb-6">
         <div>
            <h2 className="text-3xl font-serif font-bold text-secundaria">Tesouraria Corporativa</h2>
            <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px] mt-1">Gestão de Fluxo de Caixa e Provisões</p>
         </div>
         <button onClick={() => setIsModalOpen(true)} className="bg-secundaria text-white px-6 py-4 rounded-xl shadow-lg hover:bg-black font-bold text-sm uppercase border border-gray-800 transition-colors">
            + Novo Lançamento
         </button>
      </div>

      {loading ? (
          <div className="flex justify-center items-center h-32"><p className="text-secundaria font-bold animate-pulse text-sm uppercase">Conciliando Extratos...</p></div>
      ) : (
        <>
            {/* CARDS KPI FINANCEIRO */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-t-[6px] border-emerald-500">
                    <h3 className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-1 flex justify-between">Receitas (Pagas) <span>💵</span></h3>
                    <p className="text-3xl font-serif text-emerald-600 font-bold">{formatCurrency(receitas)}</p>
                </div>
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-t-[6px] border-red-500">
                    <h3 className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-1 flex justify-between">Despesas (Pagas) <span>📉</span></h3>
                    <p className="text-3xl font-serif text-red-600 font-bold">{formatCurrency(despesas)}</p>
                </div>
                <div className="bg-gray-900 text-white p-6 rounded-3xl shadow-xl border border-black transform hover:scale-105 transition-transform cursor-default">
                    <h3 className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-1 flex justify-between">Saldo Operacional Atual <span>🏦</span></h3>
                    <p className={`text-4xl font-serif font-bold ${saldo >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{formatCurrency(saldo)}</p>
                </div>
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-t-[6px] border-orange-400 relative overflow-hidden">
                    <h3 className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-1 flex justify-between">Contas a Pagar (Futuro) <span>⚠️</span></h3>
                    <p className="text-3xl font-serif text-orange-600 font-bold">{formatCurrency(contasApagar)}</p>
                    {pendenciasAtrasadas > 0 && <span className="absolute bottom-6 right-6 bg-red-100 text-red-700 text-[9px] font-bold px-2 py-1 rounded-full uppercase animate-pulse">{pendenciasAtrasadas} Atrasadas</span>}
                </div>
            </div>

            {/* TABELA DE LANÇAMENTOS */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden mt-8">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 font-bold uppercase tracking-widest text-[10px]">
                   <tr>
                      <th className="p-5 pl-8">Descrição e Categoria</th>
                      <th className="p-5">Vencimento</th>
                      <th className="p-5">Valor</th>
                      <th className="p-5 text-center">Status</th>
                      <th className="p-5 text-right pr-8">Auditoria</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                   {transactions.map(t => (
                      <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                         <td className="p-5 pl-8">
                            <p className="font-bold text-secundaria text-base">{t.description}</p>
                            <span className="text-[10px] uppercase font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded mt-1 inline-block">{t.category}</span>
                         </td>
                         <td className="p-5 font-bold text-xs text-gray-500">
                             {new Date(t.due_date).toLocaleDateString('pt-BR')}
                             {t.status === 'Pendente' && new Date(t.due_date) < new Date(todayStr) && <span className="text-red-500 ml-2">Atrasado</span>}
                         </td>
                         <td className={`p-5 font-bold text-lg ${t.transaction_type === 'Receita' ? 'text-emerald-600' : 'text-red-500'}`}>
                             {t.transaction_type === 'Receita' ? '+' : '-'} {formatCurrency(t.amount)}
                         </td>
                         <td className="p-5 text-center">
                             {t.status === 'Pago' 
                               ? <span className="bg-emerald-50 text-emerald-700 font-bold text-[10px] uppercase px-3 py-1 rounded-lg border border-emerald-200">Pago / Concluído</span>
                               : <span className="bg-orange-50 text-orange-700 font-bold text-[10px] uppercase px-3 py-1 rounded-lg border border-orange-200">A Pagar</span>
                             }
                         </td>
                         <td className="p-5 text-right pr-8 space-x-2">
                             {t.status === 'Pendente' && (
                                <button onClick={() => markAsPaid(t.id)} className="text-[9px] bg-secundaria text-white px-2 py-1 rounded uppercase font-bold hover:bg-black">Dar Baixa</button>
                             )}
                             <button onClick={() => delTrans(t.id)} className="text-[9px] text-gray-400 hover:text-red-500 font-bold uppercase underline">Excluir</button>
                         </td>
                      </tr>
                   ))}
                   {transactions.length === 0 && <tr><td colSpan="5" className="p-16 text-center text-gray-400 font-medium text-sm">Nenhuma transação financeira registrada no Cloud ERP.</td></tr>}
                </tbody>
              </table>
            </div>
        </>
      )}

      {/* MODAL DE CRIAÇÃO FINANCEIRA */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-secundaria/80 backdrop-blur z-[100] flex items-center justify-center p-4">
           <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden border border-white/20">
              <div className="bg-gray-50 px-8 py-6 border-b border-gray-100 flex justify-between items-center">
                 <h3 className="font-serif font-bold text-secundaria text-2xl">Lançamento de Caixa</h3>
                 <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-red-500 font-bold text-[10px] uppercase">Fechar [X]</button>
              </div>

              <form onSubmit={handleSubmit} className="p-8 space-y-5">
                 <div className="flex gap-4 mb-2 border-b pb-6 border-gray-100">
                    <label className={`flex-1 text-center py-3 rounded-xl border-2 font-bold uppercase tracking-widest text-xs cursor-pointer transition-colors ${formData.transaction_type === 'Despesa' ? 'bg-red-50 border-red-500 text-red-700' : 'bg-gray-50 border-transparent text-gray-400'}`}>
                       <input type="radio" name="ttype" className="hidden" checked={formData.transaction_type === 'Despesa'} onChange={() => setFormData({...formData, transaction_type: 'Despesa'})} />
                       🔥 Despesa / Gasto
                    </label>
                    <label className={`flex-1 text-center py-3 rounded-xl border-2 font-bold uppercase tracking-widest text-xs cursor-pointer transition-colors ${formData.transaction_type === 'Receita' ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'bg-gray-50 border-transparent text-gray-400'}`}>
                       <input type="radio" name="ttype" className="hidden" checked={formData.transaction_type === 'Receita'} onChange={() => setFormData({...formData, transaction_type: 'Receita'})} />
                       💵 Receita Avulsa
                    </label>
                 </div>

                 <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Título do Lançamento</label>
                    <input type="text" required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Ex: Compra de Tecidos Importados" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm font-bold text-secundaria outline-none" />
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Valor Financeiro (R$)</label>
                        <input type="number" step="0.01" required value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} placeholder="0.00" className={`w-full px-4 py-3 border rounded-lg text-lg font-bold outline-none ${formData.transaction_type === 'Receita' ? 'text-emerald-600 bg-emerald-50 border-emerald-200' : 'text-red-600 bg-red-50 border-red-200'}`} />
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Centro de Custo (Categoria)</label>
                        <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm font-bold text-secundaria outline-none">
                            {formData.transaction_type === 'Despesa' ? (
                               <>
                                  <option>Insumos Fabris</option>
                                  <option>Embalagens</option>
                                  <option>Pró-labore Sócios</option>
                                  <option>Impostos e Taxas</option>
                                  <option>Marketing / Tráfego</option>
                                  <option>Logística / Correios</option>
                                  <option>Outros Gastos</option>
                               </>
                            ) : (
                               <>
                                  <option>Venda Externa</option>
                                  <option>Aporte de Sócio</option>
                                  <option>Rendimento</option>
                                  <option>Outras Entradas</option>
                               </>
                            )}
                        </select>
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Data Vencimento</label>
                        <input type="date" required value={formData.due_date} onChange={e => setFormData({...formData, due_date: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm font-bold text-secundaria outline-none" />
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Status de Pagamento</label>
                        <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className={`w-full px-4 py-3 border rounded-lg text-sm font-bold outline-none ${formData.status === 'Pago' ? 'text-emerald-700 bg-emerald-50 border-emerald-200' : 'text-orange-700 bg-orange-50 border-orange-200'}`}>
                           <option>Pago</option><option>Pendente</option>
                        </select>
                    </div>
                 </div>

                 <button type="submit" disabled={isSaving} className="w-full mt-4 bg-secundaria text-white font-bold py-5 rounded-xl uppercase tracking-widest text-sm hover:bg-black transition-colors shadow-lg">
                    {isSaving ? "Integrando ao Banco..." : "Registrar no Fluxo de Caixa"}
                 </button>
              </form>
           </div>
        </div>
      )}

    </div>
  )
}
