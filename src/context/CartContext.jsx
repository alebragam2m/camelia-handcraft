import { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useCatalog } from '../hooks/useCatalog';
import { reconcileCart } from '../lib/catalog';
const CartContext = createContext();

export function CartProvider({ children }) {
  const [savedItems, setCartItems] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('camelia_cart') || '[]');
      return Array.isArray(saved) ? saved.filter(item => item && item.id != null && Number.isInteger(item.quantity) && item.quantity > 0) : [];
    } catch { return []; }
  });
  const [isCartOpen, setIsCartOpen] = useState(false);
  const { data: products, isError, isPending } = useCatalog();
  const catalogReady = !!products && !isError && !isPending;
  const cartItems = useMemo(() => products ? reconcileCart(savedItems, products) : savedItems, [savedItems, products]);

  useEffect(() => {
    localStorage.setItem('camelia_cart', JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = (product, qty = 1) => {
    const current = products?.find(item => String(item.id) === String(product.id));
    if (!catalogReady || !current || current.is_preorder || !Number.isInteger(qty) || qty <= 0) return;
    setCartItems(previous => {
      const existing = previous.find(item => String(item.id) === String(current.id));
      const quantity = (existing?.quantity || 0) + qty;
      if (quantity > Number(current.stock)) return previous;
      return existing
        ? previous.map(item => String(item.id) === String(current.id) ? { ...current, quantity } : item)
        : [...previous, { ...current, quantity }];
    });
    setIsCartOpen(true);
  };
  const removeFromCart = id => setCartItems(items => items.filter(item => String(item.id) !== String(id)));
  const updateQty = (id, qty) => {
    if (!Number.isInteger(qty)) return;
    if (qty <= 0) { removeFromCart(id); return; }
    const product = products?.find(item => String(item.id) === String(id));
    if (!catalogReady || !product || qty > Number(product.stock)) return;
    setCartItems(items => items.map(item => String(item.id) === String(id) ? { ...item, quantity: qty } : item));
  };
  const clearCart = () => setCartItems([]);
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cartItems.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);
  return <CartContext.Provider value={{ cartItems, addToCart, removeFromCart, updateQty, clearCart, totalItems, totalPrice, isCartOpen, setIsCartOpen, catalogReady }}>{children}</CartContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export const useCart = () => useContext(CartContext);
