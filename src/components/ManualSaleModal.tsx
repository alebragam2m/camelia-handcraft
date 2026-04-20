import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { saleService } from '../services/saleService';
import { productService } from '../services/productService';
import { clientService } from '../services/clientService';
import { formatCurrency } from '../utils/formatCurrency';
import { supabase } from '../lib/supabase';

interface LineItem {
  id: string;
  product: any | null;
  qty: number;
  unitPrice: number;
  productSearch: string;
}

interface ManualSaleModalProps {
  onClose: () => void;
}

const PAYMENT_METHODS = ['PIX', 'Dinheiro', 'Cartão de Crédito', 'Cartão de Débito', 'Boleto', 'Transferência'];

const newLine = (): LineItem => ({
  id: Math.random().toString(36).slice(2),
  product: null,
  qty: 1,
  unitPrice: 0,
  productSearch: '',
});

export default function ManualSaleModal({ onClose }: ManualSaleModalProps) {
  const queryClient = useQueryClient();

  // --- Dados externos ---
  const { data: products = [] } = useQuery({ queryKey: ['products'], queryFn: () => productService.getAll() });
  const { data: clients = [] } = useQuery({ queryKey: ['clients'], queryFn: () => clientService.getAll() });

  // --- Estado do formulário ---
  const today = new Date().toISOString().split('T')[0];
  const [saleDate, setSaleDate] = useState(today);
  const [clientSearch, setClientSearch] = useState('');
  const [selectedClient, setSelectedClient] = useState<any | null>(null);
  const [clientDropOpen, setClientDropOpen] = useState(false);
  const [lines, setLines] = useState<LineItem[]>([newLine()]);
  const [discount, setDiscount] = useState(0);
  const [freight, setFreight] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('PIX');
  const [installments, setInstallments] = useState(1);
  const [status, setStatus] = useState<'completed' | 'pending'>('completed');
  const [saving, setSaving] = useState(false);

  // --- Filtros de busca ---
  const filteredClients = useMemo(() =>
    clients.filter((c: any) => c.full_name?.toLowerCase().includes(clientSearch.toLowerCase())).slice(0, 8),
    [clients, clientSearch]
  );

  const filteredProducts = (search: string) =>
    products.filter((p: any) =>
      (p.nome || '').toLowerCase().includes(search.toLowerCase()) && !p.is_insumo
    ).slice(0, 8);

  // --- Manipuladores de linha ---
  const setLineField = (id: string, field: keyof LineItem, value: any) => {
    setLines(prev => prev.map(l => l.id === id ? { ...l, [field]: value } : l));
  };

  const selectProduct = (lineId: string, product: any) => {
    setLines(prev => prev.map(l =>
      l.id === lineId
        ? { ...l, product, unitPrice: product.price ?? 0, productSearch: product.nome, qty: 1 }
        : l
    ));
  };

  const removeLine = (id: string) => {
    if (lines.length <= 1) return;
    setLines(prev => prev.filter(l => l.id !== id));
  };

  // --- Cálculos ---
  const subtotal = lines.reduce((acc, l) => acc + (l.qty * l.unitPrice), 0);
  const total = Math.max(0, subtotal - discount + freight);

  // --- Submissão ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validações básicas
    if (lines.some(l => !l.product)) {
      alert('Selecione um produto em todas as linhas.');
      return;
    }
    if (lines.some(l => l.qty <= 0)) {
      alert('Quantidade deve ser maior que zero.');
      return;
    }

    setSaving(true);
    try {
      const payMethod = installments > 1
        ? `${paymentMethod} ${installments}x`
        : paymentMethod;

      const saleData = {
        client_id: selectedClient?.id || null,
        total_amount: total,
        total_cost: lines.reduce((acc, l) => acc + (l.qty * (l.product?.cost || 0)), 0),
        status,
        payment_method: payMethod,
      };

      const itemsData = lines.map(l => ({
        product_id: l.product.id,
        quantity: l.qty,
        unit_price: l.unitPrice,
        unit_cost: l.product?.cost || 0,
      }));

      // Chama o RPC existente (baixa estoque automaticamente)
      const result = await saleService.processSale(saleData, itemsData);

      // Se a data for retroativa, atualiza o created_at
      if (saleDate !== today && result?.id) {
        await supabase
          .from('sales')
          .update({ created_at: `${saleDate}T12:00:00` })
          .eq('id', result.id);
      } else if (saleDate !== today) {
        // Fallback: atualiza a última venda inserida (para RPCs que não retornam ID)
        const { data: lastSale } = await supabase
          .from('sales')
          .select('id')
          .eq('client_id', selectedClient?.id || null)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
        if (lastSale?.id) {
          await supabase.from('sales').update({ created_at: `${saleDate}T12:00:00` }).eq('id', lastSale.id);
        }
      }

      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      onClose();
    } catch (err: any) {
      alert(`Erro ao registrar venda: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-secundaria/80 backdrop-blur-sm z-[300] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden max-h-[95vh] flex flex-col">

        {/* Header */}
        <div className="bg-secundaria px-8 py-5 text-white flex justify-between items-center flex-shrink-0">
          <div>
            <h2 className="font-serif text-xl font-bold">Nova Venda Manual</h2>
            <p className="text-[9px] text-primaria font-bold uppercase tracking-widest mt-0.5">Central de Vendas — Registro Direto</p>
          </div>
          <button onClick={onClose} className="text-white/50 hover:text-white font-bold text-lg transition-colors">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 divide-y divide-gray-50">

          {/* SEÇÃO 1: DADOS GERAIS */}
          <div className="px-8 py-5 grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <p className="text-[9px] font-bold uppercase tracking-[4px] text-primaria mb-3">1. Dados da Venda</p>
            </div>

            {/* Data da venda */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Data da Venda</label>
              <input
                type="date"
                value={saleDate}
                max={today}
                onChange={e => setSaleDate(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-secundaria outline-none focus:border-primaria transition-colors"
              />
            </div>

            {/* Status */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Status</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as 'completed' | 'pending')}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-secundaria outline-none focus:border-primaria bg-white transition-colors"
              >
                <option value="completed">Finalizada</option>
                <option value="pending">Pendente</option>
              </select>
            </div>

            {/* Busca de cliente */}
            <div className="col-span-2 space-y-1 relative">
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                Cliente {selectedClient && <span className="text-emerald-500">✓ {selectedClient.full_name}</span>}
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Buscar por nome... (deixe em branco para consumidor final)"
                  value={selectedClient ? selectedClient.full_name : clientSearch}
                  onFocus={() => { setClientDropOpen(true); if (selectedClient) { setSelectedClient(null); setClientSearch(''); } }}
                  onChange={e => { setClientSearch(e.target.value); setClientDropOpen(true); setSelectedClient(null); }}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-secundaria outline-none focus:border-primaria transition-colors pr-10"
                />
                {selectedClient && (
                  <button type="button" onClick={() => { setSelectedClient(null); setClientSearch(''); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-red-400 text-sm">✕</button>
                )}
              </div>
              {clientDropOpen && !selectedClient && clientSearch.length > 0 && (
                <div className="absolute top-full left-0 right-0 z-50 bg-white border border-gray-100 rounded-xl shadow-xl mt-1 max-h-48 overflow-y-auto">
                  {filteredClients.length === 0
                    ? <p className="px-4 py-3 text-xs text-gray-400">Nenhum cliente encontrado</p>
                    : filteredClients.map((c: any) => (
                      <button key={c.id} type="button"
                        onClick={() => { setSelectedClient(c); setClientDropOpen(false); }}
                        className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-3 transition-colors"
                      >
                        <div className="w-7 h-7 rounded-full bg-primaria/10 text-primaria text-xs font-bold flex items-center justify-center">{c.full_name?.charAt(0)}</div>
                        <div>
                          <p className="text-sm font-bold text-secundaria">{c.full_name}</p>
                          <p className="text-[9px] text-gray-400">{c.phone || c.email || ''}</p>
                        </div>
                        {c.is_vip && <span className="ml-auto text-[8px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-bold uppercase">VIP</span>}
                      </button>
                    ))
                  }
                </div>
              )}
            </div>
          </div>

          {/* SEÇÃO 2: PRODUTOS */}
          <div className="px-8 py-5">
            <div className="flex justify-between items-center mb-3">
              <p className="text-[9px] font-bold uppercase tracking-[4px] text-primaria">2. Produtos</p>
              <button
                type="button"
                onClick={() => setLines(prev => [...prev, newLine()])}
                className="text-[9px] font-bold text-secundaria uppercase tracking-widest border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-secundaria hover:text-white hover:border-secundaria transition-all"
              >
                + Adicionar Produto
              </button>
            </div>

            <div className="space-y-3">
              {/* Cabeçalho */}
              <div className="grid grid-cols-12 gap-2 px-1">
                <p className="col-span-5 text-[8px] font-bold uppercase tracking-widest text-gray-400">Produto</p>
                <p className="col-span-2 text-[8px] font-bold uppercase tracking-widest text-gray-400 text-center">Qtd</p>
                <p className="col-span-3 text-[8px] font-bold uppercase tracking-widest text-gray-400 text-center">Preço Unit.</p>
                <p className="col-span-1 text-[8px] font-bold uppercase tracking-widest text-gray-400 text-center">Total</p>
                <p className="col-span-1"></p>
              </div>

              {lines.map((line) => (
                <div key={line.id} className="grid grid-cols-12 gap-2 items-center bg-gray-50 rounded-xl p-2 border border-gray-100">
                  {/* Busca de produto */}
                  <div className="col-span-5 relative">
                    <input
                      type="text"
                      placeholder="Buscar produto..."
                      value={line.productSearch}
                      onChange={e => setLineField(line.id, 'productSearch', e.target.value)}
                      onFocus={() => setLineField(line.id, 'product', null)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs text-secundaria outline-none focus:border-primaria bg-white transition-colors"
                    />
                    {line.productSearch.length > 0 && !line.product && (
                      <div className="absolute top-full left-0 right-0 z-40 bg-white border border-gray-100 rounded-xl shadow-xl mt-1 max-h-40 overflow-y-auto">
                        {filteredProducts(line.productSearch).length === 0
                          ? <p className="px-3 py-2 text-xs text-gray-400">Sem resultados</p>
                          : filteredProducts(line.productSearch).map((p: any) => (
                            <button key={p.id} type="button"
                              onClick={() => selectProduct(line.id, p)}
                              className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center gap-2 transition-colors"
                            >
                              {p.image_url
                                ? <img src={p.image_url} className="w-6 h-6 rounded object-cover" alt={p.nome} />
                                : <div className="w-6 h-6 rounded bg-gray-100 flex items-center justify-center text-[10px]">📦</div>
                              }
                              <div>
                                <p className="text-xs font-bold text-secundaria leading-tight">{p.nome}</p>
                                <p className="text-[8px] text-gray-400">{formatCurrency(p.price)} · Estoque: {p.stock}</p>
                              </div>
                            </button>
                          ))
                        }
                      </div>
                    )}
                  </div>

                  {/* Quantidade */}
                  <div className="col-span-2">
                    <input
                      type="number"
                      min={1}
                      value={line.qty}
                      onChange={e => setLineField(line.id, 'qty', Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full border border-gray-200 rounded-lg px-2 py-2 text-xs text-center text-secundaria font-bold outline-none focus:border-primaria bg-white"
                    />
                  </div>

                  {/* Preço unitário */}
                  <div className="col-span-3">
                    <input
                      type="number"
                      min={0}
                      step={0.01}
                      value={line.unitPrice}
                      onChange={e => setLineField(line.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                      className="w-full border border-gray-200 rounded-lg px-2 py-2 text-xs text-center text-secundaria font-bold outline-none focus:border-primaria bg-white"
                    />
                  </div>

                  {/* Total da linha */}
                  <div className="col-span-1 text-center">
                    <p className="text-xs font-bold text-primaria">{formatCurrency(line.qty * line.unitPrice)}</p>
                  </div>

                  {/* Remover */}
                  <div className="col-span-1 flex justify-center">
                    <button
                      type="button"
                      onClick={() => removeLine(line.id)}
                      disabled={lines.length <= 1}
                      className="text-red-300 hover:text-red-500 disabled:opacity-20 transition-colors text-sm"
                    >✕</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SEÇÃO 3: TOTAIS E PAGAMENTO */}
          <div className="px-8 py-5 grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <p className="text-[9px] font-bold uppercase tracking-[4px] text-primaria mb-3">3. Totais & Pagamento</p>
            </div>

            {/* Desconto */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Desconto (R$) — Opcional</label>
              <input
                type="number" min={0} step={0.01} value={discount || ''}
                onChange={e => setDiscount(parseFloat(e.target.value) || 0)}
                placeholder="0,00"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-secundaria outline-none focus:border-primaria transition-colors"
              />
            </div>

            {/* Frete */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Frete (R$) — Opcional</label>
              <input
                type="number" min={0} step={0.01} value={freight || ''}
                onChange={e => setFreight(parseFloat(e.target.value) || 0)}
                placeholder="0,00"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-secundaria outline-none focus:border-primaria transition-colors"
              />
            </div>

            {/* Forma de pagamento */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Forma de Pagamento</label>
              <select
                value={paymentMethod}
                onChange={e => { setPaymentMethod(e.target.value); if (e.target.value !== 'Cartão de Crédito') setInstallments(1); }}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-secundaria outline-none focus:border-primaria bg-white transition-colors"
              >
                {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>

            {/* Parcelas */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                Parcelas {paymentMethod !== 'Cartão de Crédito' && <span className="text-gray-300">(somente crédito)</span>}
              </label>
              <select
                value={installments}
                disabled={paymentMethod !== 'Cartão de Crédito'}
                onChange={e => setInstallments(parseInt(e.target.value))}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-secundaria outline-none focus:border-primaria bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map(n => (
                  <option key={n} value={n}>{n}x {n > 1 ? `de ${formatCurrency(total / n)}` : '(à vista)'}</option>
                ))}
              </select>
            </div>

            {/* Resumo */}
            <div className="col-span-2 bg-gray-50 border border-gray-100 rounded-2xl p-4 flex justify-between items-center">
              <div className="flex gap-8 text-sm">
                <div>
                  <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mb-0.5">Subtotal</p>
                  <p className="font-bold text-secundaria">{formatCurrency(subtotal)}</p>
                </div>
                {discount > 0 && (
                  <div>
                    <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mb-0.5">Desconto</p>
                    <p className="font-bold text-red-500">-{formatCurrency(discount)}</p>
                  </div>
                )}
                {freight > 0 && (
                  <div>
                    <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mb-0.5">Frete</p>
                    <p className="font-bold text-blue-500">+{formatCurrency(freight)}</p>
                  </div>
                )}
              </div>
              <div className="text-right">
                <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mb-0.5">Total Final</p>
                <p className="font-serif font-bold text-2xl text-emerald-600">{formatCurrency(total)}</p>
                {installments > 1 && (
                  <p className="text-[8px] text-gray-400 font-bold uppercase">{installments}x de {formatCurrency(total / installments)}</p>
                )}
              </div>
            </div>
          </div>
        </form>

        {/* Footer fixo */}
        <div className="px-8 py-5 border-t border-gray-100 flex gap-3 bg-white flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 border border-gray-200 text-gray-400 font-bold py-3 rounded-xl text-[10px] uppercase tracking-widest hover:bg-gray-50 transition-all"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit as any}
            disabled={saving || lines.some(l => !l.product) || total <= 0}
            className="flex-2 bg-secundaria text-white font-bold px-10 py-3 rounded-xl text-[10px] uppercase tracking-widest hover:bg-black transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {saving ? 'Registrando...' : `Confirmar Venda · ${formatCurrency(total)}`}
          </button>
        </div>
      </div>
    </div>
  );
}
