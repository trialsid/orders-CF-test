import React from 'react';
import { useOrders } from '../hooks/useOrders';
import { useTranslations } from '../i18n/i18n';
import { formatCurrency } from '../utils/formatCurrency';

const STATUS_BADGE_STYLES: Record<string, string> = {
  pending: 'bg-amber-500/10 text-amber-700 dark:text-amber-200',
  confirmed: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-200',
  outForDelivery: 'bg-sky-500/10 text-sky-700 dark:text-sky-200',
  delivered: 'bg-brand-500/10 text-brand-700 dark:text-brand-200',
  cancelled: 'bg-rose-500/10 text-rose-700 dark:text-rose-200',
};

const formatItemsSummary = (items: { name: string; quantity: number }[]): string => {
  if (!items.length) {
    return '';
  }
  const parts = items.slice(0, 3).map((item) => `${item.quantity} × ${item.name}`);
  return items.length > 3 ? `${parts.join(', ')}…` : parts.join(', ');
};

function OrdersPage(): JSX.Element {
  const { t, locale } = useTranslations();
  const { orders, status, error, refresh } = useOrders();

  const isLoading = status === 'loading';
  const isError = status === 'error';
  const hasOrders = status === 'success' && orders.length > 0;

  return (
    <section className="section">
      <div className="page-shell space-y-10">
        <header className="section__intro">
          <h1>{t('orders.title')}</h1>
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-sm text-slate-600 dark:text-slate-300">{t('orders.description')}</p>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-full border border-emerald-200/70 bg-white px-4 py-2 text-sm font-semibold text-emerald-800 shadow-sm transition hover:border-emerald-400 hover:text-emerald-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-200 dark:border-emerald-800 dark:bg-slate-900 dark:text-emerald-200"
              onClick={refresh}
              disabled={isLoading}
            >
              {isLoading ? t('orders.loading') : t('orders.refresh')}
            </button>
          </div>
        </header>

        {isLoading && (
          <div className="rounded-3xl border border-dashed border-emerald-200/60 bg-white/80 p-6 text-sm text-slate-600 dark:border-emerald-900/60 dark:bg-slate-900/60 dark:text-slate-300">
            {t('orders.loading')}
          </div>
        )}

        {isError && (
          <div className="space-y-3 rounded-3xl border border-rose-200/60 bg-rose-50/80 p-6 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-900/40 dark:text-rose-100">
            <p>{error ?? t('orders.error')}</p>
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-full bg-rose-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-200"
              onClick={refresh}
            >
              {t('orders.retry')}
            </button>
          </div>
        )}

        {!isLoading && !isError && !hasOrders && (
          <div className="rounded-3xl border border-emerald-100/60 bg-white/90 p-6 text-sm text-slate-600 shadow-sm dark:border-emerald-900/60 dark:bg-slate-900/70 dark:text-slate-300">
            {t('orders.empty')}
          </div>
        )}

        {hasOrders && (
          <div className="space-y-4">
            {orders.map((order) => {
              const statusLabelKey = `orders.status.${order.status}`;
              const statusLabel = t(statusLabelKey) || order.status;
              const badgeClass = STATUS_BADGE_STYLES[order.status] ?? STATUS_BADGE_STYLES.pending;
              const orderDate = order.createdAt ? new Date(order.createdAt) : undefined;
              const formattedDate = orderDate
                ? new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(orderDate)
                : '';
              const summary = formatItemsSummary(order.items);
              const detailLines = [
                order.customerName ? t('orders.customerLine', { name: order.customerName }) : null,
                order.customerPhone ? t('orders.customerPhone', { phone: order.customerPhone }) : null,
                order.customerAddress ? t('orders.customerAddress', { address: order.customerAddress }) : null,
                order.deliverySlot ? t('orders.deliverySlot', { slot: order.deliverySlot }) : null,
                order.paymentMethod ? t('orders.paymentMethod', { method: order.paymentMethod }) : null,
                order.deliveryInstructions
                  ? t('orders.deliveryInstructions', { instructions: order.deliveryInstructions })
                  : null,
              ].filter(Boolean) as string[];

              return (
                <article
                  key={order.id}
                  className="rounded-3xl border border-emerald-100/60 bg-white/90 p-6 shadow-lg dark:border-emerald-900/60 dark:bg-slate-900/70"
                >
                  <header className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <h2 className="font-display text-lg font-semibold text-emerald-900 dark:text-brand-100">{order.id}</h2>
                      <p className="text-sm text-slate-500 dark:text-slate-300">
                        {formattedDate ? t('orders.placedOn', { date: formattedDate }) : ''}
                      </p>
                    </div>
                    <span
                      className={`rounded-full border border-transparent px-4 py-2 text-xs font-semibold uppercase tracking-wide ${badgeClass}`}
                    >
                      {statusLabel}
                    </span>
                  </header>

                  <div className="mt-4 space-y-3 text-sm text-slate-600 dark:text-slate-300">
                    {summary && <p>{summary}</p>}
                    {detailLines.length > 0 && (
                      <ul className="space-y-1 text-xs text-slate-500 dark:text-slate-400">
                        {detailLines.map((line, index) => (
                          <li key={`${order.id}-detail-${index}`}>{line}</li>
                        ))}
                      </ul>
                    )}
                    <p className="font-semibold text-emerald-800 dark:text-emerald-200">
                      {formatCurrency(order.totalAmount)}
                    </p>
                  </div>

                  <div className="mt-6 flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      className="rounded-full border border-emerald-200/70 bg-white px-4 py-2 text-sm font-semibold text-emerald-800 transition hover:border-emerald-400 hover:text-emerald-900 dark:border-emerald-800 dark:bg-slate-900 dark:text-emerald-200"
                    >
                      {t('orders.invoice')}
                    </button>
                    <button
                      type="button"
                      className="rounded-full bg-gradient-to-r from-brand-500 to-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-soft transition hover:from-brand-600 hover:to-brand-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-200"
                    >
                      {t('orders.reorder')}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

export default OrdersPage;
