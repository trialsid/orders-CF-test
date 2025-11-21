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
    <div className="divide-y divide-emerald-100 dark:divide-emerald-900/60 rounded-2xl border border-emerald-100/80 bg-white/90 shadow-sm dark:border-emerald-900/60 dark:bg-slate-900/70">
      {items.map(({ product, quantity }) => {
        return (
          <div
            key={product.id}
            className="flex flex-col gap-2 px-4 py-3 sm:px-5 sm:py-3.5"
          >
            <div className="flex items-start gap-3">
              <div className="min-w-[180px] flex-1 pr-2">
                <h4 className="text-base font-semibold leading-snug text-emerald-900 dark:text-brand-100 line-clamp-2">
                  {product.name}
                </h4>
              </div>
              <p className="text-lg font-semibold text-brand-700 dark:text-brand-100 sm:min-w-[110px] sm:text-right">
                {formatCurrency(product.price * quantity)}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {!readOnly && (
                <button
                  type="button"
                  onClick={() => onUpdateQuantity(product.id, -1)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-sm font-semibold text-brand-700 shadow-sm transition hover:bg-emerald-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-200 dark:bg-brand-900/40 dark:text-brand-100 dark:hover:bg-brand-900/60"
                  aria-label={t('cart.aria.decrease', { name: product.name })}
                >
                  <Minus className="h-4 w-4" />
                </button>
              )}
              <span className="inline-flex min-w-[2.25rem] items-center justify-center rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-900 shadow-inner dark:bg-emerald-900/40 dark:text-emerald-100">
                {readOnly ? `${quantity}×` : quantity}
              </span>
              {!readOnly && (
                <button
                  type="button"
                  onClick={() => onUpdateQuantity(product.id, 1)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-200"
                  aria-label={t('cart.aria.increase', { name: product.name })}
                >
                  <Plus className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default CartItemList;
