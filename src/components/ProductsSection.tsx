import React from 'react';
import type { RefObject } from 'react';
import { PlusCircle, PackageOpen } from 'lucide-react';
import type { Product } from '../types';
import { formatCurrency } from '../utils/formatCurrency';

type ProductsSectionProps = {
  sectionRef?: RefObject<HTMLElement>;
  categories: string[];
  filter: string;
  onFilterChange: (category: string) => void;
  products: Product[];
  statusText: string;
  onAddToCart: (product: Product) => void;
};

function ProductsSection({
  sectionRef,
  categories,
  filter,
  onFilterChange,
  products,
  statusText,
  onAddToCart,
}: ProductsSectionProps): JSX.Element {
  return (
    <section id="products" ref={sectionRef} className="section">
      <div className="page-shell">
        <div className="section__intro">
          <h2>Build your basket</h2>
          <p>Select essentials from each category and add them straight to your order summary. We’ll confirm and deliver the same day.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            className={`chip ${filter === 'all' ? 'chip--active' : ''}`}
            role="tab"
            aria-selected={filter === 'all'}
            onClick={() => onFilterChange('all')}
          >
            All items
          </button>
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              className={`chip ${filter === category ? 'chip--active' : ''}`}
              role="tab"
              aria-selected={filter === category}
              onClick={() => onFilterChange(category)}
            >
              {category}
            </button>
          ))}
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {products.map((product) => (
            <article
              key={product.id}
              className="group flex h-full flex-col justify-between rounded-3xl border border-emerald-100/70 bg-white/90 p-6 shadow-lg shadow-brand-900/10 transition hover:-translate-y-1 hover:shadow-xl dark:border-emerald-900/60 dark:bg-slate-900/70"
            >
              <div className="flex flex-col gap-3">
                <span className="inline-flex w-fit items-center gap-2 rounded-full bg-brand-500/10 px-3 py-1 text-xs font-medium uppercase tracking-wider text-brand-700 dark:text-brand-300">
                  <PackageOpen className="h-3.5 w-3.5" />
                  {product.category}
                </span>
                <h3 className="font-display text-xl font-semibold text-emerald-900 dark:text-brand-100">{product.name}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-300">{product.description}</p>
              </div>
              <div className="mt-6 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-300">{product.unit}</p>
                  <p className="text-lg font-semibold text-brand-700 dark:text-brand-300">{formatCurrency(product.price)}</p>
                </div>
                <button
                  type="button"
                  onClick={() => onAddToCart(product)}
                  className="inline-flex items-center gap-2 rounded-full border border-brand-500/30 bg-white px-4 py-2 text-sm font-semibold text-brand-700 transition hover:border-brand-500 hover:text-brand-900 group-hover:shadow-sm dark:border-brand-700/50 dark:bg-slate-900 dark:text-brand-200 dark:hover:border-brand-400"
                >
                  Add to basket
                  <PlusCircle className="h-4 w-4" />
                </button>
              </div>
            </article>
          ))}
        </div>

        <p className="status">{statusText}</p>
      </div>
    </section>
  );
}

export default ProductsSection;
