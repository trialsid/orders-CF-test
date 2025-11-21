import React from 'react';
import { Minus, Plus } from 'lucide-react';
import type { CartEntry } from '../types';
import { formatCurrency } from '../utils/formatCurrency';
import { useTranslations } from '../i18n/i18n';

type CartItemListProps = {
  items: CartEntry[];
  onUpdateQuantity: (productId: string, delta: number) => void;
  readOnly?: boolean;
};

function CartItemList({ items, onUpdateQuantity, readOnly = false }: CartItemListProps): JSX.Element {
  const { t } = useTranslations();

  if (!items.length) {
    return <div className="py-8 text-center text-slate-500 dark:text-slate-400">{t('cart.empty')}</div>;
  }

  return (
    <div className="space-y-4">
      {items.map(({ product, quantity }) => {
        const meta = product.department ? `${product.department} • ${product.category}` : product.category;

        return (
          <div
            key={product.id}
            className="flex flex-col gap-4 rounded-3xl border border-emerald-100/70 bg-white/95 p-5 shadow-md shadow-brand-900/10 dark:border-emerald-900/60 dark:bg-slate-900/70 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-6"
          >
            <div className="min-w-[200px] flex-1">
              <h4 className="font-display text-lg font-semibold text-emerald-900 dark:text-brand-100">{product.name}</h4>
              <p className="text-sm text-slate-500 dark:text-slate-300">{meta}</p>
            </div>
            <div className="flex items-center justify-between gap-4 sm:justify-center">
              {!readOnly && (
                <button
                  type="button"
                  onClick={() => onUpdateQuantity(product.id, -1)}
                  className="inline-flex items-center justify-center rounded-full bg-emerald-100 px-5 py-2 text-base font-semibold text-brand-700 shadow-soft transition hover:bg-emerald-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-200 dark:bg-brand-900/40 dark:text-brand-100 dark:hover:bg-brand-900/60"
                  aria-label={t('cart.aria.decrease', { name: product.name })}
                >
                  <Minus className="h-4 w-4" />
                </button>
              )}
              <span className="inline-flex min-w-[2.5rem] items-center justify-center rounded-full bg-gradient-to-r from-lime-100 via-yellow-50 to-amber-100 px-3 py-1 text-base font-semibold text-amber-900 shadow-sm shadow-amber-200/60 dark:from-amber-700 dark:via-amber-600 dark:to-amber-700 dark:text-amber-50 dark:shadow-amber-950/40">
                {readOnly ? `${quantity} ×` : quantity}
              </span>
              {!readOnly && (
                <button
                  type="button"
                  onClick={() => onUpdateQuantity(product.id, 1)}
                  className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-brand-500 to-brand-600 px-5 py-2 text-base font-semibold text-white shadow-soft transition hover:from-brand-600 hover:to-brand-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-200"
                  aria-label={t('cart.aria.increase', { name: product.name })}
                >
                  <Plus className="h-4 w-4" />
                </button>
              )}
            </div>
            <p className="text-lg font-semibold text-brand-700 dark:text-brand-300 sm:text-right">
              {formatCurrency(product.price * quantity)}
            </p>
          </div>
        );
      })}
    </div>
  );
}

export default CartItemList;
