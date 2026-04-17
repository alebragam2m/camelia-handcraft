import React, { useState } from 'react';
import type { Client, Sale } from '../types/supabase';
import { formatCurrency } from '../utils/formatCurrency';

interface ClientProfileViewProps {
  client: Client;
  sales: any[]; // Vendas globais do TanStack
  onBack: () => void;
}

export default function ClientProfileView({ client, sales, onBack }: ClientProfileViewProps) {
  const [selectedSale, setSelectedSale] = useState<any | null>(null);

  // Filtrar apenas as vendas deste cliente, ordenar da mais recente para mais antiga
  const clientSales = sales
    .filter(s => s.client_id === client.id)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const totalLTV = clientSales.reduce((acc, s) => acc + (Number(s.total_amount) || 0), 0);

  return (
    <div className="space-y-6 animate-in slide-in-from-right-8 duration-500">
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="text-gray-400 hover:text-secundaria font-bold text-xs uppercase tracking-widest transition-colors flex items-center gap-2">
          <span>←</span> Voltar à Lista
        </button>
      </div>

      {/* CABEÇALHO DO PERFIL */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-secundaria to-primaria text-white flex items-center justify-center text-3xl font-serif shadow-lg">
            {client.full_name?.charAt(0) || '?'}
          </div>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-3xl font-serif font-bold text-secundaria">{client.full_name}</h2>
              {client.is_vip && <span className="bg-[#D4AF37] text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-md">VIP Gold</span>}
            </div>
            <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">{client.email || 'Sem e-mail'} • {client.phone || 'Sem telefone'}</p>
          </div>
        </div>

        <div className="bg-gray-50 border border-gray-100 p-5 rounded-2xl flex items-center gap-6 shadow-inner">
           <div>
             <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">LTV (Lifetime Value)</p>
             <p className="text-2xl font-bold text-emerald-600">{formatCurrency(totalLTV)}</p>
           </div>
           <div className="w-px h-10 bg-gray-200"></div>
           <div>
             <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Pedidos Aprovados</p>
             <p className="text-2xl font-bold text-secundaria">{clientSales.length}</p>
           </div>
        </div>
      </div>

      {/* HISTÓRICO DE PEDIDOS */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
        <h3 className="font-serif text-xl font-bold text-secundaria mb-6 flex items-center gap-3">
          Histórico de Compras <span className="text-gray-300">| Timeline</span>
        </h3>

        {clientSales.length === 0 ? (
           <div className="text-center py-12 border-2 border-dashed border-gray-100 rounded-2xl bg-gray-50/50">
             <span className="text-4xl mb-4 opacity-50 block">🛍️</span>
             <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Nenhuma venda registrada para este cliente ainda.</p>
           </div>
        ) : (
           <div className="space-y-4">
             {clientSales.map((sale) => {
               const dataBR = new Date(sale.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
               const statusColor = sale.status === 'Finalizada' || sale.status === 'Aprovado' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100';

               return (
                 <div key={sale.id} className="border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 group">
                   {/* CABEÇALHO DO PEDIDO (CLICÁVEL -> ABRE POPUP) */}
                   <button 
                     onClick={() => setSelectedSale(sale)}
                     className="w-full bg-gray-50 flex items-center justify-between p-5 text-left focus:outline-none"
                   >
                     <div className="flex items-center gap-6">
                        <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 group-hover:scale-110 transition-transform">
                           <span className="text-2xl">🛍️</span>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{dataBR}</p>
                          <div className="flex items-center gap-3">
                            <h4 className="font-bold text-secundaria text-lg">{formatCurrency(sale.total_amount)}</h4>
                            <span className={`text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${statusColor}`}>
                              {sale.status || 'Processando'}
                            </span>
                          </div>
                        </div>
                     </div>
                     <div className="flex items-center gap-6 text-right">
                        <div>
                          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Pagamento via</p>
                          <p className="font-bold text-secundaria uppercase text-xs">{sale.payment_method || 'Não Informado'}</p>
                        </div>
                        <div className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 group-hover:bg-secundaria group-hover:text-white transition-all">
                          ❯
                        </div>
                     </div>
                   </button>
                 </div>
               );
             })}
           </div>
        )}
      </div>

      {/* POPUP FLUTUANTE DE RADIOGRAFIA DO PEDIDO (Opção 2) */}
      {selectedSale && (
         <div className="fixed inset-0 bg-secundaria/80 backdrop-blur-sm z-[250] flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
               {/* Header Popup */}
               <div className="bg-secundaria px-8 py-6 text-white flex justify-between items-center">
                  <div>
                    <h3 className="font-serif text-2xl font-bold mb-1">Radiografia da Compra</h3>
                    <p className="text-[10px] text-primaria font-bold uppercase tracking-widest">
                       {new Date(selectedSale.created_at).toLocaleDateString('pt-BR')} • {selectedSale.payment_method || 'Pagamento Local'}
                    </p>
                  </div>
                  <button onClick={() => setSelectedSale(null)} className="text-white/50 hover:text-white font-bold text-xl scale-125 transition-transform">✕</button>
               </div>

               {/* Itens */}
               <div className="p-8 max-h-[60vh] overflow-y-auto space-y-4">
                  {(selectedSale.sale_items || []).map((item: any, idx: number) => (
                     <div key={item.id || idx} className="flex items-center gap-6 bg-gray-50 border border-gray-100 p-4 rounded-xl">
                        <div className="w-16 h-16 rounded-xl overflow-hidden bg-white border border-gray-200 flex items-center justify-center">
                           {item.products?.image_url ? (
                              <img src={item.products.image_url} alt={item.products.nome} className="w-full h-full object-cover" />
                           ) : (
                              <span className="text-2xl">🏷️</span>
                           )}
                        </div>
                        <div className="flex-1">
                          <p className="font-bold text-secundaria">{item.products?.nome || 'Item Excluído ou Insumo'}</p>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">
                             Rendimento de {item.quantity} unidades
                          </p>
                        </div>
                        <div className="text-right">
                           <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">{formatCurrency(item.unit_price)} unid.</p>
                           <p className="font-bold text-lg text-secundaria">{formatCurrency(item.quantity * item.unit_price)}</p>
                        </div>
                     </div>
                  ))}
               </div>

               {/* Footer Popup */}
               <div className="bg-gray-50 border-t border-gray-100 p-8 flex justify-between items-center">
                  <div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Total Confirmado</p>
                    <p className="font-serif font-bold text-3xl text-emerald-600">{formatCurrency(selectedSale.total_amount)}</p>
                  </div>
                  <button onClick={() => setSelectedSale(null)} className="px-8 py-3 bg-white border-2 border-gray-200 text-gray-500 font-bold rounded-xl uppercase tracking-widest text-[10px] hover:border-secundaria hover:text-secundaria hover:bg-gray-50 transition-all">
                     Fechar Extrato
                  </button>
               </div>
            </div>
         </div>
      )}
    </div>
  );
}
