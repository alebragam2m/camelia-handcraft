import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { saleService } from '../services/saleService';
import { formatCurrency } from '../utils/formatCurrency';
import ManualSaleModal from './ManualSaleModal';

interface SalesModuleProps {
  isAdmin?: boolean;
}

export default function SalesModule({ isAdmin = false }: SalesModuleProps) {
  const queryClient = useQueryClient();
  const [isNewSaleOpen, setIsNewSaleOpen] = useState(false);

  const { data: sales = [], isLoading } = useQuery({
    queryKey: ['sales'],
    queryFn: () => saleService.getAll(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => saleService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
    },
    onError: (err: Error) => alert(`Erro ao apagar: ${err.message}`),
  });

  const handleDelete = (e: React.MouseEvent, sale: any) => {
    e.stopPropagation();
    const clientName = sale.clients?.full_name || 'Consumidor Final';
    const valor = formatCurrency(sale.total_amount);
    const data = new Date(sale.created_at).toLocaleDateString('pt-BR');
    if (window.confirm(`⚠️ Apagar venda permanentemente?\n\nCliente: ${clientName}\nValor: ${valor}\nData: ${data}\n\nEssa ação é irreversível.`)) {
      deleteMutation.mutate(sale.id);
    }
  };

  if (isLoading) return <div className="p-12 text-center animate-pulse text-gray-400 font-bold uppercase tracking-widest text-[10px]">Carregando Vendas...</div>;

  return (
    <div className="space-y-6 animate-fade-in">

      {/* MODAL DE NOVA VENDA */}
      {isNewSaleOpen && <ManualSaleModal onClose={() => setIsNewSaleOpen(false)} />}

      {/* CABEÇALHO COM BOTÃO */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-serif font-bold text-secundaria mb-0.5 flex items-center gap-2">Livro de Vendas <span>🧾</span></h2>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{sales.length} registro{sales.length !== 1 ? 's' : ''} encontrado{sales.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => setIsNewSaleOpen(true)}
          className="bg-secundaria text-white px-6 py-3 rounded-xl font-bold uppercase tracking-widest text-[10px] hover:bg-black transition-all shadow-md"
        >
          + Nova Venda
        </button>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Data</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Cliente</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {sales.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-400 italic text-sm">Nenhuma venda registrada ainda.</td>
                </tr>
              ) : (
                sales.map((sale: any) => (
                  <tr key={sale.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <p className="text-xs font-bold text-secundaria">{new Date(sale.created_at).toLocaleDateString('pt-BR')}</p>
                      <p className="text-[9px] text-gray-400 uppercase font-medium">{new Date(sale.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">👤</span>
                        <div>
                          <p className="text-xs font-bold text-secundaria">{sale.clients?.full_name || 'Consumidor Final'}</p>
                          {sale.clients?.is_vip && <span className="text-[8px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-bold uppercase tracking-tighter">VIP Camélia</span>}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-primaria">{formatCurrency(sale.total_amount)}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest ${
                        sale.status === 'completed' ? 'bg-emerald-50 text-emerald-600' :
                        sale.status === 'pending' ? 'bg-amber-50 text-amber-600' : 'bg-gray-50 text-gray-400'
                      }`}>
                        {sale.status === 'completed' ? 'Finalizado' : 'Pendente'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <button className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest hover:text-indigo-600 transition-colors">Ver Recibo ❯</button>

                        {/* BOTÃO DE EXCLUSÃO — SOMENTE ADMIN (nível 4) */}
                        {isAdmin && (
                          <button
                            onClick={(e) => handleDelete(e, sale)}
                            disabled={deleteMutation.isPending}
                            className="text-[9px] font-bold text-red-300 uppercase tracking-widest hover:text-red-500 transition-colors disabled:opacity-40 border border-red-100 px-2 py-0.5 rounded-lg hover:border-red-300 hover:bg-red-50"
                            title="Apagar venda (Admin)"
                          >
                            {deleteMutation.isPending ? '...' : '🗑 Apagar'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
