import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState(() => {
    try {
      const saved = localStorage.getItem('camelia_cart');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Persistir no localStorage sempre que o carrinho mudar
  useEffect(() => {
    localStorage.setItem('camelia_cart', JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = (product, qty = 1) => {
    setCartItems(prev => {
      const existing = prev.find(i => i.id === product.id);
      if (existing) {
        const newQty = existing.quantity + qty;
        if (newQty > product.stock) return prev; // Não ultrapassa estoque
        return prev.map(i => i.id === product.id ? { ...i, quantity: newQty } : i);
      }
      return [...prev, { ...product, quantity: qty }];
    });
    setIsCartOpen(true); // Abre o drawer ao adicionar
  };

  const removeFromCart = (productId) => {
    setCartItems(prev => prev.filter(i => i.id !== productId));
  };

  const updateQty = (productId, qty) => {
    if (qty <= 0) { removeFromCart(productId); return; }
    setCartItems(prev => prev.map(i => i.id === productId ? { ...i, quantity: qty } : i));
  };

  const clearCart = () => setCartItems([]);

  const totalItems = cartItems.reduce((acc, i) => acc + i.quantity, 0);
  const totalPrice = cartItems.reduce((acc, i) => acc + (Number(i.price) * i.quantity), 0);

  return (
    <CartContext.Provider value={{
      cartItems, addToCart, removeFromCart, updateQty, clearCart,
      totalItems, totalPrice, isCartOpen, setIsCartOpen
    }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
