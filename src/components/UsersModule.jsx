import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';

export default function UsersModule() {
  const [adminUsers, setAdminUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  const fetchUsers = async () => {
    setLoading(true);
    const { data } = await supabase.from('admin_users').select('*').order('created_at');
    if (data) setAdminUsers(data);
    setLoading(false);
  };

  const fetchCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUser(user);
  };

  useEffect(() => { fetchUsers(); fetchCurrentUser(); }, []);

  const toggleUserActive = async (user) => {
    await supabase.from('admin_users').update({ is_active: !user.is_active }).eq('id', user.id);
    fetchUsers();
  };

  const changeRole = async (userId, newRole) => {
    await supabase.from('admin_users').update({ role: newRole }).eq('id', userId);
    fetchUsers();
  };

  const ROLE_CONFIG = {
    Admin: {
      label: 'Admin Master',
      color: 'bg-secundaria text-white',
      badge: '👑',
      permissions: ['Visão Geral (DRE)', 'Produtos', 'Estoque (PCP)', 'CRM Completo', 'Vendas', 'Financeiro', 'Fornecedores', 'Gestão de Usuários']
    },
    Vendedor: {
      label: 'Vendedor',
      color: 'bg-blue-100 text-blue-800',
      badge: '🛒',
      permissions: ['CRM Completo', 'Vendas', 'Ver Produtos (sem custos)']
    }
  };

  return (
    <div className="animate-fade-in-down space-y-6">

      {/* HEADER */}
      <div className="flex justify-between items-center bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
        <div>
          <h2 className="text-3xl font-serif font-bold text-secundaria mb-1">Controle de Acessos</h2>
          <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">RBAC — Perfis e Permissões do Painel Admin</p>
        </div>
        <button onClick={() => { setIsModalOpen(true); }}
          className="bg-secundaria text-white px-6 py-4 rounded-xl shadow-lg hover:bg-black font-bold text-sm uppercase tracking-widest border border-gray-800 transition-colors">
          + Novo Convite
        </button>
      </div>

      {/* CARDS DE PERFIL (Explicação visual) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Object.entries(ROLE_CONFIG).map(([role, cfg]) => (
          <div key={role} className={`rounded-3xl p-8 border-2 ${role === 'Admin' ? 'border-secundaria bg-secundaria text-white' : 'border-blue-200 bg-blue-50'}`}>
            <div className="flex items-center gap-3 mb-6">
              <span className="text-4xl">{cfg.badge}</span>
              <div>
                <h3 className={`font-serif font-bold text-xl ${role === 'Admin' ? 'text-white' : 'text-secundaria'}`}>{cfg.label}</h3>
                <p className={`text-[10px] font-bold uppercase tracking-widest ${role === 'Admin' ? 'text-gray-300' : 'text-blue-400'}`}>Nível de Acesso: {role}</p>
              </div>
            </div>
            <ul className="space-y-2">
              {cfg.permissions.map(p => (
                <li key={p} className={`flex items-center gap-2 text-xs font-bold ${role === 'Admin' ? 'text-gray-200' : 'text-blue-700'}`}>
                  <span className="text-emerald-400">✓</span>{p}
                </li>
              ))}
              {role === 'Vendedor' && (
                <>
                  <li className="flex items-center gap-2 text-xs font-bold text-red-400"><span>✗</span> Financeiro (DRE bloqueado)</li>
                  <li className="flex items-center gap-2 text-xs font-bold text-red-400"><span>✗</span> Visão Geral — Lucros ocultos</li>
                  <li className="flex items-center gap-2 text-xs font-bold text-red-400"><span>✗</span> Gestão de Usuários</li>
                </>
              )}
            </ul>
          </div>
        ))}
      </div>

      {/* TABELA DE USUÁRIOS */}
      {loading ? (
        <p className="animate-pulse text-xs font-bold text-gray-400 text-center py-12">Carregando usuários...</p>
      ) : (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 font-bold uppercase tracking-widest text-[10px]">
              <tr>
                <th className="p-5 pl-8">Nome</th>
                <th className="p-5">Perfil de Acesso</th>
                <th className="p-5 text-center">Status</th>
                <th className="p-5 text-right pr-8">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {adminUsers.map(u => (
                <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                  <td className="p-5 pl-8">
                    <p className="font-bold text-secundaria text-base flex items-center gap-2">
                      {ROLE_CONFIG[u.role]?.badge} {u.full_name}
                    </p>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Desde {new Date(u.created_at).toLocaleDateString('pt-BR')}</p>
                  </td>
                  <td className="p-5">
                    <select
                      value={u.role}
                      onChange={e => changeRole(u.id, e.target.value)}
                      className={`text-[10px] font-bold uppercase px-3 py-2 rounded-lg border outline-none cursor-pointer ${u.role === 'Admin' ? 'bg-secundaria text-white border-secundaria shadow-sm' : 'bg-blue-50 text-blue-800 border-blue-200'}`}>
                      <option value="Admin">👑 Admin Master</option>
                      <option value="Vendedor">🛒 Vendedor</option>
                    </select>
                  </td>
                  <td className="p-5 text-center">
                    {u.is_active
                      ? <span className="bg-emerald-50 text-emerald-700 font-bold text-[10px] uppercase px-3 py-1 rounded-full border border-emerald-200">Ativo</span>
                      : <span className="bg-red-50 text-red-600 font-bold text-[10px] uppercase px-3 py-1 rounded-full border border-red-200">Suspenso</span>}
                  </td>
                  <td className="p-5 text-right pr-8">
                    <button onClick={() => toggleUserActive(u)}
                      className={`text-[10px] font-bold uppercase px-3 py-2 rounded-lg transition-colors ${u.is_active ? 'text-red-500 bg-red-50 hover:bg-red-100 border border-red-200' : 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200'}`}>
                      {u.is_active ? 'Suspender' : 'Reativar'}
                    </button>
                  </td>
                </tr>
              ))}
              {adminUsers.length === 0 && (
                <tr><td colSpan="4" className="p-16 text-center text-gray-400 font-bold text-sm">
                  Nenhum perfil adicional cadastrado. Cadastre um Vendedor para começar.
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL DE INSTRUÇÕES DE CONVITE (Sincronizado via SQL) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-secundaria/80 backdrop-blur-md z-[200] flex items-center justify-center p-4">
          <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-2xl overflow-hidden border border-white/20 animate-slide-in-up">
            
            <div className="bg-secundaria p-10 text-white relative h-48 flex flex-col justify-end">
               <button onClick={() => setIsModalOpen(false)} className="absolute top-8 right-8 text-white/50 hover:text-white transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
               </button>
               <span className="text-[10px] uppercase font-bold tracking-[5px] text-primaria mb-2">Segurança em Primeiro Lugar</span>
               <h3 className="font-serif font-bold text-4xl">Convite de Acesso Profissional</h3>
            </div>

            <div className="p-10 space-y-8">
               <div className="space-y-4">
                  <p className="text-gray-600 leading-relaxed">
                     Para garantir a máxima segurança, o acesso de novos membros (como a <strong>Cecília</strong>) deve ser feito através do fluxo nativo de convites do Supabase. 
                     Dessa forma, ela poderá <strong>criar sua própria senha privativa</strong> no primeiro acesso.
                  </p>
                  
                  <div className="bg-fundo rounded-2xl p-6 border border-gray-100 space-y-4">
                     <h4 className="font-bold text-secundaria text-sm uppercase tracking-widest flex items-center gap-2">
                        <span className="flex items-center justify-center w-6 h-6 bg-primaria text-white rounded-full text-[10px]">1</span>
                        Passo a Passo no Supabase:
                     </h4>
                     <ol className="space-y-3 text-sm text-gray-500 font-medium">
                        <li className="flex gap-3"><span>•</span> Vá em <strong>Auth &gt; Users</strong> no seu painel Supabase.</li>
                        <li className="flex gap-3"><span>•</span> Clique no botão <strong>Invite User</strong>.</li>
                        <li className="flex gap-3"><span>•</span> Insira o e-mail dela e clique em <strong>Send Invite</strong>.</li>
                     </ol>
                  </div>

                  <div className="flex items-center gap-4 p-4 bg-emerald-50 border border-emerald-100 rounded-xl">
                     <span className="text-2xl">✨</span>
                     <p className="text-xs text-emerald-800 font-bold leading-tight">
                        <strong>Automação Ativa:</strong> O App agora sincroniza automaticamente! Assim que você convidar, o nome dela aparecerá nesta lista sem erros de Foreign Key.
                     </p>
                  </div>
               </div>

               <div className="flex gap-4 pt-4 border-t border-gray-100">
                  <a href="https://supabase.com/dashboard/project/hyheltgxnkbmqiugbztb/auth/users" target="_blank" rel="noreferrer"
                     className="flex-1 bg-secundaria text-white text-center font-bold py-5 rounded-2xl uppercase tracking-widest text-xs hover:bg-black transition-all shadow-xl">
                     Abrir Painel de Convites →
                  </a>
                  <button onClick={() => setIsModalOpen(false)}
                     className="px-8 py-5 border border-gray-200 text-gray-400 font-bold rounded-2xl uppercase tracking-widest text-xs hover:bg-gray-50 transition-colors">
                     Entendi
                  </button>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
