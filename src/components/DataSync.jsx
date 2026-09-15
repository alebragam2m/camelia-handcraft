import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { startDataSync } from '../lib/dataSync';

export default function DataSync({ admin = false }) {
  const queryClient = useQueryClient();
  const [connected, setConnected] = useState(false);
  useEffect(() => startDataSync({ client: supabase, queryClient, admin, onStatus: setConnected }), [admin, queryClient]);
  if (!admin) return null;
  return <span role="status" className="hidden lg:block text-[9px] font-bold uppercase tracking-widest text-gray-500">{connected ? 'Conectado · atualização automática' : 'Atualização periódica · reconectando'}</span>;
}
