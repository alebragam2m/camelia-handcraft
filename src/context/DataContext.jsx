import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { db } from '../services/db';

const DataContext = createContext();

export function DataProvider({ children }) {
  const [products, setProducts] = useState([]);
  const [sales, setSales] = useState([]);
  const [clients, setClients] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastSync, setLastSync] = useState(null);
  const [isOnline, setIsOnline] = useState(true);

  // --- SINCRONIZAÇÃO INICIAL (Inteligente) ---
  const syncAll = async () => {
    // Evita múltiplas instâncias de sync rodando juntas
    if (loading === true && lastSync !== null) return;
    
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.warn("Sync abortado: Nenhuma sessão ativa detectada.");
        setLoading(false);
        return;
      }

      // Prioridade 1: Estoque (Produtos)
      const p = await db.getProducts();
      setProducts(p);

      // Prioridade 2: Dashboard e Outros
      const [s, c, t, sup] = await Promise.all([
        db.getSales(),
        db.getClients(),
        db.getTransactions(),
        db.getSuppliers()
      ]);
      setSales(s);
      setClients(c);
      setTransactions(t);
      setSuppliers(sup);
      
      setLastSync(new Date());
    } catch (err) {
      console.error("Falha na Sincronização:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Listener de Sessão: Dispara o Sync assim que o Supabase estiver pronto
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session && (event === 'INITIAL_SESSION' || event === 'SIGNED_IN')) {
        syncAll();
      } else if (event === 'SIGNED_OUT') {
        // Limpa estado ao deslogar
        setProducts([]); setSales([]); setClients([]); setTransactions([]); setSuppliers([]);
        setLoading(false);
      }
    });

    // Canal para Sincronização em Tempo Real (Broadcast e DB Changes)
    const channel = supabase
      .channel('camelia-realtime-hub')
      .on('postgres_changes', { event: '*', table: 'products' }, (payload) => {
        if (payload.eventType === 'INSERT') setProducts(prev => [payload.new, ...prev]);
        if (payload.eventType === 'UPDATE') setProducts(prev => prev.map(p => p.id === payload.new.id ? payload.new : p));
        if (payload.eventType === 'DELETE') setProducts(prev => prev.filter(p => p.id !== payload.old.id));
      })
      .on('postgres_changes', { event: '*', table: 'sales' }, (payload) => {
        if (payload.eventType === 'INSERT') {
           // Notificação de venda nova
           setSales(prev => [payload.new, ...prev]);
        }
        if (payload.eventType === 'UPDATE' || payload.eventType === 'DELETE') {
           // Na venda, como tem relações profundas, um refetch leve pode ser necessário
           db.getSales().then(setSales);
        }
      })
      .on('postgres_changes', { event: '*', table: 'financial_transactions' }, (payload) => {
        if (payload.eventType === 'INSERT') setTransactions(prev => [payload.new, ...prev]);
        if (payload.eventType === 'UPDATE') setTransactions(prev => prev.map(t => t.id === payload.new.id ? payload.new : t));
        if (payload.eventType === 'DELETE') setTransactions(prev => prev.filter(t => t.id !== payload.old.id));
      })
      .on('postgres_changes', { event: '*', table: 'clients' }, (payload) => {
        if (payload.eventType === 'INSERT') setClients(prev => [...prev, payload.new].sort((a,b) => a.full_name?.localeCompare(b.full_name)));
        if (payload.eventType === 'UPDATE') setClients(prev => prev.map(c => c.id === payload.new.id ? payload.new : c));
      })
      .on('postgres_changes', { event: '*', table: 'suppliers' }, (payload) => {
        if (payload.eventType === 'INSERT') setSuppliers(prev => [...prev, payload.new].sort((a,b) => a.name?.localeCompare(b.name)));
        if (payload.eventType === 'UPDATE') setSuppliers(prev => prev.map(s => s.id === payload.new.id ? payload.new : s));
        if (payload.eventType === 'DELETE') setSuppliers(prev => prev.filter(s => s.id !== payload.old.id));
      })
      .subscribe((status) => {
        setIsOnline(status === 'SUBSCRIBED');
      });

    // Monitorar conexão física
    const updateOnlineStatus = () => setIsOnline(navigator.onLine);
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    return () => {
      subscription.unsubscribe();
      supabase.removeChannel(channel);
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);

  // --- ACTIONS EXPOSTAS (CENTRALIZADAS) ---
  const actions = {
    refresh: () => syncAll(),
    addProduct: async (p) => {
      const newP = await db.upsertProduct(p);
      // O Realtime cuidará do setProducts se funcionar, mas injetamos por "interface otimista"
      setProducts(prev => [newP, ...prev]);
      return newP;
    },
    updateProduct: async (p, id) => {
      const updated = await db.upsertProduct(p, id);
      setProducts(prev => prev.map(item => item.id === id ? updated : item));
      return updated;
    },
    deleteProduct: async (id) => {
      await db.deleteProduct(id);
      setProducts(prev => prev.filter(p => p.id !== id));
    },
    addClient: async (c) => {
      const newC = await db.upsertClient(c);
      setClients(prev => [...prev, newC].sort((a,b) => a.full_name?.localeCompare(b.full_name)));
      return newC;
    },
    updateClient: async (c, id) => {
      const updated = await db.upsertClient(c, id);
      setClients(prev => prev.map(item => item.id === id ? updated : item));
      return updated;
    },
    registerSale: async (sale, items) => {
      const res = await db.createSale(sale, items);
      // Refetch de vendas e produtos (estoque mudou)
      const [newS, newP] = await Promise.all([db.getSales(), db.getProducts()]);
      setSales(newS);
      setProducts(newP);
      return res;
    },
    addTransaction: async (t) => {
      const newT = await db.upsertTransaction(t);
      setTransactions(prev => [newT, ...prev].sort((a,b) => new Date(b.due_date) - new Date(a.due_date)));
      return newT;
    },
    updateTransaction: async (t, id) => {
      const updated = await db.upsertTransaction(t, id);
      setTransactions(prev => prev.map(item => item.id === id ? updated : item));
      return updated;
    },
    deleteTransaction: async (id) => {
      await db.deleteTransaction(id);
      setTransactions(prev => prev.filter(t => t.id !== id));
    },
    addSupplier: async (s) => {
      const newS = await db.upsertSupplier(s);
      setSuppliers(prev => [...prev, newS].sort((a,b) => a.name?.localeCompare(b.name)));
      return newS;
    },
    updateSupplier: async (s, id) => {
      const updated = await db.upsertSupplier(s, id);
      setSuppliers(prev => prev.map(item => item.id === id ? updated : item));
      return updated;
    },
    deleteSupplier: async (id) => {
      await db.deleteSupplier(id);
      setSuppliers(prev => prev.filter(s => s.id !== id));
    },
    getStockLogs: async (id) => {
      return await db.getStockLogs(id);
    },
    logInventoryChange: async (log) => {
      await db.logInventoryChange(log);
      // Nao precisamos de set local pois logs sao fetch sob demanda no modal
      // e o realtime de produtos cuidará do estoque total
    }
  };

  return (
    <DataContext.Provider value={{
      products, sales, clients, transactions, suppliers,
      loading, lastSync, isOnline, actions
    }}>
      {children}
    </DataContext.Provider>
  );
}

export const useData = () => useContext(DataContext);
