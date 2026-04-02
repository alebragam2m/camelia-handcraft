import { formatCurrency } from '../utils/formatCurrency';
import React from 'react';
import { useCart } from '../context/CartContext';
import { Link } from 'react-router-dom';

export default function CartDrawer() {
  const { cartItems, isCartOpen, setIsCartOpen, removeFromCart, updateQty, totalPrice, totalItems, clearCart } = useCart();

  if (!isCartOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[300]"
        onClick={() => setIsCartOpen(false)}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-[400] flex flex-col animate-slide-in-right">

        {/* Header */}
        <div className="flex justify-between items-center px-8 py-6 border-b border-gray-100 bg-secundaria text-white">
          <div>
            <h2 className="font-serif font-bold text-xl">Seu Carrinho</h2>
            <p className="text-[10px] uppercase tracking-widest text-gray-300 font-bold mt-0.5">{totalItems} {totalItems === 1 ? 'peça selecionada' : 'peças selecionadas'}</p>
          </div>
          <button
            onClick={() => setIsCartOpen(false)}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white font-bold"
          >
            ✕
          </button>
        </div>

        {/* Lista de Itens */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
          {cartItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-20">
              <span className="text-6xl mb-6 grayscale opacity-30">🛒</span>
              <p className="font-serif text-xl text-secundaria font-bold mb-2">Carrinho Vazio</p>
              <p className="text-gray-400 text-sm mb-8">Adicione peças artesanais da Camélia ao seu carrinho.</p>
              <button onClick={() => setIsCartOpen(false)} className="bg-primaria text-white px-8 py-3 font-bold uppercase tracking-widest text-xs rounded-full hover:opacity-90">
                Explorar Coleção
              </button>
            </div>
          ) : (
            cartItems.map(item => (
              <div key={item.id} className="flex gap-4 bg-gray-50 rounded-2xl p-4 border border-gray-100">
                <img
                  src={item.image_url || '/logo.png'}
                  alt={item.nome}
                  className="w-20 h-20 object-cover rounded-xl flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-secundaria text-sm leading-tight mb-1 truncate">{item.nome}</h4>
                  <p className="text-primaria font-bold text-base">{formatCurrency(item.price)}</p>

                  {/* Controle de Quantidade */}
                  <div className="flex items-center gap-3 mt-3">
                    <button
                      onClick={() => updateQty(item.id, item.quantity - 1)}
                      className="w-7 h-7 rounded-full bg-white border border-gray-200 flex items-center justify-center font-bold text-gray-600 hover:border-primaria hover:text-primaria transition-colors text-sm"
                    >−</button>
                    <span className="text-sm font-bold text-secundaria w-4 text-center">{item.quantity}</span>
                    <button
                      onClick={() => updateQty(item.id, item.quantity + 1)}
                      disabled={item.quantity >= item.stock}
                      className="w-7 h-7 rounded-full bg-white border border-gray-200 flex items-center justify-center font-bold text-gray-600 hover:border-primaria hover:text-primaria transition-colors text-sm disabled:opacity-30"
                    >+</button>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="ml-auto text-[10px] text-red-400 hover:text-red-600 uppercase font-bold underline"
                    >Remover</button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer: Totais + Checkout */}
        {cartItems.length > 0 && (
          <div className="border-t border-gray-100 px-6 py-6 space-y-4 bg-white">
            <div className="flex justify-between items-center">
              <span className="font-bold text-gray-500 text-sm uppercase tracking-widest">Subtotal</span>
              <span className="font-serif font-bold text-secundaria text-2xl">{formatCurrency(totalPrice)}</span>
            </div>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest text-center">Frete calculado no checkout</p>

            <Link
              to="/checkout"
              onClick={() => setIsCartOpen(false)}
              className="block w-full bg-secundaria text-white text-center font-bold py-5 rounded-2xl uppercase tracking-widest text-sm hover:bg-black transition-colors shadow-lg"
            >
              Finalizar Pedido →
            </Link>

            <button
              onClick={() => setIsCartOpen(false)}
              className="block w-full text-center text-gray-400 text-xs font-bold uppercase tracking-widest hover:text-secundaria py-2"
            >
              ← Continuar Comprando
            </button>
          </div>
        )}
      </div>
    </>
  );
}
