import { useMemo, useState } from 'react';
import type { CartEntry, Product } from '../types';
import { MAX_ITEM_QUANTITY } from '../utils/checkout';

export function useCart() {
  const [cart, setCart] = useState<Map<string, CartEntry>>(new Map());

  const cartItems = useMemo<CartEntry[]>(() => Array.from(cart.values()), [cart]);
  const cartTotal = useMemo(() => cartItems.reduce((sum, { product, quantity }) => sum + product.price * quantity, 0), [cartItems]);

  const addItem = (product: Product) => {
    setCart((prev) => {
      const next = new Map(prev);
      const entry = next.get(product.id);
      if (entry) {
        if (entry.quantity >= MAX_ITEM_QUANTITY) {
          return prev;
        }
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
      if (delta > 0 && entry.quantity >= MAX_ITEM_QUANTITY) {
        return prev;
      }
      const updatedQuantity = entry.quantity + delta;
      if (updatedQuantity <= 0) {
        next.delete(productId);
      } else {
        const boundedQuantity = Math.min(updatedQuantity, MAX_ITEM_QUANTITY);
        next.set(productId, { ...entry, quantity: boundedQuantity });
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
