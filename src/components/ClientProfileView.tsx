import React, { useState } from 'react';
import type { Client } from '../types/supabase';
import { formatCurrency } from '../utils/formatCurrency';

interface ClientProfileViewProps {
  client: Client;
  sales: any[];
  onBack: () => void;
}

export default function ClientProfileView({ client, sales, onBack }: ClientProfileViewProps) {
  const [selectedSale, setSelectedSale] = useState<any | null>(null);

  const clientSales = sales
    .filter(s => s.client_id === client.id)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const totalLTV = clientSales.reduce((acc, s) => acc + (Number(s.total_amount) || 0), 0);

  return (
    <div className="space-y-4 animate-in slide-in-from-right-8 duration-500">
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="text-gray-400 hover:text-secundaria font-bold text-[10px] uppercase tracking-widest transition-colors flex items-center gap-2">
          ← Voltar à Lista
        </button>
      </div>

      {/* CABEÇALHO DO PERFIL */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-secundaria to-primaria text-white flex items-center justify-center text-lg font-serif shadow-md">
            {client.full_name?.charAt(0) || '?'}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <h2 className="text-lg font-serif font-bold text-secundaria">{client.full_name}</h2>
              {client.is_vip && <span className="bg-[#D4AF37] text-white px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-widest shadow-sm">VIP Gold</span>}
            </div>
            <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">{client.email || 'Sem e-mail'} • {client.phone || 'Sem telefone'}</p>
          </div>
        </div>

        <div className="bg-gray-50 border border-gray-100 px-5 py-3 rounded-xl flex items-center gap-5">
          <div>
            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">LTV Total</p>
            <p className="text-base font-bold text-emerald-600">{formatCurrency(totalLTV)}</p>
          </div>
          <div className="w-px h-8 bg-gray-200"></div>
          <div>
            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Pedidos</p>
            <p className="text-base font-bold text-secundaria">{clientSales.length}</p>
          </div>
        </div>
      </div>

      {/* HISTÓRICO DE PEDIDOS */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <h3 className="font-serif text-base font-bold text-secundaria mb-4 flex items-center gap-2">
          Histórico de Compras <span className="text-gray-300 font-sans text-[10px] font-bold uppercase tracking-widest">| Timeline</span>
        </h3>

        {clientSales.length === 0 ? (
          <div className="text-center py-8 border-2 border-dashed border-gray-100 rounded-xl bg-gray-50/50">
            <span className="text-3xl mb-2 opacity-40 block">🛍️</span>
            <p className="text-gray-400 font-bold uppercase tracking-widest text-[9px]">Nenhuma venda registrada para este cliente ainda.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {clientSales.map((sale) => {
              const dataBR = new Date(sale.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
              const statusColor = sale.status === 'Finalizada' || sale.status === 'Aprovado'
                ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                : 'bg-amber-50 text-amber-600 border-amber-100';

              return (
                <div key={sale.id} className="border border-gray-100 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 group">
                  <button
                    onClick={() => setSelectedSale(sale)}
                    className="w-full bg-gray-50 flex items-center justify-between px-5 py-3 text-left focus:outline-none"
                  >
                    <div className="flex items-center gap-4">
                      <div className="bg-white p-2 rounded-lg shadow-sm border border-gray-100 group-hover:scale-110 transition-transform">
                        <span className="text-base">🛍️</span>
                      </div>
                      <div>
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">{dataBR}</p>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-secundaria text-sm">{formatCurrency(sale.total_amount)}</h4>
                          <span className={`text-[7px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${statusColor}`}>
                            {sale.status || 'Processando'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-right">
                      <div>
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">via</p>
                        <p className="font-bold text-secundaria uppercase text-[10px]">{sale.payment_method || 'Não Informado'}</p>
                      </div>
                      <div className="w-6 h-6 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 text-[10px] group-hover:bg-secundaria group-hover:text-white transition-all">
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

      {/* POPUP FLUTUANTE DE RADIOGRAFIA DO PEDIDO */}
      {selectedSale && (
        <div className="fixed inset-0 bg-secundaria/80 backdrop-blur-sm z-[250] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header Popup */}
            <div className="bg-secundaria px-6 py-4 text-white flex justify-between items-center">
              <div>
                <h3 className="font-serif text-base font-bold mb-0.5">Radiografia da Compra</h3>
                <p className="text-[9px] text-primaria font-bold uppercase tracking-widest">
                  {new Date(selectedSale.created_at).toLocaleDateString('pt-BR')} • {selectedSale.payment_method || 'Pagamento Local'}
                </p>
              </div>
              <button onClick={() => setSelectedSale(null)} className="text-white/50 hover:text-white font-bold text-base transition-colors">✕</button>
            </div>

            {/* Itens */}
            <div className="p-5 max-h-[55vh] overflow-y-auto space-y-3">
              {(selectedSale.sale_items || []).map((item: any, idx: number) => (
                <div key={item.id || idx} className="flex items-center gap-4 bg-gray-50 border border-gray-100 p-3 rounded-xl">
                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-white border border-gray-200 flex items-center justify-center flex-shrink-0">
                    {item.products?.image_url ? (
                      <img src={item.products.image_url} alt={item.products.nome} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-lg">🏷️</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-secundaria text-sm">{item.products?.nome || 'Item Excluído'}</p>
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
                      {item.quantity}x de {formatCurrency(item.unit_price)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-sm text-secundaria">{formatCurrency(item.quantity * item.unit_price)}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer Popup */}
            <div className="bg-gray-50 border-t border-gray-100 px-6 py-4 flex justify-between items-center">
              <div>
                <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mb-0.5">Total Confirmado</p>
                <p className="font-serif font-bold text-xl text-emerald-600">{formatCurrency(selectedSale.total_amount)}</p>
              </div>
              <button onClick={() => setSelectedSale(null)} className="px-5 py-2 bg-white border border-gray-200 text-gray-500 font-bold rounded-lg uppercase tracking-widest text-[9px] hover:border-secundaria hover:text-secundaria transition-all">
                Fechar Extrato
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
