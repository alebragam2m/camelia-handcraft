import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { shippingRateService, type ShippingRate } from '../services/shippingRateService';
import { formatCurrency } from '../utils/formatCurrency';
import ErrorBoundary from './ErrorBoundary';

const UFS = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'];

export default function ShippingRatesModule() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState<Partial<ShippingRate>>({ state: '*', label: '', cost: 0, estimated_days: null });

  const { data: rates = [], isLoading: loading } = useQuery({
    queryKey: ['shipping-rates'],
    queryFn: () => shippingRateService.getAll(),
  });

  const saveMutation = useMutation({
    mutationFn: (payload: Partial<ShippingRate>) => shippingRateService.save(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shipping-rates'] });
      setIsModalOpen(false);
    },
    onError: (err: Error) => alert(`Erro: ${err.message}`),
  });

  const deleteMutation = useMutation({
    mutationFn: (state: string) => shippingRateService.remove(state),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['shipping-rates'] }),
    onError: (err: Error) => alert(`Erro ao excluir: ${err.message}`),
  });

  const usedStates = new Set(rates.map(r => r.state));
  const availableStates = ['*', ...UFS].filter(uf => !usedStates.has(uf));

  const openModal = (rate?: ShippingRate) => {
    setForm(rate ? { ...rate } : { state: availableStates[0] || '*', label: '', cost: 0, estimated_days: null });
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate({
      ...form,
      cost: Number(form.cost) || 0,
      estimated_days: form.estimated_days ? Number(form.estimated_days) : null,
    });
  };

  if (loading) return <div className="p-12 text-center animate-pulse text-gray-400 font-bold uppercase tracking-widest text-[10px]">Carregando tabela de frete...</div>;

  return (
    <ErrorBoundary>
      <div className="animate-fade-in-down space-y-6">
        <div className="flex justify-between items-center bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
          <div>
            <h2 className="text-3xl font-serif font-bold text-secundaria mb-1 flex items-center gap-3">Frete por Estado <span>🚚</span></h2>
            <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">
              Valor fixo cobrado no checkout por UF de entrega. <strong>*</strong> é o valor padrão usado quando o estado não tem linha própria.
            </p>
          </div>
          <button onClick={() => openModal()} disabled={availableStates.length === 0} className="bg-secundaria text-white px-6 py-4 rounded-xl shadow-lg hover:bg-black font-bold text-sm uppercase transition-all disabled:opacity-40">
            + Novo Frete
          </button>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Estado</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Rótulo</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Valor</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Prazo (dias)</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {rates.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-400 italic text-sm">Nenhum frete cadastrado — checkout cobra R$ 0,00 até que você configure ao menos a linha padrão (*).</td></tr>
              ) : (
                rates.map(rate => (
                  <tr key={rate.state} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${rate.state === '*' ? 'bg-indigo-50 text-indigo-600' : 'bg-gray-100 text-secundaria'}`}>
                        {rate.state === '*' ? 'Padrão' : rate.state}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{rate.label || '—'}</td>
                    <td className="px-6 py-4 text-sm font-bold text-secundaria">{formatCurrency(rate.cost)}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{rate.estimated_days ? `${rate.estimated_days} dias` : '—'}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <button onClick={() => openModal(rate)} className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest hover:text-indigo-600 transition-colors">Editar</button>
                        <button onClick={() => { if (confirm(`Remover frete de ${rate.state}?`)) deleteMutation.mutate(rate.state); }} className="text-[10px] font-bold text-red-300 uppercase tracking-widest hover:text-red-500 transition-colors">Excluir</button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {isModalOpen && (
          <div className="fixed inset-0 bg-secundaria/80 backdrop-blur z-[150] flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-300">
              <div className="bg-gray-50 px-8 py-6 border-b flex justify-between items-center">
                <h3 className="font-serif font-bold text-secundaria text-2xl">{form.state ? 'Editar Frete' : 'Novo Frete'}</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-red-500 font-bold text-[10px]">FECHAR [X]</button>
              </div>
              <form onSubmit={handleSave} className="p-8 space-y-4">
                <div>
                  <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Estado (UF) — use * para o padrão</label>
                  <select
                    value={form.state}
                    onChange={e => setForm(f => ({ ...f, state: e.target.value }))}
                    className="w-full p-4 bg-gray-50 rounded-xl border border-gray-100 font-bold text-secundaria"
                  >
                    <option value={form.state}>{form.state === '*' ? 'Padrão (*)' : form.state}</option>
                    {availableStates.filter(uf => uf !== form.state).map(uf => (
                      <option key={uf} value={uf}>{uf === '*' ? 'Padrão (*)' : uf}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Rótulo (opcional)</label>
                  <input type="text" value={form.label || ''} onChange={e => setForm(f => ({ ...f, label: e.target.value }))} placeholder="Ex: Região Norte" className="w-full p-4 bg-gray-50 rounded-xl border border-gray-100 font-bold text-secundaria" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Valor (R$)</label>
                    <input type="number" step="0.01" min="0" value={form.cost ?? 0} onChange={e => setForm(f => ({ ...f, cost: Number(e.target.value) }))} className="w-full p-4 bg-gray-50 rounded-xl border border-gray-100 font-bold text-secundaria" />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Prazo (dias)</label>
                    <input type="number" min="0" value={form.estimated_days ?? ''} onChange={e => setForm(f => ({ ...f, estimated_days: e.target.value ? Number(e.target.value) : null }))} className="w-full p-4 bg-gray-50 rounded-xl border border-gray-100 font-bold text-secundaria" />
                  </div>
                </div>
                <button type="submit" disabled={saveMutation.isPending} className="w-full bg-secundaria text-white font-bold py-5 rounded-xl uppercase tracking-widest text-[10px] shadow-xl disabled:opacity-50">
                  {saveMutation.isPending ? 'Salvando...' : 'Salvar Frete'}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}
