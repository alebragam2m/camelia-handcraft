export const ADMIN_SYNC_TABLES = {
  products: ['products'], clients: ['clients'], sales: ['sales'],
  sale_items: ['sales'], inventory_logs: ['stock-logs', 'products'],
  suppliers: ['suppliers'], financial_transactions: ['transactions'],
  admin_users: ['admin-users', 'admin-access'],
};

export function startDataSync({ client, queryClient, admin = false, onStatus = () => {}, batchMs = 150, pollMs = 30000, isVisible = () => document.visibilityState === 'visible' }) {
  const tables = admin ? ADMIN_SYNC_TABLES : { products: ['catalog'] };
  const allKeys = [...new Set(Object.values(tables).flat())];
  const pendingKeys = new Set();
  let timer;
  let disposed = false;
  const invalidate = keys => {
    if (disposed) return;
    keys.forEach(key => pendingKeys.add(key));
    if (timer) return;
    timer = setTimeout(() => {
      timer = undefined;
      pendingKeys.forEach(key => { void queryClient.invalidateQueries({ queryKey: [key] }); });
      pendingKeys.clear();
    }, batchMs);
  };
  let channel = client.channel(admin ? 'admin-data-sync' : 'catalog-data-sync');
  Object.entries(tables).forEach(([table, keys]) => {
    channel = channel.on('postgres_changes', { event: '*', schema: 'public', table }, () => invalidate(keys));
  });
  channel.subscribe(status => {
    if (disposed) return;
    onStatus(status === 'SUBSCRIBED');
    if (status === 'SUBSCRIBED') invalidate(allKeys);
  });
  // Polling repairs missed events (including DELETEs) and missing publication entries.
  const interval = admin ? setInterval(() => { if (isVisible()) invalidate(allKeys); }, pollMs) : undefined;
  return () => {
    disposed = true;
    clearTimeout(timer);
    clearInterval(interval);
    void client.removeChannel(channel);
  };
}

export function clearPrivateQueries(queryClient) {
  const filters = { predicate: query => query.queryKey[0] !== 'catalog' };
  void queryClient.cancelQueries(filters);
  queryClient.removeQueries(filters);
}
