import React from 'react';
import { Clock3, Wallet, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useOrders } from '../hooks/useOrders';
import { useTranslations } from '../i18n/i18n';
import { formatCurrency } from '../utils/formatCurrency';
import PageSection from '../components/PageSection';
import { useAuth } from '../context/AuthContext';

const STATUS_BADGE_STYLES: Record<string, string> = {
  pending: 'bg-amber-500/10 text-amber-700 dark:text-amber-200',
  confirmed: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-200',
  outForDelivery: 'bg-sky-500/10 text-sky-700 dark:text-sky-200',
  delivered: 'bg-brand-500/10 text-brand-700 dark:text-brand-200',
  cancelled: 'bg-rose-500/10 text-rose-700 dark:text-rose-200',
};

function OrdersPage(): JSX.Element {
  const { t, locale } = useTranslations();
  const { user, token } = useAuth();
  const isAuthenticated = Boolean(user && token);
  const { orders, status, error, refresh } = useOrders(25, { token, enabled: isAuthenticated, requireAuth: true });

  const isLoading = status === 'loading';
  const isError = status === 'error';
  const hasOrders = status === 'success' && orders.length > 0;

  return (
    <PageSection
      title={t('orders.title')}
      description={t('orders.description')}
      spacing="compact"
      actions={
        isAuthenticated ? (
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-full border border-emerald-200/70 bg-white px-4 py-2 text-sm font-semibold text-emerald-800 shadow-sm transition hover:border-emerald-400 hover:text-emerald-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-200 dark:border-emerald-800 dark:bg-slate-900 dark:text-emerald-200"
            onClick={refresh}
            disabled={isLoading}
          >
            {isLoading ? t('orders.loading') : t('orders.refresh')}
          </button>
        ) : undefined
      }
    >
      {!isAuthenticated && (
        <div className="rounded-3xl border border-emerald-100/70 bg-white/95 p-6 text-sm text-emerald-900 shadow-sm dark:border-emerald-900/60 dark:bg-slate-950/70 dark:text-emerald-100">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200">
              <ShieldCheck className="h-6 w-6" />
            </span>
            <div>
              <p className="text-lg font-semibold text-emerald-900 dark:text-brand-100">{t('orders.requireAuthTitle')}</p>
              <p className="text-sm text-slate-600 dark:text-slate-300">{t('orders.requireAuthDescription')}</p>
            </div>
          </div>
          <Link
            to="/auth/login"
            className="mt-4 inline-flex items-center justify-center rounded-full bg-gradient-to-r from-brand-500 to-brand-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:from-brand-600 hover:to-brand-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-200"
          >
            {t('orders.signInCta')}
          </Link>
        </div>
      )}

      {isAuthenticated && (
        <>
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
                const slotDetail = order.deliverySlot;
                const paymentDetail = order.paymentMethod;

                return (
                  <article
                    key={order.id}
                    className="rounded-3xl border border-emerald-100/60 bg-white/90 p-5 shadow-sm dark:border-emerald-900/60 dark:bg-slate-900/70"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-display text-lg font-semibold text-emerald-900 dark:text-brand-100">{order.id}</p>
                        <p className="text-sm text-slate-500 dark:text-slate-300">
                          {formattedDate ? t('orders.placedOn', { date: formattedDate }) : ''}
                        </p>
                      </div>
                      <span
                        className={`rounded-full border border-transparent px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wide ${badgeClass}`}
                      >
                        {statusLabel}
                      </span>
                    </div>

                    {(slotDetail || paymentDetail) && (
                      <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
                        {slotDetail && (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100/70 px-3 py-1 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200">
                            <Clock3 className="h-3.5 w-3.5" />
                            {slotDetail}
                          </span>
                        )}
                        {paymentDetail && (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-100/50 px-3 py-1 text-brand-700 dark:bg-brand-900/40 dark:text-brand-200">
                            <Wallet className="h-3.5 w-3.5" />
                            {paymentDetail}
                          </span>
                        )}
                      </div>
                    )}

                    <p className="mt-4 text-lg font-semibold text-emerald-800 dark:text-emerald-200">
                      {formatCurrency(order.totalAmount)}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-3">
                      <button
                        type="button"
                        className="rounded-full border border-emerald-200/70 bg-white px-4 py-2 text-xs font-semibold text-emerald-800 transition hover:border-emerald-400 hover:text-emerald-900 dark:border-emerald-800 dark:bg-slate-900 dark:text-emerald-200"
                      >
                        {t('orders.invoice')}
                      </button>
                      <button
                        type="button"
                        className="rounded-full bg-gradient-to-r from-brand-500 to-brand-600 px-4 py-2 text-xs font-semibold text-white shadow-soft transition hover:from-brand-600 hover:to-brand-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-200"
                      >
                        {t('orders.reorder')}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </>
      )}
    </PageSection>
  );
}

export default OrdersPage;
