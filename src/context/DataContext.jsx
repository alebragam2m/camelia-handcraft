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
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // ── Monitor de conexão ──────────────────────────────────────────────────────
  useEffect(() => {
    const on = () => setIsOnline(true);
    const off = () => setIsOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);

  // ── Carga inicial ───────────────────────────────────────────────────────────
  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [p, s, c, sup, t] = await Promise.all([
        productService.getAll(),
        saleService.getAll(),
        clientService.getAll(),
        supplierService.getAll(),
        transactionService.getAll(),
      ]);
      setProducts(p);
      setSales(s);
      setClients(c);
      setSuppliers(sup);
      setTransactions(t);
    } catch (err) {
      console.error('[DataContext] Erro ao carregar dados:', err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  // ── Realtime: produtos ──────────────────────────────────────────────────────
  useEffect(() => {
    const unsubscribe = productService.subscribe(async () => {
      const updated = await productService.getAll();
      setProducts(updated);
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
      isOnline, loading,
      products, sales, clients, suppliers, transactions,
      actions,
    }}>
      {children}
    </DataContext.Provider>
  );
}

export const useData = () => useContext(DataContext);
