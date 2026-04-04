import { useQuery } from '@tanstack/react-query';
import { saleService } from '../services/saleService';
import { formatCurrency } from '../utils/formatCurrency';

export default function SalesModule() {
  const { data: sales = [], isLoading } = useQuery({
    queryKey: ['sales'],
    queryFn: () => saleService.getAll(),
  });

  if (isLoading) return <div className="p-12 text-center animate-pulse text-gray-400 font-bold uppercase tracking-widest text-[10px]">Carregando Vendas...</div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Data</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Cliente</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {sales.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-400 italic text-sm">Nenhuma venda registrada ainda.</td>
                </tr>
              ) : (
                sales.map((sale: any) => (
                  <tr key={sale.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-xs font-bold text-secundaria">{new Date(sale.created_at).toLocaleDateString('pt-BR')}</p>
                      <p className="text-[9px] text-gray-400 uppercase font-medium">{new Date(sale.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">👤</span>
                        <div>
                          <p className="text-xs font-bold text-secundaria">{sale.clients?.full_name || 'Consumidor Final'}</p>
                          {sale.clients?.is_vip && <span className="text-[8px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-bold uppercase tracking-tighter">VIP Camélia</span>}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-primaria">{formatCurrency(sale.total_amount)}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest ${
                        sale.status === 'completed' ? 'bg-emerald-50 text-emerald-600' :
                        sale.status === 'pending' ? 'bg-amber-50 text-amber-600' : 'bg-gray-50 text-gray-400'
                      }`}>
                        {sale.status === 'completed' ? 'Finalizado' : 'Pendente'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest hover:text-indigo-600 transition-colors">Ver Recibo ❯</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
