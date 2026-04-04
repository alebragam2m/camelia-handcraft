import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { supplierService } from '../services/supplierService';
import ErrorBoundary from './ErrorBoundary';
import type { Supplier } from '../types/supabase';

interface SupplierFormValues {
  name: string;
  contact_person: string;
  cnpj_cpf: string;
  phone: string;
  email: string;
  supplied_items: string;
  reliability_score: number | string;
  internal_notes: string;
}

export default function SuppliersModule() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: suppliers = [], isLoading: loading } = useQuery({
    queryKey: ['suppliers'],
    queryFn: () => supplierService.getAll(),
  });

  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<SupplierFormValues>({
    defaultValues: {
      name: '',
      contact_person: '',
      cnpj_cpf: '',
      phone: '',
      email: '',
      supplied_items: '',
      reliability_score: 5,
      internal_notes: ''
    }
  });

  const saveMutation = useMutation({
    mutationFn: (data: SupplierFormValues) => {
      const payload = {
        ...data,
        reliability_score: Number(data.reliability_score)
      };
      return supplierService.save(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      setIsModalOpen(false);
      reset();
    },
    onError: (err: Error) => alert(`Erro: ${err.message}`)
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => supplierService.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['suppliers'] })
  });

  const onFormSubmit = (data: SupplierFormValues) => {
    saveMutation.mutate(data);
  };

  return (
    <ErrorBoundary>
      <div className="animate-fade-in-down space-y-6">
        <div className="flex justify-between items-center bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
          <div>
            <h2 className="text-3xl font-serif font-bold text-secundaria mb-1 flex items-center gap-3">Gestão B2B <span>🤝</span></h2>
            <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">Base de Parceiros e Insumos (Motor Pro v3)</p>
          </div>
          <button onClick={() => { reset(); setIsModalOpen(true); }} className="bg-secundaria text-white px-6 py-4 rounded-xl shadow-lg hover:bg-black font-bold text-sm uppercase transition-all">
            + Novo Parceiro
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-40 animate-pulse text-[10px] font-bold text-secundaria uppercase tracking-widest">Sincronizando Rede B2B...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {suppliers.map(sup => (
              <div key={sup.id} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden group">
                {Number(sup.reliability_score) === 5 && <div className="absolute top-0 right-0 bg-yellow-400 text-yellow-900 text-[8px] font-bold uppercase px-3 py-1 rounded-bl-xl tracking-widest">Parceiro Ouro</div>}
                
                <div>
                  <h3 className="font-serif font-bold text-secundaria text-xl mb-1">{sup.name}</h3>
                  <p className="text-xs text-gray-500 font-bold mb-4">{sup.contact_person ? `A/C: ${sup.contact_person}` : 'Contato Direto'}</p>
                  <div className="space-y-2 mb-6">
                    <p className="text-xs text-gray-600 flex items-center gap-2"><span>📞</span> <span className="font-bold">{sup.phone || 'N/A'}</span></p>
                    {sup.email && <p className="text-xs text-gray-600 flex items-center gap-2"><span>✉️</span> {sup.email}</p>}
                  </div>
                  <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 mb-4 font-bold text-xs text-secundaria">
                     <p className="text-[9px] uppercase tracking-widest text-gray-400 mb-1">Insumos</p>
                     {sup.supplied_items || 'Suprimentos Diversos'}
                  </div>
                </div>

                <div className="flex justify-between items-center pt-4 border-t mt-2">
                  <div className="flex text-yellow-500 text-sm">
                    {Array.from({ length: Number(sup.reliability_score) || 0 }).map((_, i) => <span key={i}>★</span>)}
                  </div>
                  <button onClick={() => { if(confirm('Remover?')) deleteMutation.mutate(sup.id); }} className="text-[10px] text-gray-300 hover:text-red-500 uppercase font-bold underline opacity-0 group-hover:opacity-100 transition-all">Excluir</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {isModalOpen && (
          <div className="fixed inset-0 bg-secundaria/80 backdrop-blur z-[150] flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
              <div className="bg-gray-50 px-8 py-6 border-b flex justify-between items-center">
                <h3 className="font-serif font-bold text-secundaria text-2xl">Novo Parceiro</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-red-500 font-bold text-[10px]">FECHAR [X]</button>
              </div>

              <form onSubmit={handleSubmit(onFormSubmit)} className="p-8 space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Empresa / Razão Social *</label>
                    <input type="text" {...register('name', { required: true })} className="w-full p-4 bg-gray-50 rounded-xl border border-gray-100 font-bold text-secundaria" />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Contato</label>
                    <input type="text" {...register('contact_person')} className="w-full p-4 bg-gray-50 rounded-xl border border-gray-100 font-bold text-secundaria" />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">WhatsApp</label>
                    <input type="text" {...register('phone')} className="w-full p-4 bg-gray-50 rounded-xl border border-gray-100 font-bold text-secundaria" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Nota de Confiabilidade</label>
                    <select {...register('reliability_score')} className="w-full p-4 bg-gray-50 rounded-xl border border-gray-100 font-bold text-yellow-600">
                      <option value="5">★★★★★ - Impecável</option>
                      <option value="4">★★★★☆ - Ótimo</option>
                      <option value="3">★★★☆☆ - Regular</option>
                    </select>
                  </div>
                </div>
                <button type="submit" disabled={isSubmitting || saveMutation.isPending} className="w-full bg-secundaria text-white font-bold py-5 rounded-xl uppercase tracking-widest text-[10px] shadow-xl disabled:opacity-50">
                  {saveMutation.isPending ? 'Sincronizando...' : 'Concluir Cadastro'}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}
