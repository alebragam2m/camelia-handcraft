import React, { createContext, useContext, useState, useEffect } from 'react';
import { useCameliaData, notifyDbUpdate } from '../hooks/useCameliaData';
import { supabase } from '../supabase';

const DataContext = createContext();

export function DataProvider({ children }) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Monitorar conexão básica (Estabilidade de rede)
  useEffect(() => {
    const updateStatus = () => setIsOnline(navigator.onLine);
    window.addEventListener('online', updateStatus);
    window.addEventListener('offline', updateStatus);
    return () => {
      window.removeEventListener('online', updateStatus);
      window.removeEventListener('offline', updateStatus);
    };
  }, []);

  // --- REATIVIDADE COM SWR (MOTOR PRO V2 - VEREDITO TÉCNICO) ---
  const productsResult = useCameliaData('products');
  const salesResult = useCameliaData('sales');
  const clientsResult = useCameliaData('clients');
  const suppliersResult = useCameliaData('suppliers');
  const transactionsResult = useCameliaData('transactions');

  // --- ACTIONS ATÔMICAS (PROTEÇÃO DE BANCO VIA RPC) ---
  const actions = {
    /**
     * Processar Venda (Fidelidade Total em Transação Única)
     */
    async createSale(saleData, itemsData) {
      console.log('[Motor Pro] Disparando Venda Atômica via RPC...');
      try {
        const { data, error } = await supabase.rpc('process_sale', {
          sale_data: saleData,
          items_data: itemsData
        });
        
        if (error) throw error;

        // Sucesso: Notificar Globalmente via WebSocket
        console.log('[Motor Pro] Sucesso: Propagando atualização em tempo real...');
        await notifyDbUpdate('all');
        
        // Revalidar caches locais imediatamente
        actions.refresh();
        return data;
      } catch (err) {
        console.error('[Motor Pro Error] Falha na Venda Atômica:', err);
        throw err;
      }
    },

    /**
     * Ajustar Estoque (Auditado e em Tempo Real)
     */
    async adjustStock(productId, quantity, type, notes = '') {
      console.log('[Motor Pro] Ajustando Estoque via RPC...');
      try {
        const { data, error } = await supabase.rpc('handle_inventory_adjustment', {
          p_product_id: parseInt(productId),
          p_quantity: parseInt(quantity),
          p_type: type,
          p_notes: notes
        });

        if (error) throw error;

        // Sucesso: Notificar site e app
        await notifyDbUpdate('products');
        productsResult.mutate();
        return data;
      } catch (err) {
        console.error('[Motor Pro Error] Falha no Ajuste de Estoque:', err);
        throw err;
      }
    },

    // Gestão Financeira (Reativa)
    async upsertTransaction(payload, id = null) {
      console.log('[Motor Pro] Registrando Transação Financeira...');
      try {
        const { data, error } = await db.upsertTransaction(payload, id);
        if (error) throw error;
        await notifyDbUpdate('transactions');
        transactionsResult.mutate();
        return data;
      } catch (err) {
        console.error('[Motor Pro Error] Falha Financeira:', err);
        throw err;
      }
    },

    async deleteTransaction(id) {
      console.log('[Motor Pro] Excluindo Transação...');
      try {
        const { error } = await db.deleteTransaction(id);
        if (error) throw error;
        await notifyDbUpdate('transactions');
        transactionsResult.mutate();
      } catch (err) {
        console.error('[Motor Pro Error] Falha na Exclusão:', err);
        throw err;
      }
    },

    // Gestão de Fornecedores (Reativa)
    async upsertSupplier(payload, id = null) {
      console.log('[Motor Pro] Homologando Parceiro/Insumo...');
      try {
        const { data, error } = await db.upsertSupplier(payload, id);
        if (error) throw error;
        await notifyDbUpdate('suppliers');
        suppliersResult.mutate();
        return data;
      } catch (err) {
        console.error('[Motor Pro Error] Falha no Cadastro de Fornecedor:', err);
        throw err;
      }
    },

    async deleteSupplier(id) {
      console.log('[Motor Pro] Removendo Fornecedor...');
      try {
        const { error } = await db.deleteSupplier(id);
        if (error) throw error;
        await notifyDbUpdate('suppliers');
        suppliersResult.mutate();
      } catch (err) {
        console.error('[Motor Pro Error] Falha na Remoção:', err);
        throw err;
      }
    },

    // Gestão de Clientes (Reativa)
    async upsertClient(client, id = null) {
      console.log('[Motor Pro] Registrando no CRM...');
      try {
        const { data, error } = await db.upsertClient(client, id);
        if (error) throw error;
        await notifyDbUpdate('clients');
        clientsResult.mutate();
        return data;
      } catch (err) {
        console.error('[Motor Pro Error] Falha no CRM:', err);
        throw err;
      }
    },

    // Gestão de Produtos (Reativa)
    async upsertProduct(product, id = null) {
      console.log('[Motor Pro] Atualizando Catálogo...');
      try {
        const { data, error } = await db.upsertProduct(product, id);
        if (error) throw error;
        await notifyDbUpdate('products');
        productsResult.mutate();
        return data;
      } catch (err) {
        console.error('[Motor Pro Error] Falha no Catálogo:', err);
        throw err;
      }
    },

    /**
     * Sincronização Manual (Forçar Refresh de Fundo)
     */
    refresh: () => {
      console.log('[Motor Pro] Revalidação de Cache SWR Solicitada.');
      productsResult.mutate();
      salesResult.mutate();
      clientsResult.mutate();
      suppliersResult.mutate();
      transactionsResult.mutate();
    }
  };

  const value = {
    isOnline,
    products: productsResult.data || [],
    sales: salesResult.data || [],
    clients: clientsResult.data || [],
    suppliers: suppliersResult.data || [],
    transactions: transactionsResult.data || [],
    loading: productsResult.isLoading || salesResult.isLoading,
    isError: productsResult.isError || salesResult.isError,
    actions
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
}

export const useData = () => useContext(DataContext);
