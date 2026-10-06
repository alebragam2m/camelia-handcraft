export const CART_KEY = 'camelia_cart';
const empty = () => ({ items: [], pending: {}, attempt: null, completed: {} });
const validItem = item => item && item.id != null && Number.isSafeInteger(item.quantity) && item.quantity > 0;

// Toda escrita parte do valor mais recente, inclusive mudanças feitas em outra aba.
// Um único documento persiste a baixa e o consumo do recibo de forma idempotente.
export function createCartStore({ storage, lock = task => task(), newId = () => crypto.randomUUID() }) {
  let raw;
  let snapshot = empty();
  const listeners = new Set();
  function getSnapshot() {
    let next;
    try { next = storage.getItem(CART_KEY); } catch { return snapshot; }
    if (next === raw) return snapshot;
    raw = next;
    try {
      const parsed = JSON.parse(next || 'null');
      const items = Array.isArray(parsed) ? parsed : parsed?.items || [];
      snapshot = { items: items.filter(validItem).map(item => ({ ...item, cartLineId: item.cartLineId || 'legacy:' + item.id })), attempt: parsed?.attempt || null, completed: parsed?.completed || {}, pending: !Array.isArray(parsed) && parsed?.pending || {} };
    } catch { snapshot = empty(); }
    return snapshot;
  }
  const notify = () => { getSnapshot(); listeners.forEach(listener => listener()); };
  async function update(transform) {
    return lock(() => {
      const current = getSnapshot();
      const next = transform(current);
      if (next === current) return;
      const serialized = JSON.stringify(next);
      storage.setItem(CART_KEY, serialized);
      raw = serialized;
      snapshot = next;
      listeners.forEach(listener => listener());
    });
  }
  return {
    getSnapshot,
    subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); },
    notify,
    changeItems(transform) { return update(state => ({ ...state, items: transform(state.items, newId) })); },
    async beginCheckout(customer, items, actorId) {
      let attempt;
      await update(state => {
        if (state.attempt) {
          if (state.attempt.actorId !== actorId) throw new Error('Entre na conta da tentativa anterior para retomá-la ou cancelá-la.');
          attempt = state.attempt;
          return state;
        }
        attempt = { requestId: newId(), actorId, customer: { ...customer },
          items: items.map(({ id, quantity, price, cartLineId }) => ({ id, quantity, price, cartLineId })) };
        return { ...state, attempt };
      });
      return attempt;
    },
    finishAttempt(requestId) {
      return update(state => state.attempt?.requestId === requestId ? { ...state, attempt: null } : state);
    },
    rememberCheckout(sessionId, items, requestId) {
      if (!sessionId) return Promise.reject(new Error('Sessão de pagamento ausente.'));
      const purchase = items.filter(validItem).map(({ id, quantity, cartLineId }) => ({ id, quantity, cartLineId }));
      return update(state => state.completed?.[sessionId] ? state : ({ ...state, attempt: requestId && state.attempt?.requestId === requestId ? { ...state.attempt, sessionId } : state.attempt, pending: { ...state.pending, [sessionId]: purchase } }));
    },
    completeCheckout(sessionId) {
      return update(state => {
        const purchase = state.pending[sessionId];
        if (!Array.isArray(purchase)) return state;
        const items = state.items.map(item => {
          const paid = purchase.find(line => String(line.id) === String(item.id) && line.cartLineId === item.cartLineId);
          return paid ? { ...item, quantity: Math.max(0, item.quantity - paid.quantity) } : item;
        }).filter(item => item.quantity > 0);
        const pending = { ...state.pending };
        delete pending[sessionId];
        return { ...state, items, pending, completed: { ...state.completed, [sessionId]: true }, attempt: state.attempt?.sessionId === sessionId ? null : state.attempt };
      });
    },
  };
}
