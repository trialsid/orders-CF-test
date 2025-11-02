import React from 'react';
import { MinusCircle, PlusCircle, CheckCircle2, Truck } from 'lucide-react';
import type { CartEntry } from '../types';
import { formatCurrency } from '../utils/formatCurrency';

type CartSectionProps = {
  items: CartEntry[];
  total: number;
  onUpdateQuantity: (productId: string, delta: number) => void;
  onSubmit: () => Promise<void> | void;
  isSubmitting: boolean;
  hasItems: boolean;
};

function CartSection({ items, total, onUpdateQuantity, onSubmit, isSubmitting, hasItems }: CartSectionProps): JSX.Element {
  return (
    <section id="cart" className="section bg-surface-light dark:bg-slate-950">
      <div className="page-shell">
        <div className="section__intro">
          <h2>Review & confirm your order</h2>
          <p>Your basket is shared with our fulfilment team instantly. We’ll call to confirm slot availability and payment preference.</p>
        </div>
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-4">
            {items.length ? (
              items.map(({ product, quantity }) => (
                <div
                  key={product.id}
                  className="flex flex-wrap items-center justify-between gap-6 rounded-3xl border border-emerald-100/70 bg-white/90 p-5 shadow-md shadow-brand-900/10 dark:border-emerald-900/60 dark:bg-slate-900/70"
                >
                  <div className="min-w-[200px] flex-1">
                    <h4 className="font-display text-lg font-semibold text-emerald-900 dark:text-brand-100">{product.name}</h4>
                    <p className="text-sm text-slate-500 dark:text-slate-300">
                      {product.unit} • {product.category}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => onUpdateQuantity(product.id, -1)}
                      className="quantity-btn"
                      aria-label={`Decrease ${product.name}`}
                    >
                      <MinusCircle className="h-4 w-4" />
                    </button>
                    <span className="text-base font-semibold text-emerald-900 dark:text-brand-200">{quantity}</span>
                    <button
                      type="button"
                      onClick={() => onUpdateQuantity(product.id, 1)}
                      className="quantity-btn"
                      aria-label={`Increase ${product.name}`}
                    >
                      <PlusCircle className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="text-lg font-semibold text-brand-700 dark:text-brand-300">{formatCurrency(product.price * quantity)}</p>
                </div>
              ))
            ) : (
              <div className="cart-empty">
                Your basket is empty. Browse the categories above and add the staples you need for today’s delivery slot.
              </div>
            )}
          </div>

          <aside className="lg:sticky lg:top-28">
              <div className="rounded-3xl border border-brand-500/20 bg-gradient-to-br from-white via-white to-brand-50/60 p-6 shadow-2xl shadow-brand-900/10 dark:border-brand-700/30 dark:from-slate-900 dark:via-slate-900 dark:to-brand-900/20">
                <h3 className="font-display text-xl font-semibold text-emerald-900 dark:text-brand-100">Order summary</h3>
                <div className="mt-6 space-y-3 text-sm text-slate-600 dark:text-slate-300">
                  <div className="flex items-center justify-between text-base font-semibold text-emerald-900 dark:text-brand-100">
                    <span>Subtotal</span>
                    <span>{formatCurrency(total)}</span>
                  </div>
                <p className="flex items-center gap-2 text-xs">
                  <Truck className="h-4 w-4 text-brand-500" />
                  Free delivery within Ieeja when your basket is above ₹499. Otherwise standard ₹40 fee applies.
                </p>
                </div>
                <button
                  type="button"
                  onClick={onSubmit}
                  disabled={!hasItems || isSubmitting}
                  className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-brand-500 to-brand-600 px-6 py-3 text-base font-semibold text-white shadow-soft transition hover:from-brand-600 hover:to-brand-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-200 disabled:cursor-not-allowed disabled:opacity-60"
                >
                {isSubmitting ? 'Placing order…' : 'Place order'}
                {!isSubmitting && <CheckCircle2 className="h-5 w-5" />}
                </button>
              <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                After you submit, we call within 5 minutes to confirm slot and total. Payment currently accepted in cash or UPI on
                delivery.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}

export default CartSection;
