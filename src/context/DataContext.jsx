/**
 * DataContext — Provedor Global de Dados (Admin)
 * Usa o Service Layer centralizado. Sem SWR, sem colcha de retalhos.
 */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  productService,
  saleService,
  clientService,
  supplierService,
  transactionService,
} from '../services/supabaseService';

const DataContext = createContext(null);

export function DataProvider({ children }) {
  const [products, setProducts] = useState([]);
  const [sales, setSales] = useState([]);
  const [clients, setClients] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isError, setIsError] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // ── Monitor de conexão ──────────────────────────────────────────────────────
  useEffect(() => {
    const on = () => setIsOnline(true);
    const off = () => setIsOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);

  // ── Carga inicial com Circuit Breaker (Timeout + AbortController) ───────────
  const loadAll = useCallback(async () => {
    const controller = new AbortController();
    const signal = controller.signal;

    setLoading(true);
    setIsError(false);
    setError(null);

    // Promessa com timeout de 5 segundos
    const timeout = new Promise((_, reject) => 
      setTimeout(() => {
        controller.abort(); // CANCELA as requisições no Supabase
        reject(new Error('Tempo de resposta do servidor excedido (Motor Pro v2 Timeout)'));
      }, 5000)
    );

    try {
      const fetchPromise = Promise.all([
        productService.getAll(signal),
        saleService.getAll(signal),
        clientService.getAll(signal),
        supplierService.getAll(signal),
        transactionService.getAll(signal),
      ]);

      // Vence quem chegar primeiro: os dados ou o erro/abort de 5s
      const [p, s, c, sup, t] = await Promise.race([fetchPromise, timeout]);
      
      setProducts(p);
      setSales(s);
      setClients(c);
      setSuppliers(sup);
      setTransactions(t);
    } catch (err) {
      if (err.name === 'AbortError') {
        console.warn('[DataContext] Requisições canceladas por timeout.');
      }
      console.error('[DataContext] Erro Crítico:', err.message);
      setIsError(true);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  // ── Realtime: State Push (Sem novas requisições HTTP) ────────────────────
  useEffect(() => {
    const unsubscribe = productService.subscribe((payload) => {
      const { eventType, new: newItem, old: oldItem } = payload;
      
      if (eventType === 'INSERT') {
        setProducts(prev => [newItem, ...prev]);
      } 
      else if (eventType === 'UPDATE') {
        setProducts(prev => prev.map(p => p.id === newItem.id ? newItem : p));
      } 
      else if (eventType === 'DELETE') {
        setProducts(prev => prev.filter(p => p.id !== oldItem.id));
      }
    });
    return unsubscribe;
  }, []);

  // ── Actions ─────────────────────────────────────────────────────────────────
  const actions = {
    // Produtos
    async upsertProduct(payload, id = null) {
      const saved = await productService.save(payload, id);
      const updated = await productService.getAll();
      setProducts(updated);
      return saved;
    },
    async deleteProduct(id) {
      await productService.remove(id);
      setProducts(prev => prev.filter(p => p.id !== id));
    },

    // Vendas
    async createSale(saleData, itemsData) {
      const result = await saleService.processSale(saleData, itemsData);
      const [s, p] = await Promise.all([saleService.getAll(), productService.getAll()]);
      setSales(s);
      setProducts(p);
      return result;
    },

    // Clientes
    async upsertClient(payload, id = null) {
      const saved = await clientService.save(payload, id);
      const updated = await clientService.getAll();
      setClients(updated);
      return saved;
    },

    // Fornecedores
    async upsertSupplier(payload, id = null) {
      const saved = await supplierService.save(payload, id);
      const updated = await supplierService.getAll();
      setSuppliers(updated);
      return saved;
    },
    async deleteSupplier(id) {
      await supplierService.remove(id);
      setSuppliers(prev => prev.filter(s => s.id !== id));
    },

    // Finanças
    async upsertTransaction(payload, id = null) {
      const saved = await transactionService.save(payload, id);
      const updated = await transactionService.getAll();
      setTransactions(updated);
      return saved;
    },
    async deleteTransaction(id) {
      await transactionService.remove(id);
      setTransactions(prev => prev.filter(t => t.id !== id));
    },

    // Refresh manual
    refresh: loadAll,
  };

  return (
    <DataContext.Provider value={{
      isOnline, loading, isError, error,
      products, sales, clients, suppliers, transactions,
      actions,
    }}>
      {children}
    </DataContext.Provider>
  );
}

export const useData = () => useContext(DataContext);
