import { useEffect, useRef } from 'react';
import { formatCurrency } from '../utils/formatCurrency';
import { saleStatusLabel } from '../lib/saleStatus';

interface ReceiptSale {
  id: string; client_name?: string; clients?: { full_name?: string };
  status: string; total_amount: number; shipping_cost?: number; discount?: number;
  shipping_address?: Record<string, string>;
  sale_items?: { id: string; quantity: number; unit_price: number; products?: { nome?: string } }[];
}

export default function SaleReceipt({ sale, onClose }: { sale: ReceiptSale; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => { dialog.current?.showModal(); }, []);
  const address = sale.shipping_address;
  return <dialog ref={dialog} onClose={onClose} aria-labelledby="receipt-title" className="w-full max-w-xl rounded-2xl p-6 backdrop:bg-black/60">
    <div className="flex justify-between gap-4 mb-6">
      <h2 id="receipt-title" className="font-serif text-2xl">Resumo do pedido</h2>
      <button autoFocus onClick={() => dialog.current?.close()} className="border rounded-lg px-3">Fechar</button>
    </div>
    <p className="break-all">Pedido #{sale.id}</p>
    <p>{sale.client_name || sale.clients?.full_name || 'Consumidor final'}</p>
    <p className="mb-4">Status: {saleStatusLabel(sale.status)}</p>
    <ul className="space-y-2 mb-4">{sale.sale_items?.map(item => <li key={item.id}>{item.quantity} × {item.products?.nome || 'Produto'} — {formatCurrency(item.quantity * item.unit_price)}</li>)}</ul>
    <p>Frete: {formatCurrency(sale.shipping_cost)}</p>
    <p>Desconto: {formatCurrency(sale.discount)}</p>
    <p className="font-bold mb-4">Total do pedido: {formatCurrency(sale.total_amount)}</p>
    {address && <div className="border-t pt-4 break-words">
      <h3 className="font-bold mb-2">Contato e entrega informados no pedido</h3>
      <p>{address.nome}</p><p>{address.email}</p><p>{address.telefone}</p>
      <p>{[address.endereco, address.numero, address.bairro, address.cidade, address.estado, address.cep].filter(Boolean).join(', ')}</p>
    </div>}
    <p className="text-sm text-gray-500 mt-6">Resumo comercial. Não substitui documento fiscal nem comprovante bancário.</p>
  </dialog>;
}
