import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { stockService } from '../services/stockService';
import { formatCurrency } from '../utils/formatCurrency';
import ErrorBoundary from './ErrorBoundary';
import type { Product } from '../types/supabase';

export interface StockHistoryModuleProps {
  produtos: Product[];
  onStockChange?: () => void;
}

/**
 * MOTOR DE PCP (MISSION CRITICAL)
 * 
 * PILLAR 1: TypeScript
 * PILLAR 2: TanStack Query
 */
export default function StockHistoryModule({ produtos }: StockHistoryModuleProps) {
  const queryClient = useQueryClient();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [adjustForm, setAdjustForm] = useState({ change_type: 'Entrada', quantity: '', reason: '' });

  const { data: logs = [], isLoading: loadingLogs } = useQuery({
    queryKey: ['stock-logs', selectedProduct?.id],
    queryFn: () => selectedProduct ? stockService.getLogs(selectedProduct.id) : Promise.resolve([]),
    enabled: !!selectedProduct,
  });

  const adjustMutation = useMutation({
    mutationFn: (data: { productId: string; qty: number; type: 'ENTRADA' | 'SAIDA'; reason: string }) =>
      stockService.adjust(data.productId, data.qty, data.type, data.reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['stock-logs', selectedProduct?.id] });
      setIsAdjustModalOpen(false);
      setAdjustForm({ change_type: 'Entrada', quantity: '', reason: '' });
      alert("Estoque calibrado com sucesso via Motor Pro v3!");
    },
    onError: (err: Error) => alert(`Erro Crítico no ERP: ${err.message}`)
  });

  const handleAdjustStock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    const qty = parseInt(adjustForm.quantity);
    if (isNaN(qty) || qty <= 0) return alert("Quantidade inválida.");

    const rpcType: 'ENTRADA' | 'SAIDA' = adjustForm.change_type === 'Entrada' ? 'ENTRADA' : 'SAIDA';
    adjustMutation.mutate({
      productId: selectedProduct.id,
      qty,
      type: rpcType,
      reason: adjustForm.reason || `Ajuste manual PCP: ${adjustForm.change_type}`
    });
  };

  const totalEmAcervo = produtos.reduce((acc, p) => acc + (p.stock || 0), 0);
  const valorEstocado = produtos.reduce((acc, p) => acc + ((p.stock || 0) * Number(p.cost || 0)), 0);

  return (
    <ErrorBoundary>
      <div className="animate-fade-in-down space-y-6">
        <div className="flex justify-between items-center bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
          <div>
            <h2 className="text-3xl font-serif font-bold text-secundaria mb-1 flex items-center gap-3">PCP & Inventário <span>📦</span></h2>
            <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest leading-relaxed">Controle de Saídas/Entradas (Sincronização Ativa)</p>
          </div>
          <div className="text-right border-l pl-6 border-gray-100">
            <p className="text-2xl font-serif font-bold text-secundaria">{totalEmAcervo} <span className="text-sm font-sans text-gray-400">peças</span></p>
            <p className="text-[10px] text-orange-500 uppercase font-bold tracking-widest mt-1">~{formatCurrency(valorEstocado)} imobilizados</p>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b text-gray-500 font-bold uppercase tracking-widest text-[9px]">
              <tr><th className="p-5 pl-8">Produto / Arte</th><th className="p-5 text-center">Saldo</th><th className="p-5 text-right pr-8">Auditoria</th></tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {produtos.map(p => (
                <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="p-5 pl-8 font-bold text-secundaria">{p.nome}</td>
                  <td className="p-5 text-center">
                    <span className={`px-4 py-1.5 rounded-lg font-bold text-lg ${Number(p.stock) <= 5 ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-700'}`}>{p.stock}</span>
                  </td>
                  <td className="p-5 text-right pr-8">
                    <button onClick={() => setSelectedProduct(p)} className="text-[10px] bg-secundaria text-white px-4 py-2 rounded-lg font-bold uppercase tracking-widest hover:bg-black transition-all">Histórico PCP</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {selectedProduct && (
          <div className="fixed inset-0 bg-secundaria/80 backdrop-blur z-[180] flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col border border-white/20">
              <div className="bg-gray-50 px-8 py-6 border-b flex justify-between items-center rounded-t-3xl">
                <div>
                  <h3 className="font-serif font-bold text-secundaria text-2xl">Dossiê de PCP</h3>
                  <p className="text-primaria font-bold uppercase text-[10px] tracking-widest mt-1">{selectedProduct.nome}</p>
                </div>
                <button onClick={() => setSelectedProduct(null)} className="text-gray-400 hover:text-red-500 font-bold text-[10px] uppercase">Fechar [X]</button>
              </div>

              <div className="flex flex-col md:flex-row h-full overflow-hidden">
                <div className="flex-1 p-8 overflow-y-auto bg-white border-r">
                   <h4 className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mb-6">Timeline Logística</h4>
                   {loadingLogs ? <p className="animate-pulse text-[10px] font-bold text-gray-400">ConciliandoLogs...</p> : (
                     <div className="space-y-4">
                        {logs.map((l: any) => (
                           <div key={l.id} className="bg-gray-50 border border-gray-100 p-4 rounded-xl flex justify-between items-center">
                              <div>
                                 <p className="font-bold text-secundaria text-sm">{l.reason || 'Sincronização ERP'}</p>
                                 <p className="text-[8px] text-gray-400 font-bold uppercase mt-1">{new Date(l.created_at).toLocaleString('pt-BR')} | {l.change_type}</p>
                              </div>
                              <div className="text-right">
                                 <p className={`font-bold text-lg ${Number(l.quantity_changed) > 0 ? 'text-emerald-500' : 'text-red-500'}`}>{Number(l.quantity_changed) > 0 ? '+' : ''}{l.quantity_changed}</p>
                                 <p className="text-[8px] text-gray-300 uppercase font-bold">Saldo: {l.new_stock_total}</p>
                              </div>
                           </div>
                        ))}
                     </div>
                   )}
                </div>

                <div className="w-full md:w-80 bg-gray-50 p-8 flex flex-col justify-center">
                  <div className="bg-secundaria text-white p-6 rounded-2xl shadow-lg mb-8 text-center border-b-[4px] border-primaria">
                    <p className="text-[9px] uppercase tracking-widest text-gray-400 font-bold mb-1">Acervo Físico</p>
                    <p className="text-5xl font-serif font-bold">{selectedProduct.stock}</p>
                  </div>

                  {!isAdjustModalOpen ? (
                    <button onClick={() => setIsAdjustModalOpen(true)} className="w-full bg-white border-2 border-primaria text-primaria font-bold py-4 rounded-xl uppercase tracking-widest text-[10px] hover:bg-primaria hover:text-white transition-all">Ajuste Manual</button>
                  ) : (
                    <form onSubmit={handleAdjustStock} className="animate-fade-in space-y-4">
                      <select value={adjustForm.change_type} onChange={e => setAdjustForm({...adjustForm, change_type: e.target.value})} className="w-full p-3 rounded-lg border text-[10px] font-bold uppercase text-secundaria outline-none">
                        <option value="Entrada">Entrada (+) </option>
                        <option value="Saída">Saída Manual (-)</option>
                      </select>
                      <input type="number" min="1" required value={adjustForm.quantity} onChange={e => setAdjustForm({...adjustForm, quantity: e.target.value})} placeholder="Qtd" className="w-full p-3 rounded-lg border text-sm font-bold text-center" />
                      <input type="text" value={adjustForm.reason} onChange={e => setAdjustForm({...adjustForm, reason: e.target.value})} placeholder="Motivo Contábil" className="w-full p-3 rounded-lg border text-[10px] font-bold" />
                      <button type="submit" disabled={adjustMutation.isPending} className="w-full bg-secundaria text-white font-bold py-3 rounded-xl uppercase tracking-widest text-[10px] active:scale-95 transition-all">
                        {adjustMutation.isPending ? 'Gravando...' : 'Salvar Calibração'}
                      </button>
                    </form>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}
