import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import SiteNav from '../components/SiteNav';
import Footer from '../components/Footer';
import FloatingCall from '../components/FloatingCall';
import Toast, { type ToastMessage } from '../components/Toast';
import { useProducts } from '../hooks/useProducts';
import { useCart } from '../hooks/useCart';
import type { CheckoutFormValues, OrderResponse } from '../types';
import { createEmptyCheckoutForm, prepareOrderPayload, MAX_ITEM_QUANTITY } from '../utils/checkout';
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

export type CheckoutDraftState = {
  form: CheckoutFormValues;
  stepIndex: number;
};

export type AppOutletContext = {
  products: ProductsContextValue;
  cart: CartContextValue;
  submitOrder: (details: CheckoutFormValues) => Promise<OrderResponse | undefined>;
  isSubmitting: boolean;
  checkoutDraft: CheckoutDraftState;
  updateCheckoutDraft: (draft: Partial<CheckoutDraftState>) => void;
  resetCheckoutDraft: () => void;
};

function MainLayout(): JSX.Element {
  const products = useProducts();
  const cart = useCart();
  const location = useLocation();
  const [theme, setTheme] = useState<Theme>(() => getPreferredTheme());
  const [locale, setLocale] = useState<Locale>(() => getPreferredLocale());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const mainRef = useRef<HTMLElement | null>(null);
  const [checkoutDraft, setCheckoutDraft] = useState<CheckoutDraftState>(() => ({
    form: createEmptyCheckoutForm(),
    stepIndex: 0,
  }));

  const updateCheckoutDraft = useCallback((draft: Partial<CheckoutDraftState>) => {
    setCheckoutDraft((current) => ({
      form: draft.form ?? current.form,
      stepIndex: typeof draft.stepIndex === 'number' ? draft.stepIndex : current.stepIndex,
    }));
  }, []);

  const resetCheckoutDraft = useCallback(() => {
    setCheckoutDraft({ form: createEmptyCheckoutForm(), stepIndex: 0 });
  }, []);

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

  const dictionary: TranslationTree = useMemo(() => TRANSLATIONS[locale], [locale]);

  const t = useCallback(
    (path: string, params?: Record<string, string | number | undefined>) => translate(dictionary, path, params),
    [dictionary]
  );

  const showToast = useCallback((toast: Omit<ToastMessage, 'id'>) => {
    setToasts((current) => [
      ...current,
      { ...toast, id: Date.now() + Math.floor(Math.random() * 1000) },
    ]);
  }, []);

  const dismissToast = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const mainElement = mainRef.current;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const behavior: ScrollBehavior = prefersReducedMotion ? 'auto' : 'smooth';

    window.scrollTo({ top: 0, left: 0, behavior });

    if (!mainElement) {
      return;
    }

    const focusMain = () => {
      mainElement.focus({ preventScroll: true });
    };

    if (prefersReducedMotion) {
      focusMain();
    } else {
      window.requestAnimationFrame(() => focusMain());
    }
  }, [location.pathname]);

  const submitOrder = async (
    details: CheckoutFormValues
  ): Promise<OrderResponse | undefined> => {
    if (!cart.hasItems) {
      showToast({
        type: 'error',
        title: t('checkout.toasts.emptyCartTitle'),
        description: t('checkout.toasts.emptyCartDescription'),
      });
      return undefined;
    }

    const prepared = prepareOrderPayload(details, cart.cartItems);
    if (!prepared.ok) {
      if (prepared.cartError === 'quantityLimit') {
        showToast({
          type: 'error',
          title: t('checkout.toasts.errorTitle'),
          description: t('checkout.validation.quantityLimit', { limit: MAX_ITEM_QUANTITY }),
        });
        return undefined;
      }

      if (prepared.cartError === 'empty') {
        showToast({
          type: 'error',
          title: t('checkout.toasts.emptyCartTitle'),
          description: t('checkout.toasts.emptyCartDescription'),
        });
        return undefined;
      }

      if (prepared.fieldErrors) {
        showToast({
          type: 'error',
          title: t('checkout.toasts.errorTitle'),
          description: t('checkout.validation.fixErrors'),
        });
        return undefined;
      }
    }

    const payload = prepared.ok ? prepared.payload : undefined;
    if (!payload) {
      showToast({
        type: 'error',
        title: t('checkout.toasts.errorTitle'),
        description: t('checkout.toasts.errorDescription'),
      });
      return undefined;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = (await response.json()) as OrderResponse;
      if (!response.ok) {
        throw new Error(result.error || result.message || t('checkout.toasts.errorDescription'));
      }

      cart.clearCart();
      resetCheckoutDraft();

      const title = result.message ?? t('checkout.toasts.successTitle');
      const description = result.orderId
        ? t('checkout.toasts.reference', { orderId: result.orderId })
        : undefined;

      showToast({
        type: 'success',
        title,
        description,
      });

      return result;
    } catch (error) {
      console.error(error);
      const fallback = t('checkout.toasts.errorDescription');
      const message = error instanceof Error ? error.message : fallback;

      showToast({
        type: 'error',
        title: t('checkout.toasts.errorTitle'),
        description: message || fallback,
      });

      throw error instanceof Error ? error : new Error(message || fallback);
    } finally {
      setIsSubmitting(false);
    }
  };

  const outletContext: AppOutletContext = {
    products,
    cart,
    submitOrder,
    isSubmitting,
    checkoutDraft,
    updateCheckoutDraft,
    resetCheckoutDraft,
  };

  const year = new Date().getFullYear();

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
        <main
          id="main-content"
          ref={mainRef}
          tabIndex={-1}
          className="pb-16 focus:outline-none"
        >
          <Outlet context={outletContext} />
        </main>
        <Footer year={year} />
        <FloatingCall />
        {toasts.length > 0 && (
          <div className="pointer-events-none fixed right-4 top-24 z-50 flex flex-col gap-3">
            {toasts.map((toast) => (
              <Toast key={toast.id} toast={toast} onDismiss={dismissToast} />
            ))}
          </div>
        )}
      </div>
    </TranslationContext.Provider>
  );
}

export default MainLayout;
