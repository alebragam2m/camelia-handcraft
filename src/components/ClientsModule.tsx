import { useQuery } from '@tanstack/react-query';
import { clientService } from '../services/clientService';
import { formatCurrency } from '../utils/formatCurrency';

export default function ClientsModule() {
  const { data: clients = [], isLoading } = useQuery({
    queryKey: ['clients'],
    queryFn: () => clientService.getAll(),
  });

  if (isLoading) return <div className="p-12 text-center animate-pulse text-gray-400 font-bold uppercase tracking-widest text-[10px]">Carregando CRM...</div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
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
                clients.map((client: any) => (
                  <tr key={client.id} className="hover:bg-gray-50/50 transition-colors group">
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
                      <p className="text-[9px] text-gray-400 uppercase font-bold tracking-tight">{client.whatsapp || 'Sem WhatsApp'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-secundaria">{formatCurrency(client.total_spent || 0)}</p>
                      <p className="text-[9px] text-gray-400 uppercase font-bold">LTV (Lifetime Value)</p>
                    </td>
                    <td className="px-6 py-4">
                      <button className="bg-gray-100 px-4 py-2 rounded-lg text-[9px] font-bold text-gray-500 uppercase tracking-widest group-hover:bg-secundaria group-hover:text-white transition-all">Detalhes do VIP ❯</button>
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
