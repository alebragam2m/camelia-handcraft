import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import ErrorBoundary from './ErrorBoundary';
import type { AdminUser } from '../types/supabase';

const LEVEL_CONFIG: Record<number, any> = {
  4: { label: 'Admin/Dono', badge: '👑', color: 'text-secundaria', bg: 'bg-secundaria' },
  3: { label: 'Gestor', badge: '💼', color: 'text-blue-700', bg: 'bg-blue-50' },
  2: { label: 'Vendedor', badge: '🛒', color: 'text-emerald-700', bg: 'bg-emerald-50' },
  1: { label: 'Visualizador', badge: '👁️', color: 'text-gray-500', bg: 'bg-gray-100' }
};

/**
 * GESTÃO DE ACESSOS (RBAC v2) - ESTABILIDADE MÁXIMA
 */
export default function UsersModule() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: adminUsers = [], isLoading: loading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const { data, error } = await supabase.from('admin_users').select('*').order('created_at');
      if (error) throw error;
      return data || [];
    }
  });

  const toggleMutation = useMutation({
    mutationFn: async (user: AdminUser) => {
      const { error } = await supabase.from('admin_users').update({ is_active: !user.is_active }).eq('id', user.id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-users'] })
  });

  const levelMutation = useMutation({
    mutationFn: async ({ id, level }: { id: string, level: number }) => {
      const { error } = await supabase.from('admin_users').update({ access_level: level }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-users'] })
  });

  return (
    <ErrorBoundary>
      <div className="animate-fade-in-down space-y-6">
        <div className="flex justify-between items-center bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
          <div>
            <h2 className="text-3xl font-serif font-bold text-secundaria mb-1">Controle de Perfis</h2>
            <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest text-[9px]">Hierarquia Numérica — Estabilidade Máxima</p>
          </div>
          <button onClick={() => setIsModalOpen(true)} className="bg-secundaria text-white px-6 py-4 rounded-xl shadow-lg hover:bg-black font-bold text-sm uppercase transition-all">
            + Novo Convite
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {Object.entries(LEVEL_CONFIG).map(([level, cfg]) => (
            <div key={level} className={`rounded-3xl p-6 border-2 transition-all ${cfg.bg} border-transparent`}>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">{cfg.badge}</span>
                <h3 className={`font-serif font-bold text-lg ${cfg.color}`}>{cfg.label}</h3>
              </div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Nível {level}</p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b text-gray-500 font-bold uppercase tracking-widest text-[10px]">
              <tr><th className="p-5 pl-8">Usuário</th><th className="p-5">Nível de Acesso</th><th className="p-5 text-center">Status</th><th className="p-5 text-right pr-8">Auditoria</th></tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={4} className="p-10 text-center animate-pulse font-bold text-gray-400">SINCRONIZANDO HIERARQUIA...</td></tr>
              ) : adminUsers.map((u: any) => (
                <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="p-5 pl-8">
                    <p className="font-bold text-secundaria">{u.full_name}</p>
                    <p className="text-[9px] text-gray-400 uppercase font-bold tracking-widest">Registrado em {new Date(u.created_at).toLocaleDateString('pt-BR')}</p>
                  </td>
                  <td className="p-5">
                    <select 
                      value={u.access_level} 
                      onChange={e => levelMutation.mutate({ id: u.id, level: parseInt(e.target.value) })} 
                      className={`text-[10px] font-bold uppercase px-3 py-2 rounded-lg border outline-none bg-white text-secundaria border-gray-200 cursor-pointer`}
                    >
                      <option value={4}>4 - Admin/Dono</option>
                      <option value={3}>3 - Gestor</option>
                      <option value={2}>2 - Vendedor</option>
                      <option value={1}>1 - Visualizador</option>
                    </select>
                  </td>
                  <td className="p-5 text-center">
                    <span className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase border ${u.is_active ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-600 border-red-200'}`}>{u.is_active ? 'Ativo' : 'Suspenso'}</span>
                  </td>
                  <td className="p-5 text-right pr-8">
                    <button onClick={() => toggleMutation.mutate(u)} className={`text-[10px] font-bold uppercase px-4 py-2 rounded-lg border transition-all ${u.is_active ? 'text-red-500 bg-red-50 hover:bg-red-100 border-red-200' : 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100 border-emerald-200'}`}>{u.is_active ? 'Suspender' : 'Reativar'}</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* MODAL CONVITE (Sincronizado) */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-secundaria/80 backdrop-blur-md z-[200] flex items-center justify-center p-4">
             <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-2xl overflow-hidden animate-in slide-in-from-bottom duration-300">
                <div className="bg-secundaria p-10 text-white">
                   <button onClick={() => setIsModalOpen(false)} className="absolute top-8 right-8 text-white/50 hover:text-white">✕</button>
                   <span className="text-[10px] uppercase font-bold tracking-[5px] text-primaria mb-2 block">Segurança Estrita</span>
                   <h3 className="font-serif font-bold text-4xl">Convidar para a Camélia</h3>
                </div>
                <div className="p-10 space-y-6">
                   <p className="text-gray-600 leading-relaxed font-medium">Novos acessos devem ser convidados pelo painel do Supabase para garantir a criação de senhas individuais seguras.</p>
                   <div className="flex gap-4">
                      <a href="https://supabase.com/dashboard/project/hyheltgxnkbmqiugbztb/auth/users" target="_blank" rel="noreferrer" className="flex-1 bg-secundaria text-white text-center font-bold py-5 rounded-2xl uppercase tracking-widest text-[10px] shadow-xl">Painel Supabase →</a>
                      <button onClick={() => setIsModalOpen(false)} className="px-8 py-5 border border-gray-200 text-gray-400 font-bold rounded-2xl uppercase text-[10px]">Entendi</button>
                   </div>
                </div>
             </div>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}
