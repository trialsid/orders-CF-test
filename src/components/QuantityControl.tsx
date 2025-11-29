import React from 'react';
import { Minus, Plus } from 'lucide-react';

export type QuantityControlProps = {
  quantity: number;
  onIncrease: () => void;
  onDecrease: () => void;
  className?: string;
  ariaLabelName?: string;
};

export function QuantityControl({
  quantity,
  onIncrease,
  onDecrease,
  className = '',
  ariaLabelName = 'product',
}: QuantityControlProps): JSX.Element {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <button
        type="button"
        onClick={onDecrease}
        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-emerald-200 bg-white text-brand-700 shadow-soft transition hover:border-emerald-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-200 dark:border-emerald-800 dark:bg-slate-900 dark:text-brand-200"
        aria-label={`Decrease quantity for ${ariaLabelName}`}
      >
        <Minus className="h-4 w-4" />
      </button>
      <span className="inline-flex min-w-[2.5rem] items-center justify-center rounded-full bg-gradient-to-r from-lime-100 via-yellow-50 to-amber-100 px-3 py-1 text-base font-semibold text-amber-900 shadow-sm shadow-amber-200/60 dark:from-amber-700 dark:via-amber-600 dark:to-amber-700 dark:text-amber-50 dark:shadow-amber-950/40">
        {quantity}
      </span>
      <button
        type="button"
        onClick={onIncrease}
        className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-brand-500 to-brand-600 text-white shadow-soft transition hover:from-brand-600 hover:to-brand-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-200"
        aria-label={`Increase quantity for ${ariaLabelName}`}
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}
