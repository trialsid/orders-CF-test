import React, { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import SiteNav from '../components/SiteNav';
import Footer from '../components/Footer';
import FloatingCall from '../components/FloatingCall';
import { useProducts } from '../hooks/useProducts';
import { useCart } from '../hooks/useCart';
import type { OrderPayload, OrderResponse } from '../types';

export type Theme = 'light' | 'dark';

const THEME_STORAGE_KEY = 'order-ieeja-theme';

const getPreferredTheme = (): Theme => {
  if (typeof window === 'undefined') {
    return 'light';
  }
  const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (stored === 'light' || stored === 'dark') {
    return stored;
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

export type ProductsContextValue = ReturnType<typeof useProducts>;
export type CartContextValue = ReturnType<typeof useCart>;

export type AppOutletContext = {
  products: ProductsContextValue;
  cart: CartContextValue;
  submitOrder: () => Promise<void>;
  isSubmitting: boolean;
};

function MainLayout(): JSX.Element {
  const products = useProducts();
  const cart = useCart();
  const [theme, setTheme] = useState<Theme>(() => getPreferredTheme());
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (typeof document === 'undefined') {
      return;
    }
    const root = document.documentElement;
    root.classList.toggle('dark', theme === 'dark');
    root.dataset.theme = theme;
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((current) => (current === 'dark' ? 'light' : 'dark'));
  };

  const submitOrder = async () => {
    if (!cart.hasItems) {
      return;
    }

    setIsSubmitting(true);
    try {
      const orderItems = cart.cartItems.map(({ product, quantity }) => ({
        id: product.id,
        name: product.name,
        quantity,
        unit: product.unit,
        price: product.price,
      }));

      const payload: OrderPayload = {
        items: orderItems,
        customer: {
          name: 'Walk-in customer',
        },
      };

      const response = await fetch('/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = (await response.json()) as OrderResponse;
      if (!response.ok) {
        throw new Error(result.message || 'Unable to place order right now.');
      }

      window.alert(result.message ?? 'Order placed.');
      cart.clearCart();
    } catch (error) {
      console.error(error);
      window.alert('Unable to place order right now. Please call the store.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const outletContext: AppOutletContext = {
    products,
    cart,
    submitOrder,
    isSubmitting,
  };

  const year = new Date().getFullYear();

  return (
    <div className="min-h-screen bg-surface-light dark:bg-slate-950">
      <SiteNav theme={theme} onToggleTheme={toggleTheme} cartCount={cart.cartItems.length} />
      <main className="pb-16">
        <Outlet context={outletContext} />
      </main>
      <Footer year={year} />
      <FloatingCall />
    </div>
  );
}

export default MainLayout;
