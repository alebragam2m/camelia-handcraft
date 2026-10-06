import { createContext, useContext, useState, useEffect, useMemo, useSyncExternalStore } from 'react';
import { useCatalog } from '../hooks/useCatalog';
import { reconcileCart } from '../lib/catalog';
import { CART_KEY, createCartStore } from '../lib/cartStore';
const CartContext = createContext();

function browserStore() {
  let storage;
  try { storage = window.localStorage; }
  catch { storage = { getItem: () => null, setItem: () => { throw new Error('Ative o armazenamento do navegador para salvar o carrinho.'); } }; }
  return createCartStore({ storage, lock: task => navigator.locks ? navigator.locks.request('camelia-cart', task) : task() });
}

export function CartProvider({ children }) {
  const [store] = useState(browserStore);
  const state = useSyncExternalStore(store.subscribe, store.getSnapshot);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const { data: products, isError, isPending } = useCatalog();
  const catalogReady = !!products && !isError && !isPending;
  const cartItems = useMemo(() => products ? reconcileCart(state.items, products) : state.items, [state.items, products]);
  useEffect(() => {
    const receive = event => { if (event.key === CART_KEY || event.key === null) store.notify(); };
    window.addEventListener('storage', receive);
    return () => window.removeEventListener('storage', receive);
  }, [store]);
  const saveItems = transform => store.changeItems(transform).catch(() => alert('Não foi possível salvar o carrinho neste navegador. Verifique o armazenamento disponível.'));
  const addToCart = (product, qty = 1) => {
    const current = products?.find(item => String(item.id) === String(product.id));
    if (!catalogReady || !current || current.is_preorder || !Number.isSafeInteger(qty) || qty <= 0) return;
    void saveItems((previous, newId) => {
      const existing = previous.find(item => String(item.id) === String(current.id));
      const quantity = (existing?.quantity || 0) + qty;
      if (quantity > Number(current.stock)) return previous;
      return existing ? previous.map(item => String(item.id) === String(current.id) ? { ...current, quantity, cartLineId: item.cartLineId } : item)
        : [...previous, { ...current, quantity, cartLineId: newId() }];
    });
    setIsCartOpen(true);
  };
  const removeFromCart = id => saveItems(items => items.filter(item => String(item.id) !== String(id)));
  const updateQty = (id, qty) => {
    if (!Number.isSafeInteger(qty)) return;
    if (qty <= 0) { void removeFromCart(id); return; }
    const product = products?.find(item => String(item.id) === String(id));
    if (!catalogReady || !product) return;
    void saveItems(items => items.map(item => {
      if (String(item.id) !== String(id)) return item;
      if (qty > Number(product.stock) && qty >= item.quantity) return item;
      return { ...item, quantity: qty };
    }));
  };
  const clearCart = () => saveItems(() => []);
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cartItems.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);
  return <CartContext.Provider value={{ cartItems, addToCart, removeFromCart, updateQty, clearCart, totalItems, totalPrice, isCartOpen, setIsCartOpen, catalogReady, checkoutAttempt: state.attempt, beginCheckout: store.beginCheckout, finishAttempt: store.finishAttempt, rememberCheckout: store.rememberCheckout, completeCheckout: store.completeCheckout }}>{children}</CartContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export const useCart = () => useContext(CartContext);
