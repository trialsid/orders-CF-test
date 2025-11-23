import React from 'react';
import { ChevronRight, ShoppingBag, Truck } from 'lucide-react';
import { useTranslations } from '../../i18n/i18n';
import { formatCurrency } from '../../utils/formatCurrency';
import CartItemList from '../CartItemList';
import type { CartEntry, AuthUser } from '../../types';

interface OrderSummaryProps {
  cartItems: CartEntry[];
  cartTotal: number;
  hasItems: boolean;
  isSubmitting: boolean;
  user: AuthUser | null;
  updateQuantity: (id: string, qty: number) => void;
  onSubmit: () => void;
  onLoginRedirect: () => void;
}

export function OrderSummary({
  cartItems,
  cartTotal,
  hasItems,
  isSubmitting,
  user,
  updateQuantity,
  onSubmit,
  onLoginRedirect,
}: OrderSummaryProps) {
  const { t } = useTranslations();

  return (
    <div className="rounded-3xl border border-brand-500/20 bg-gradient-to-br from-white via-white to-brand-50/60 p-6 shadow-2xl shadow-brand-900/10 dark:border-brand-700/30 dark:from-slate-900 dark:via-slate-900 dark:to-brand-900/20 lg:sticky lg:top-28">
      <div className="flex items-center gap-3 mb-6">
        <ShoppingBag className="h-6 w-6 text-brand-600 dark:text-brand-400" />
        <h3 className="font-display text-xl font-semibold text-emerald-900 dark:text-brand-100">
          Your Order
        </h3>
      </div>

      <div className="max-h-[40vh] overflow-y-auto pr-2 -mr-2 custom-scrollbar">
        <CartItemList items={cartItems} onUpdateQuantity={updateQuantity} />
      </div>

      <div className="mt-6 space-y-3 border-t border-emerald-100 pt-6 dark:border-emerald-900">
        <div className="flex items-center justify-between text-base font-semibold text-emerald-900 dark:text-brand-100">
          <span>{t('cart.subtotal')}</span>
          <span>{formatCurrency(cartTotal)}</span>
        </div>
        <p className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
          <Truck className="h-4 w-4 text-brand-500" />
          {t('cart.deliveryNote')}
        </p>
      </div>

      <button
        type="button"
        onClick={user ? onSubmit : onLoginRedirect}
        disabled={!hasItems || isSubmitting}
        className="mt-6 w-full hidden md:inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-brand-500 to-brand-600 px-5 py-3 text-sm font-semibold text-white shadow-soft transition hover:from-brand-600 hover:to-brand-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-200 disabled:cursor-not-allowed disabled:opacity-60 uppercase tracking-wide"
      >
        {isSubmitting
          ? t('checkout.aside.submitting')
          : user
            ? t('checkout.placeOrder')
            : t('checkout.signInToPlaceOrder')}
        {!isSubmitting && <ChevronRight className="h-5 w-5" />}
      </button>

      <p className="mt-4 text-xs text-center text-slate-500 dark:text-slate-400">
        {t('checkout.aside.callout', { phone: '+91 98765 43210' })}
      </p>
    </div>
  );
}