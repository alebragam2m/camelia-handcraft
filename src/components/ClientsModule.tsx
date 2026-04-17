import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { clientService } from '../services/clientService';
import { saleService } from '../services/saleService';
import { formatCurrency } from '../utils/formatCurrency';
import type { Client } from '../types/supabase';
import ClientProfileView from './ClientProfileView';

const ACQUISITION_CHANNELS = ['Instagram', 'WhatsApp', 'Indicação', 'Site', 'Outro'];

export default function ClientsModule() {
  const queryClient = useQueryClient();
  const [selectedClient, setSelectedClient] = useState<Partial<Client> | null>(null);
  const [activeProfileClient, setActiveProfileClient] = useState<Client | null>(null);
  const [form, setForm] = useState<Partial<Client>>({});

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ['clients'],
    queryFn: () => clientService.getAll(),
  });

  const { data: sales = [] } = useQuery({
    queryKey: ['sales'],
    queryFn: () => saleService.getAll(),
  });

  const saveMutation = useMutation({
    mutationFn: (payload: Partial<Client>) => clientService.save(payload, selectedClient?.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      setSelectedClient(null);
    },
    onError: (err: Error) => alert(`Erro ao salvar: ${err.message}`),
  });

  const openModal = (client?: Client) => {
    if (client) {
      setSelectedClient(client);
      setForm({
        full_name: client.full_name,
      email: client.email,
      phone: client.phone,
      is_vip: client.is_vip,
      cpf_cnpj: client.cpf_cnpj,
      birth_date: client.birth_date,
      address: client.address,
      address_complement: client.address_complement,
      neighborhood: client.neighborhood,
      city: client.city,
      state: client.state,
      zip_code: client.zip_code,
      acquisition_channel: client.acquisition_channel,
      internal_notes: client.internal_notes,
    });
    } else {
      setSelectedClient({});
      setForm({ is_vip: false, full_name: '', phone: '' });
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(form);
  };

  if (isLoading) return <div className="p-12 text-center animate-pulse text-gray-400 font-bold uppercase tracking-widest text-[10px]">Carregando CRM...</div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 flex justify-between items-center">
        <div>
           <h2 className="text-3xl font-serif font-bold text-secundaria mb-1 flex items-center gap-3">Rede de Clientes <span>🤝</span></h2>
           <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest leading-relaxed">Gerenciador de Carteira e Cadastros VIPs</p>
        </div>
        <button onClick={() => openModal()} className="bg-secundaria text-white px-6 py-3 rounded-xl font-bold uppercase tracking-widest text-[10px] hover:bg-black transition-all shadow-md">
           + Novo Cliente
        </button>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        
        {activeProfileClient ? (
          <ClientProfileView 
            client={activeProfileClient} 
            sales={sales} 
            onBack={() => setActiveProfileClient(null)} 
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Cliente</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Email / Contato</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Comprado</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {clients.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-400 italic text-sm">Nenhum cliente cadastrado ainda.</td>
                </tr>
              ) : (
                clients.map((client: any) => {
                  const clientSales = sales.filter((s:any) => s.client_id === client.id);
                  const clientLTV = clientSales.reduce((acc:number, s:any) => acc + (Number(s.total_amount) || 0), 0);

                  return (
                  <tr key={client.id} onClick={() => setActiveProfileClient(client)} className="hover:bg-gray-50/50 transition-colors group cursor-pointer">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primaria/10 flex items-center justify-center text-primaria font-bold">
                          {client.full_name?.charAt(0) || '?'}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-secundaria">{client.full_name}</p>
                          {client.is_vip && <span className="text-[8px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-bold uppercase tracking-tighter">VIP Gold</span>}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-[10px] text-gray-500 font-medium">{client.email}</p>
                      <p className="text-[9px] text-gray-400 uppercase font-bold tracking-tight">{client.phone || 'Sem telefone'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-secundaria">{formatCurrency(clientLTV)}</p>
                      <p className="text-[9px] text-gray-400 uppercase font-bold">LTV ({clientSales.length} compras)</p>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={(e) => { e.stopPropagation(); openModal(client); }}
                        className="bg-gray-100 px-4 py-2 rounded-lg text-[9px] font-bold text-gray-500 uppercase tracking-widest group-hover:bg-secundaria group-hover:text-white transition-all"
                      >
                        Ficha / Editar
                      </button>
                    </td>
                  </tr>
                )))}
            </tbody>
          </table>
        </div>
        )}
      </div>

      {/* Modal de edição */}
      {selectedClient && (
        <div className="fixed inset-0 bg-secundaria/70 backdrop-blur-sm z-[200] flex items-start justify-end">
          <div className="bg-white w-full max-w-lg h-full overflow-y-auto shadow-2xl flex flex-col">

            {/* Header */}
            <div className="bg-secundaria text-white px-8 py-6 flex justify-between items-center sticky top-0 z-10">
              <div>
                <p className="text-[9px] uppercase tracking-[4px] text-primaria font-bold mb-1">CRM — Ficha do Cliente</p>
                <h3 className="font-serif font-bold text-xl">{selectedClient.id ? selectedClient.full_name : 'Novo Cadastro VIP'}</h3>
              </div>
              <button onClick={() => setSelectedClient(null)} className="text-white/50 hover:text-white font-bold text-lg">✕</button>
            </div>

            <form onSubmit={handleSave} className="flex-1 flex flex-col">
              <div className="px-8 py-6 space-y-5 flex-1">

                {/* ── Dados existentes ─────────────────────────────── */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-[#d4af37]">Nome Completo *</label>
                    <input
                      type="text"
                      required
                      value={form.full_name || ''}
                      onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-secundaria outline-none focus:border-primaria transition-colors"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">E-mail</label>
                    <input
                      type="email"
                      value={form.email || ''}
                      onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-secundaria outline-none focus:border-primaria transition-colors"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-[#d4af37]">Telefone / WhatsApp *</label>
                    <input
                      type="text"
                      required
                      value={form.phone || ''}
                      onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-secundaria outline-none focus:border-primaria transition-colors"
                    />
                  </div>
                  <div className="col-span-2 flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="is_vip"
                      checked={form.is_vip || false}
                      onChange={e => setForm(f => ({ ...f, is_vip: e.target.checked }))}
                      className="w-4 h-4 accent-primaria"
                    />
                    <label htmlFor="is_vip" className="text-[10px] font-bold uppercase tracking-widest text-gray-500 cursor-pointer">Cliente VIP Gold</label>
                  </div>
                </div>

                {/* ── Informações Complementares ────────────────────── */}
                <div className="border-t border-gray-100 pt-5">
                  <p className="text-[10px] font-bold uppercase tracking-[4px] text-primaria mb-4">Informações Complementares</p>
                  <div className="grid grid-cols-2 gap-4">

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">CPF / CNPJ</label>
                      <input
                        type="text"
                        value={form.cpf_cnpj || ''}
                        onChange={e => setForm(f => ({ ...f, cpf_cnpj: e.target.value }))}
                        placeholder="000.000.000-00"
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-secundaria outline-none focus:border-primaria transition-colors"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Data de Nascimento</label>
                      <input
                        type="date"
                        value={form.birth_date || ''}
                        onChange={e => setForm(f => ({ ...f, birth_date: e.target.value }))}
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-secundaria outline-none focus:border-primaria transition-colors"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Endereço</label>
                      <input
                        type="text"
                        value={form.address || ''}
                        onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                        placeholder="Rua, número"
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-secundaria outline-none focus:border-primaria transition-colors"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Complemento / Ap</label>
                      <input
                        type="text"
                        value={form.address_complement || ''}
                        onChange={e => setForm(f => ({ ...f, address_complement: e.target.value }))}
                        placeholder="Apto 13 / Casa B"
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-secundaria outline-none focus:border-primaria transition-colors"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Bairro</label>
                      <input
                        type="text"
                        value={form.neighborhood || ''}
                        onChange={e => setForm(f => ({ ...f, neighborhood: e.target.value }))}
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-secundaria outline-none focus:border-primaria transition-colors"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">CEP</label>
                      <input
                        type="text"
                        value={form.zip_code || ''}
                        onChange={e => setForm(f => ({ ...f, zip_code: e.target.value }))}
                        placeholder="00000-000"
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-secundaria outline-none focus:border-primaria transition-colors"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Cidade</label>
                      <input
                        type="text"
                        value={form.city || ''}
                        onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-secundaria outline-none focus:border-primaria transition-colors"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Estado (UF)</label>
                      <input
                        type="text"
                        value={form.state || ''}
                        onChange={e => setForm(f => ({ ...f, state: e.target.value }))}
                        maxLength={2}
                        placeholder="PA"
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-secundaria outline-none focus:border-primaria transition-colors uppercase"
                      />
                    </div>

                    <div className="col-span-2 space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Canal de Aquisição</label>
                      <select
                        value={form.acquisition_channel || ''}
                        onChange={e => setForm(f => ({ ...f, acquisition_channel: e.target.value }))}
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-secundaria outline-none focus:border-primaria transition-colors bg-white"
                      >
                        <option value="">Não informado</option>
                        {ACQUISITION_CHANNELS.map(ch => (
                          <option key={ch} value={ch}>{ch}</option>
                        ))}
                      </select>
                    </div>

                    <div className="col-span-2 space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Observações Internas</label>
                      <textarea
                        value={form.internal_notes || ''}
                        onChange={e => setForm(f => ({ ...f, internal_notes: e.target.value }))}
                        rows={3}
                        placeholder="Preferências, histórico de contato, anotações da equipe..."
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-secundaria outline-none focus:border-primaria transition-colors resize-none"
                      />
                    </div>

                  </div>
                </div>
              </div>

              {/* Footer com ações */}
              <div className="px-8 py-5 border-t border-gray-100 flex gap-3 sticky bottom-0 bg-white">
                <button
                  type="button"
                  onClick={() => setSelectedClient(null)}
                  className="flex-1 border border-gray-200 text-gray-400 font-bold py-3 rounded-xl text-[10px] uppercase tracking-widest hover:bg-gray-50 transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saveMutation.isPending}
                  className="flex-1 bg-secundaria text-white font-bold py-3 rounded-xl text-[10px] uppercase tracking-widest hover:bg-black transition-all disabled:opacity-50"
                >
                  {saveMutation.isPending ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
