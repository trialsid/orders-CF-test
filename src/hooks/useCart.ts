import { useMemo, useState } from 'react';
import type { CartEntry, Product } from '../types';

export function useCart() {
  const [cart, setCart] = useState<Map<string, CartEntry>>(new Map());

  const cartItems = useMemo<CartEntry[]>(() => Array.from(cart.values()), [cart]);
  const cartTotal = useMemo(() => cartItems.reduce((sum, { product, quantity }) => sum + product.price * quantity, 0), [cartItems]);

  const addItem = (product: Product) => {
    setCart((prev) => {
      const next = new Map(prev);
      const entry = next.get(product.id);
      if (entry) {
        next.set(product.id, { ...entry, quantity: entry.quantity + 1 });
      } else {
        next.set(product.id, { product, quantity: 1 });
      }
      return next;
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) => {
      const next = new Map(prev);
      const entry = next.get(productId);
      if (!entry) {
        return prev;
      }
      const updatedQuantity = entry.quantity + delta;
      if (updatedQuantity <= 0) {
        next.delete(productId);
      } else {
        next.set(productId, { ...entry, quantity: updatedQuantity });
      }
      return next;
    });
  };

  const clearCart = () => setCart(new Map<string, CartEntry>());

  return {
    cartItems,
    cartTotal,
    addItem,
    updateQuantity,
    clearCart,
    hasItems: cartItems.length > 0,
  };
}
