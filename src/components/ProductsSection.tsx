import React from 'react';
import type { RefObject } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Minus, PackageOpen } from 'lucide-react';
import type { Product } from '../types';
import { formatCurrency } from '../utils/formatCurrency';
import { useTranslations } from '../i18n/i18n';

type ProductsSectionProps = {
  sectionRef?: RefObject<HTMLElement>;
  departments: string[];
  filter: string;
  onFilterChange: (department: string) => void;
  products: Product[];
  statusText: string;
  onAddToCart: (product: Product) => void;
  getQuantity?: (productId: string) => number;
  onUpdateQuantity?: (productId: string, delta: number) => void;
  paddingBottom?: number;
  wrapInSection?: boolean;
};

function ProductsSection({
  sectionRef,
  departments,
  filter,
  onFilterChange,
  products,
  statusText,
  onAddToCart,
  getQuantity,
  onUpdateQuantity,
  paddingBottom,
  wrapInSection = true,
}: ProductsSectionProps): JSX.Element {
  const { t } = useTranslations();
  const resolveQuantity = getQuantity ?? (() => 0);
  const canAdjustQuantity = typeof onUpdateQuantity === 'function';

  const containerStyle = paddingBottom ? { paddingBottom: `${paddingBottom}px` } : undefined;

  const content = (
    <div id="products" ref={sectionRef} style={containerStyle}>
        <div className="flex items-center gap-2 overflow-x-auto pb-2 pt-1 sm:flex-wrap sm:gap-3">
          <button
            type="button"
            className={`chip ${filter === 'all' ? 'chip--active' : ''}`}
            role="tab"
            aria-selected={filter === 'all'}
            onClick={() => onFilterChange('all')}
          >
            {t('products.filters.all')}
          </button>
          {departments.map((department) => (
            <button
              key={department}
              type="button"
              className={`chip ${filter === department ? 'chip--active' : ''}`}
              role="tab"
              aria-selected={filter === department}
              onClick={() => onFilterChange(department)}
            >
              {department}
            </button>
          ))}
        </div>

        <div className="mt-5 grid gap-3.5 sm:mt-8 sm:grid-cols-2 xl:grid-cols-3">
          {products.map((product) => {
            const quantity = resolveQuantity(product.id);
            const handleIncrease = () => {
              if (canAdjustQuantity && quantity > 0) {
                onUpdateQuantity?.(product.id, 1);
                return;
              }
              onAddToCart(product);
            };
            const handleDecrease = () => {
              if (!canAdjustQuantity || quantity <= 0) {
                return;
              }
              onUpdateQuantity?.(product.id, -1);
            };
            const chipLabel = product.category || product.department || 'Essentials';

            return (
              <article
                key={product.id}
                className="group flex h-full flex-col justify-between rounded-3xl border border-emerald-100/70 bg-white/95 p-3 shadow-md shadow-brand-900/10 transition hover:-translate-y-1 hover:shadow-lg dark:border-emerald-900/60 dark:bg-slate-900/70 sm:p-6"
              >
                <div className="flex flex-col gap-1.5 sm:gap-2">
                <span className="hidden w-fit items-center gap-2 rounded-full bg-brand-500/10 px-3 py-1 text-xs font-medium uppercase tracking-wider text-brand-700 dark:text-brand-300 sm:inline-flex">
                  <PackageOpen className="h-3.5 w-3.5" />
                  {chipLabel}
                </span>
                <span className="text-xs font-semibold uppercase tracking-wide text-brand-600 sm:hidden">{chipLabel}</span>
                <Link
                  to={`/products/${product.id}`}
                  className="font-display text-lg font-semibold text-emerald-900 transition hover:text-brand-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-200 dark:text-brand-100 sm:text-xl"
                  aria-label={product.name}
                >
                  {product.name}
                </Link>
                <div className="flex w-full items-center justify-between mt-3 gap-3 sm:mt-6 sm:flex-row sm:items-center">
                  {/* Desktop Price & MRP */}
                  <div className="hidden sm:block">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">
                      {t('products.labels.mrp', { price: formatCurrency(product.mrp) })}
                    </p>
                    <p className="text-lg font-semibold text-brand-700 dark:text-brand-300">{formatCurrency(product.price)}</p>
                  </div>

                  {/* Mobile Price & MRP */}
                  <div className="flex flex-col items-start gap-0.5 sm:hidden">
                    <span className="text-xs font-medium uppercase tracking-wide text-slate-500 line-through">
                      {t('products.labels.mrp', { price: formatCurrency(product.mrp) })}
                    </span>
                    <span className="text-base font-semibold text-brand-700">
                      {formatCurrency(product.price)}
                    </span>
                  </div>

                  {/* Quantity Controls / Add to Cart Button */}
                  <div className="flex items-center justify-end sm:w-auto sm:justify-start">
                    {quantity > 0 && canAdjustQuantity ? (
                      <div className="flex items-center gap-2 sm:flex">
                        <button
                          type="button"
                          onClick={handleDecrease}
                          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-emerald-200 bg-white text-brand-700 shadow-soft transition hover:border-emerald-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-200 dark:border-emerald-800 dark:bg-slate-900 dark:text-brand-200"
                          aria-label={t('cart.aria.decrease', { name: product.name })}
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="inline-flex min-w-[2.5rem] items-center justify-center rounded-full bg-gradient-to-r from-lime-100 via-yellow-50 to-amber-100 px-3 py-1 text-base font-semibold text-amber-900 shadow-sm shadow-amber-200/60 dark:from-amber-700 dark:via-amber-600 dark:to-amber-700 dark:text-amber-50 dark:shadow-amber-950/40">
                          {quantity}
                        </span>
                        <button
                          type="button"
                          onClick={handleIncrease}
                          className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-brand-500 to-brand-600 text-white shadow-soft transition hover:from-brand-600 hover:to-brand-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-200"
                          aria-label={t('cart.aria.increase', { name: product.name })}
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <>
                        {/* Desktop Add to Cart Button */}
                        <button
                          type="button"
                          onClick={() => onAddToCart(product)}
                          className="hidden sm:inline-flex items-center justify-center gap-2 rounded-full border border-brand-500/40 bg-white px-4 py-2 text-sm font-semibold text-brand-700 transition hover:border-brand-500 hover:text-brand-900 dark:border-brand-700/50 dark:bg-slate-900 dark:text-brand-200 dark:hover:border-brand-400 sm:py-2.5"
                          aria-label={t('products.aria.addToCart', { name: product.name })}
                        >
                          {t('products.actions.addToCart')}
                          <Plus className="h-4 w-4" />
                        </button>

                        {/* Mobile Add to Cart Button (compact green +) */}
                        <button
                          type="button"
                          onClick={() => onAddToCart(product)}
                          className="sm:hidden inline-flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-brand-500 to-brand-600 text-white shadow-soft transition hover:from-brand-600 hover:to-brand-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-200"
                          aria-label={t('products.aria.addToCart', { name: product.name })}
                          title={t('products.actions.addToCart')}
                        >
                          <Plus className="h-5 w-5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </article>
          );
          })}
        </div>

        <p className="status">{statusText}</p>
    </div>
  );

  if (!wrapInSection) {
    return content;
  }

  return (
    <section id="products" ref={sectionRef} className="section">
      <div className="page-shell" style={containerStyle}>
        <div className="section__intro">
          <h2>{t('products.title')}</h2>
          <p>{t('products.description')}</p>
        </div>
        {content}
      </div>
    </section>
  );
}

export default ProductsSection;
