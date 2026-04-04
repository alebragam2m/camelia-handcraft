import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { financialService } from '../services/financialService';
import { formatCurrency } from '../utils/formatCurrency';
import ErrorBoundary from './ErrorBoundary';

type TransactionType = 'Receita' | 'Despesa';
type TransactionStatus = 'Pago' | 'Pendente';

interface FinanceFormValues {
  transaction_type: TransactionType;
  category: string;
  description: string;
  amount: number | string;
  status: TransactionStatus;
  due_date: string;
}

export default function FinanceModule() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const todayStr = new Date().toISOString().split('T')[0];

  const { data: transactions = [], isLoading: loading } = useQuery({
    queryKey: ['transactions'],
    queryFn: () => financialService.getAll(),
  });

  const { register, handleSubmit, reset, watch, setValue, formState: { isSubmitting } } = useForm<FinanceFormValues>({
    defaultValues: {
      transaction_type: 'Despesa',
      category: 'Insumos Fabris',
      description: '',
      amount: '',
      status: 'Pago',
      due_date: todayStr
    }
  });

  const transactionTypeWatch = watch('transaction_type');
  const statusWatch = watch('status');

  const saveMutation = useMutation({
    mutationFn: (data: FinanceFormValues) => {
      const payload = { 
        ...data, 
        amount: Number(data.amount.toString().replace(',', '.')) 
      };
      return financialService.save(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      setIsModalOpen(false);
      reset();
    },
    onError: (err: Error) => alert(`Erro: ${err.message}`)
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => financialService.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['transactions'] })
  });

  const markAsPaidMutation = useMutation({
    mutationFn: (id: string) => financialService.save({ status: 'Pago', payment_date: todayStr }, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['transactions'] })
  });

  // Cálculos Financeiros
  const receitas = transactions.filter((t: any) => t.transaction_type === 'Receita' && t.status === 'Pago').reduce((a: number, b: any) => a + Number(b.amount), 0);
  const despesas = transactions.filter((t: any) => t.transaction_type === 'Despesa' && t.status === 'Pago').reduce((a: number, b: any) => a + Number(b.amount), 0);
  const saldo = receitas - despesas;
  const contasApagar = transactions.filter((t: any) => t.transaction_type === 'Despesa' && t.status === 'Pendente').reduce((a: number, b: any) => a + Number(b.amount), 0);

  const onFormSubmit = (data: FinanceFormValues) => {
    saveMutation.mutate(data);
  };

  return (
    <ErrorBoundary>
      <div className="animate-fade-in-down space-y-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-3xl font-serif font-bold text-secundaria">Tesouraria Corporativa</h2>
            <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px] mt-1">Gestão de Fluxo de Caixa (Motor Pro v3)</p>
          </div>
          <button onClick={() => { reset(); setIsModalOpen(true); }} className="bg-secundaria text-white px-6 py-4 rounded-xl shadow-lg hover:bg-black font-bold text-sm uppercase transition-all">
            + Novo Lançamento
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-32 animate-pulse"><p className="text-secundaria font-bold uppercase text-[10px] tracking-widest">Sincronizando Extratos...</p></div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-3xl shadow-sm border-t-[6px] border-emerald-500">
                <h3 className="text-gray-400 text-[9px] font-bold uppercase tracking-widest mb-1 flex justify-between">Receitas (Pagas) <span>💵</span></h3>
                <p className="text-3xl font-serif text-emerald-600 font-bold">{formatCurrency(receitas)}</p>
              </div>
              <div className="bg-white p-6 rounded-3xl shadow-sm border-t-[6px] border-red-500">
                <h3 className="text-gray-400 text-[9px] font-bold uppercase tracking-widest mb-1 flex justify-between">Despesas (Pagas) <span>📉</span></h3>
                <p className="text-3xl font-serif text-red-600 font-bold">{formatCurrency(despesas)}</p>
              </div>
              <div className="bg-gray-900 text-white p-6 rounded-3xl shadow-xl transform hover:scale-[1.02] transition-transform">
                <h3 className="text-gray-400 text-[9px] font-bold uppercase tracking-widest mb-1 flex justify-between">Saldo Operacional <span>🏦</span></h3>
                <p className={`text-4xl font-serif font-bold ${saldo >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{formatCurrency(saldo)}</p>
              </div>
              <div className="bg-white p-6 rounded-3xl shadow-sm border-t-[6px] border-orange-400">
                <h3 className="text-gray-400 text-[9px] font-bold uppercase tracking-widest mb-1 flex justify-between">Provisão de Saída <span>⚠️</span></h3>
                <p className="text-3xl font-serif text-orange-600 font-bold">{formatCurrency(contasApagar)}</p>
              </div>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 border-b text-gray-500 font-bold uppercase tracking-widest text-[9px]">
                  <tr><th className="p-5 pl-8">Lançamento</th><th className="p-5">Vencimento</th><th className="p-5">Valor</th><th className="p-5 text-center">Status</th><th className="p-5 text-right pr-8">Auditoria</th></tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {transactions.map((t: any) => (
                    <tr key={t.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="p-5 pl-8">
                        <p className="font-bold text-secundaria">{t.description}</p>
                        <span className="text-[9px] uppercase font-bold text-gray-400">{t.category}</span>
                      </td>
                      <td className="p-5 font-bold text-xs text-gray-500">{new Date(t.due_date).toLocaleDateString('pt-BR')}</td>
                      <td className={`p-5 font-bold ${t.transaction_type === 'Receita' ? 'text-emerald-600' : 'text-red-500'}`}>{t.transaction_type === 'Receita' ? '+' : '-'} {formatCurrency(t.amount)}</td>
                      <td className="p-5 text-center">
                        <span className={`px-3 py-1 rounded-lg text-[9px] font-bold uppercase border ${t.status === 'Pago' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-orange-50 text-orange-700 border-orange-200'}`}>{t.status}</span>
                      </td>
                      <td className="p-5 text-right pr-8 space-x-2">
                        {t.status === 'Pendente' && <button onClick={() => markAsPaidMutation.mutate(t.id)} className="text-[8px] bg-secundaria text-white px-2 py-1 rounded uppercase font-bold hover:bg-black transition-all">Baixa</button>}
                        <button onClick={() => deleteMutation.mutate(t.id)} className="text-[8px] text-gray-400 hover:text-red-500 font-bold uppercase underline">Excluir</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* MODAL FINANCEIRO */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-secundaria/80 backdrop-blur z-[150] flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in duration-300">
              <div className="bg-gray-50 px-8 py-6 border-b flex justify-between items-center">
                <h3 className="font-serif font-bold text-secundaria text-2xl">Lançamento de Fluxo</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-red-500 font-bold text-[10px]">FECHAR [X]</button>
              </div>

              <form onSubmit={handleSubmit(onFormSubmit)} className="p-8 space-y-6">
                <div className="flex gap-4 p-1 bg-gray-50 rounded-2xl">
                  <button type="button" onClick={() => setValue('transaction_type', 'Despesa')} className={`flex-1 py-3 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all ${transactionTypeWatch === 'Despesa' ? 'bg-red-500 text-white shadow-lg' : 'text-gray-400'}`}>🔥 Saída</button>
                  <button type="button" onClick={() => setValue('transaction_type', 'Receita')} className={`flex-1 py-3 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all ${transactionTypeWatch === 'Receita' ? 'bg-emerald-500 text-white shadow-lg' : 'text-gray-400'}`}>💵 Entrada</button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Título / Descrição</label>
                    <input type="text" {...register('description', { required: true })} placeholder="Ex: Compra de Matéria Prima" className="w-full p-4 bg-gray-50 rounded-xl border border-gray-100 font-bold text-secundaria" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Valor (R$)</label>
                      <input type="number" step="0.01" {...register('amount', { required: true })} className="w-full p-4 bg-gray-50 rounded-xl border border-gray-100 font-bold text-secundaria" />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Data Vencimento</label>
                      <input type="date" {...register('due_date', { required: true })} className="w-full p-4 bg-gray-50 rounded-xl border border-gray-100 font-bold text-secundaria text-xs" />
                    </div>
                  </div>
                  <div>
                    <select {...register('status')} className={`w-full p-4 rounded-xl border font-bold text-sm transition-colors ${statusWatch === 'Pago' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-orange-50 border-orange-100 text-orange-700'}`}>
                      <option value="Pago">Marcado como Pago</option>
                      <option value="Pendente">Aguardando Pagamento</option>
                    </select>
                  </div>
                </div>

                <button type="submit" disabled={isSubmitting || saveMutation.isPending} className="w-full bg-secundaria text-white font-bold py-5 rounded-xl uppercase tracking-widest text-xs shadow-xl active:scale-[0.98] transition-all disabled:opacity-50">
                  {saveMutation.isPending ? 'Sincronizando...' : 'Confirmar Lançamento'}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}
