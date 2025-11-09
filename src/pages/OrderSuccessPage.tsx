import React, { useEffect, useRef } from 'react';
import { Navigate, Link, useLocation, useOutletContext } from 'react-router-dom';
import { CheckCircle2, ArrowRight, ShoppingBag, ClipboardList } from 'lucide-react';
import PageSection from '../components/PageSection';
import { useTranslations } from '../i18n/i18n';
import { formatCurrency } from '../utils/formatCurrency';
import type { OrderResponse } from '../types';
import type { AppOutletContext } from '../layouts/MainLayout';

function OrderSuccessPage(): JSX.Element {
  const location = useLocation();
  const state = location.state as { order?: OrderResponse } | null;
  const { t } = useTranslations();
  const { cart, resetCheckoutDraft } = useOutletContext<AppOutletContext>();
  const clearCartRef = useRef(cart.clearCart);

  useEffect(() => {
    clearCartRef.current = cart.clearCart;
  }, [cart]);

  useEffect(() => {
    clearCartRef.current();
    resetCheckoutDraft();
  }, [resetCheckoutDraft]);

  const order = state?.order;

  if (!order) {
    return <Navigate to="/orders" replace />;
  }

  const orderId = order.orderId;
  const summary = order.summary;
  const items = summary?.items ?? [];
  const total = summary?.total ?? 0;
  const customerName = summary?.customer.name;
  const slot = summary?.delivery?.slot;
  const paymentMethod = summary?.payment?.method;

  return (
    <PageSection
      title={t('checkout.success.title')}
      description={t('checkout.success.description')}
      introClassName="text-left sm:text-center"
      spacing="compact"
    >
      <div className="space-y-8">
        <div className="rounded-3xl border border-emerald-200/70 bg-white/95 p-6 shadow-lg shadow-brand-900/10 dark:border-emerald-900/60 dark:bg-slate-900/70">
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-brand-500 to-brand-600 text-white shadow-soft">
              <CheckCircle2 className="h-6 w-6" />
            </span>
            <div className="space-y-1">
              <p className="text-sm font-semibold uppercase tracking-wide text-brand-600 dark:text-brand-300">
                {t('checkout.success.queued')}
              </p>
              {orderId && (
                <p className="text-lg font-semibold text-emerald-900 dark:text-brand-100">
                  {t('checkout.success.reference', { orderId })}
                </p>
              )}
              {customerName && (
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  {t('checkout.success.customer', { name: customerName })}
                </p>
              )}
            </div>
          </div>

          <dl className="mt-6 grid gap-3 text-sm text-slate-600 dark:text-slate-300 sm:grid-cols-2">
            {slot && (
              <div>
                <dt className="font-semibold text-emerald-900 dark:text-emerald-200">{t('checkout.review.slot')}</dt>
                <dd>{slot}</dd>
              </div>
            )}
            {paymentMethod && (
              <div>
                <dt className="font-semibold text-emerald-900 dark:text-emerald-200">{t('checkout.review.payment')}</dt>
                <dd>{paymentMethod}</dd>
              </div>
            )}
          </dl>

          <div className="mt-6 space-y-4">
            <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-brand-600 dark:text-brand-300">
              <ClipboardList className="h-4 w-4" />
              {t('checkout.review.basketTitle')}
            </h3>
            <ul className="space-y-3 text-sm text-emerald-900 dark:text-emerald-100">
              {items.map((item) => (
                <li key={item.id} className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-semibold">{item.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {item.quantity} × {formatCurrency(item.unitPrice)}
                    </p>
                  </div>
                  <span className="font-semibold">{formatCurrency(item.lineTotal)}</span>
                </li>
              ))}
              {!items.length && (
                <li className="text-xs text-slate-500 dark:text-slate-400">
                  {t('checkout.review.emptyCart')}
                </li>
              )}
            </ul>
            <div className="flex items-center justify-between border-t border-emerald-100 pt-4 text-base font-semibold text-emerald-900 dark:border-emerald-900 dark:text-brand-100">
              <span>{t('checkout.review.total')}</span>
              <span>{formatCurrency(total)}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            to="/orders"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-brand-500 to-brand-600 px-5 py-3 text-sm font-semibold text-white shadow-soft transition hover:from-brand-600 hover:to-brand-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-200"
          >
            <ClipboardList className="h-4 w-4" />
            {t('checkout.success.trackOrder')}
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            to="/browse"
            className="inline-flex items-center justify-center gap-2 rounded-full border border-emerald-200/70 bg-white px-5 py-3 text-sm font-semibold text-emerald-800 transition hover:border-emerald-400 hover:text-emerald-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-200 dark:border-emerald-800 dark:bg-slate-900 dark:text-emerald-200"
          >
            <ShoppingBag className="h-4 w-4" />
            {t('checkout.success.newOrder')}
          </Link>
        </div>
      </div>
    </PageSection>
  );
}

export default OrderSuccessPage;
