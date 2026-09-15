import { clearPrivateQueries } from '../lib/dataSync';
import { useEffect, useState, Fragment } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { SessionContext } from '../lib/session-context';

export default function SessionProvider({ children }) {
  const queryClient = useQueryClient();
  const [state, setState] = useState({ session: null, loading: true });
  useEffect(() => {
    let disposed = false;
    let authEventReceived = false;
    let identity;
    const update = session => {
      if (disposed) return;
      const nextIdentity = session?.user.id || null;
      if (identity !== nextIdentity) {
        // No Supabase requests inside the auth callback. Cancel old requests before clearing private caches.
        clearPrivateQueries(queryClient);
        identity = nextIdentity;
      }
      setState({ session, loading: false });
    };
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      authEventReceived = true;
      update(session);
    });
    supabase.auth.getSession().then(({ data, error }) => {
      if (!authEventReceived) update(error ? null : data.session);
    }).catch(() => { if (!authEventReceived) update(null); });
    return () => { disposed = true; subscription.unsubscribe(); };
  }, [queryClient]);
  return <SessionContext.Provider value={state}><Fragment key={state.session?.user.id || 'guest'}>{children}</Fragment></SessionContext.Provider>;
}
