import React, { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { db } from '../services/db';

export default function SuppliersModule() {
  const { suppliers, loading, actions } = useData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const defaultForm = { 
    name: '', 
    contact_person: '', 
    cnpj_cpf: '', 
    phone: '', 
    email: '', 
    supplied_items: '', 
    reliability_score: 5, 
    internal_notes: '' 
  };
  const [formData, setFormData] = useState(defaultForm);

  const handleSubmit = async (e) => {
     e.preventDefault();
     setIsSaving(true);
     
     try {
       const payload = {
         name: formData.name,
         contact_person: formData.contact_person || null,
         cnpj_cpf: formData.cnpj_cpf || null,
         phone: formData.phone || null,
         email: formData.email || null,
         supplied_items: formData.supplied_items || null,
         reliability_score: parseInt(formData.reliability_score),
         internal_notes: formData.internal_notes || null,
       };

       await actions.upsertSupplier(payload);
       setIsModalOpen(false);
       setFormData(defaultForm);
     } catch (err) {
       alert("Erro ao salvar parceiro: \n" + err.message);
     } finally {
       setIsSaving(false);
     }
  }

  const handleDelete = async (id, name) => {
      if(window.confirm(`Derrubar permanentemente o contrato/cadastro de ${name}?`)) {
          try {
            await actions.deleteSupplier(id);
          } catch (err) { alert("Erro ao excluir: " + err.message); }
      }
  }

  return (
    <div className="animate-fade-in-down space-y-6">

       <div className="flex justify-between items-center bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
           <div>
               <h2 className="text-3xl font-serif font-bold text-secundaria mb-1 flex items-center gap-3">Gestão de Fornecedores <span>🤝</span></h2>
               <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">Base de Parceiros B2B e Insumos Logísticos.</p>
           </div>
           <div className="text-right">
               <button onClick={() => { setFormData(defaultForm); setIsModalOpen(true); }} className="bg-secundaria text-white px-6 py-4 rounded-xl shadow-lg hover:bg-black font-bold text-sm uppercase tracking-widest border border-gray-800 transition-colors">
                  + Novo Parceiro
               </button>
           </div>
       </div>

       {loading ? (
             <div className="flex justify-center items-center h-40"><p className="text-secundaria font-bold animate-pulse text-sm uppercase tracking-widest">Acessando Rede B2B...</p></div>
       ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {suppliers.map(sup => (
                  <div key={sup.id} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden group">
                     {sup.reliability_score === 5 && <div className="absolute top-0 right-0 bg-yellow-400 text-yellow-900 text-[8px] font-bold uppercase px-3 py-1 rounded-bl-xl tracking-widest">Parceiro Ouro</div>}
                     
                     <div>
                         <h3 className="font-serif font-bold text-secundaria text-xl mb-1">{sup.name}</h3>
                         <p className="text-xs text-gray-500 font-bold mb-4">{sup.contact_person ? `A/C: ${sup.contact_person}` : 'Contato Direto'}</p>
                         
                         <div className="space-y-2 mb-6">
                             <p className="text-xs text-gray-600 flex items-center gap-2"><span>📞</span> <span className="font-bold">{sup.phone || 'N/A'}</span></p>
                             {sup.email && <p className="text-xs text-gray-600 flex items-center gap-2"><span>✉️</span> {sup.email}</p>}
                             {sup.cnpj_cpf && <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest flex items-center gap-2"><span>📄</span> Doc: {sup.cnpj_cpf}</p>}
                         </div>

                         <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 mb-4">
                             <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-1">Insumos Fornecidos</p>
                             <p className="text-sm font-bold text-secundaria">{sup.supplied_items || 'Mix de Suprimentos Gerais'}</p>
                         </div>
                     </div>

                     <div className="flex justify-between items-center pt-4 border-t border-gray-100 mt-2">
                         <div className="flex text-yellow-500 text-sm">
                             {Array.from({ length: sup.reliability_score }).map((_, i) => <span key={i}>★</span>)}
                             {Array.from({ length: 5 - sup.reliability_score }).map((_, i) => <span key={i} className="text-gray-200">★</span>)}
                         </div>
                         <button onClick={() => handleDelete(sup.id, sup.name)} className="text-[10px] text-gray-400 hover:text-red-500 uppercase font-bold tracking-widest underline opacity-0 group-hover:opacity-100 transition-opacity">Romper</button>
                     </div>
                  </div>
              ))}
              {suppliers.length === 0 && (
                  <div className="col-span-full py-16 text-center text-gray-400 font-bold text-sm bg-white rounded-3xl border border-dashed border-gray-200">
                     Nenhum fornecedor catalogado. A rede de suprimentos B2B está vazia.
                  </div>
              )}
          </div>
       )}

       {/* MODAL CADASTRAR PARCEIRO */}
       {isModalOpen && (
          <div className="fixed inset-0 bg-secundaria/80 backdrop-blur z-[100] flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border border-white/20">
                  <div className="bg-gray-50 px-8 py-6 border-b border-gray-100 flex justify-between items-center">
                     <h3 className="font-serif font-bold text-secundaria text-2xl">Cadastro de Parceiros</h3>
                     <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-red-500 font-bold text-[10px] uppercase">Fechar [X]</button>
                  </div>

                  <form onSubmit={handleSubmit} className="p-8 space-y-5">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                         <div className="md:col-span-2">
                             <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Empresa / Razão Social *</label>
                             <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Armazém das Linhas Matriz" className="w-full p-4 bg-gray-50 rounded-xl border border-gray-200 text-sm font-bold text-secundaria outline-none" />
                         </div>
                         <div>
                             <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Nome do Vendedor / A.C <span className="text-gray-300 normal-case font-normal text-[9px]">(opcional)</span></label>
                             <input type="text" value={formData.contact_person} onChange={e => setFormData({...formData, contact_person: e.target.value})} placeholder="João Silva" className="w-full p-4 bg-gray-50 rounded-xl border border-gray-200 text-sm font-bold text-secundaria outline-none" />
                         </div>
                         <div>
                             <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">CNPJ ou CPF <span className="text-gray-300 normal-case font-normal text-[9px]">(opcional)</span></label>
                             <input type="text" value={formData.cnpj_cpf} onChange={e => setFormData({...formData, cnpj_cpf: e.target.value})} placeholder="00.000.000/0001-00" className="w-full p-4 bg-gray-50 rounded-xl border border-gray-200 text-sm font-bold text-secundaria outline-none" />
                         </div>
                         <div>
                             <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">WhatsApp / Telefone <span className="text-gray-300 normal-case font-normal text-[9px]">(opcional)</span></label>
                             <input type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="(11) 99999-9999" className="w-full p-4 bg-gray-50 rounded-xl border border-gray-200 text-sm font-bold text-secundaria outline-none" />
                         </div>
                         <div>
                             <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">E-mail Comercial <span className="text-gray-300 normal-case font-normal text-[9px]">(opcional)</span></label>
                             <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="vendas@empresa.com" className="w-full p-4 bg-gray-50 rounded-xl border border-gray-200 text-sm font-bold text-secundaria outline-none" />
                         </div>
                         <div className="md:col-span-2">
                             <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Insumos e Peças Fornecidas <span className="text-gray-300 normal-case font-normal text-[9px]">(opcional)</span></label>
                             <input type="text" value={formData.supplied_items} onChange={e => setFormData({...formData, supplied_items: e.target.value})} placeholder="Ex: Cera de Abelha, Linha de Crochê, Argolas" className="w-full p-4 bg-gray-50 rounded-xl border border-gray-200 text-sm font-bold text-secundaria outline-none" />
                         </div>
                         <div className="md:col-span-2">
                             <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Nota Confiabilidade Logística (Estrelas)</label>
                             <select value={formData.reliability_score} onChange={e => setFormData({...formData, reliability_score: e.target.value})} className="w-full p-4 bg-gray-50 rounded-xl border border-gray-200 text-sm font-bold text-yellow-600 outline-none">
                                <option value="5">★★★★★ - Impecável Ouro</option>
                                <option value="4">★★★★☆ - Muito Confiável</option>
                                <option value="3">★★★☆☆ - Regular / Padrão</option>
                                <option value="2">★★☆☆☆ - Histórico de Atrasos</option>
                                <option value="1">★☆☆☆☆ - Alto Risco</option>
                             </select>
                         </div>
                      </div>

                      <button type="submit" disabled={isSaving} className="w-full mt-4 bg-secundaria text-white font-bold py-5 rounded-xl uppercase tracking-widest text-sm hover:bg-black transition-colors shadow-lg">
                          {isSaving ? "Gravando Ficha..." : "Homologar Fornecedor"}
                      </button>
                  </form>
              </div>
          </div>
       )}

    </div>
  )
}
