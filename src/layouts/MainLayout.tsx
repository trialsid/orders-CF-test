import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Outlet } from 'react-router-dom';
import SiteNav from '../components/SiteNav';
import Footer from '../components/Footer';
import FloatingCall from '../components/FloatingCall';
import { useProducts } from '../hooks/useProducts';
import { useCart } from '../hooks/useCart';
import type { OrderPayload, OrderResponse } from '../types';
import {
  Locale,
  SUPPORTED_LOCALES,
  TRANSLATIONS,
  TranslationContext,
  translate,
  type TranslationTree,
} from '../i18n/i18n';

export type Theme = 'light' | 'dark';

const THEME_STORAGE_KEY = 'order-ieeja-theme';
const LOCALE_STORAGE_KEY = 'order-ieeja-locale';

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

const getPreferredLocale = (): Locale => {
  if (typeof window === 'undefined') {
    return 'en';
  }
  const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);
  if (stored && SUPPORTED_LOCALES.includes(stored as Locale)) {
    return stored as Locale;
  }
  return 'en';
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
  const [locale, setLocale] = useState<Locale>(() => getPreferredLocale());
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

  useEffect(() => {
    if (typeof document === 'undefined') {
      return;
    }
    document.documentElement.lang = locale;
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
    }
  }, [locale]);

  const toggleTheme = () => {
    setTheme((current) => (current === 'dark' ? 'light' : 'dark'));
  };

  const changeLocale = useCallback((next: Locale) => {
    setLocale(next);
  }, []);

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
  const dictionary: TranslationTree = TRANSLATIONS[locale];

  const t = useCallback(
    (path: string, params?: Record<string, string | number | undefined>) => translate(dictionary, path, params),
    [dictionary]
  );

  const translationValue = useMemo(
    () => ({
      locale,
      setLocale: changeLocale,
      t,
      dictionary,
    }),
    [changeLocale, dictionary, locale, t]
  );

  return (
    <TranslationContext.Provider value={translationValue}>
      <div className="min-h-screen bg-surface-light dark:bg-slate-950">
        <SiteNav theme={theme} onToggleTheme={toggleTheme} cartCount={cart.cartItems.length} />
        <main className="pb-16">
          <Outlet context={outletContext} />
        </main>
        <Footer year={year} />
        <FloatingCall />
      </div>
    </TranslationContext.Provider>
  );
}

export default MainLayout;
