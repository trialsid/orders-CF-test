import React, { useMemo } from 'react';
import { useTranslations } from '../i18n/i18n';

type OrderStatusKey = 'delivered' | 'outForDelivery';

type SampleOrder = {
  id: string;
  date: string;
  status: OrderStatusKey;
  summaryKey: 'summaryDelivered' | 'summaryOutForDelivery';
};

function OrdersPage(): JSX.Element {
  const { t } = useTranslations();

  const orders = useMemo<SampleOrder[]>(
    () => [
      { id: 'ORD-1098', date: 'Oct 28, 2025', status: 'delivered', summaryKey: 'summaryDelivered' },
      { id: 'ORD-1099', date: 'Nov 02, 2025', status: 'outForDelivery', summaryKey: 'summaryOutForDelivery' },
    ],
    []
  );

  return (
    <section className="section">
      <div className="page-shell space-y-10">
        <header className="section__intro">
          <h1>{t('orders.title')}</h1>
          <p>{t('orders.description')}</p>
        </header>

        <div className="space-y-4">
          {orders.map((order) => (
            <article
              key={order.id}
              className="rounded-3xl border border-emerald-100/60 bg-white/90 p-6 shadow-lg dark:border-emerald-900/60 dark:bg-slate-900/70"
            >
              <header className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="font-display text-lg font-semibold text-emerald-900 dark:text-brand-100">{order.id}</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-300">{t('orders.placedOn', { date: order.date })}</p>
                </div>
                <span className="rounded-full bg-brand-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-brand-700 dark:text-brand-200">
                  {t(`orders.status.${order.status}`)}
                </span>
              </header>
              <p className="mt-4 text-sm text-slate-600 dark:text-slate-300">{t(`orders.${order.summaryKey}`)}</p>
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
          ))}
        </div>
      </div>
    </section>
  );
}

export default OrdersPage;
