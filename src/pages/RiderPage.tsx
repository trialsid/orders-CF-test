import React, { useMemo, useState } from 'react';
import { CheckCircle, MapPin, PackageCheck, Phone, Truck, Shield } from 'lucide-react';
import PageSection from '../components/PageSection';
import { useOrders } from '../hooks/useOrders';
import type { OrderRecord, OrderStatus } from '../types';
import { formatCurrency } from '../utils/formatCurrency';
import { updateOrderStatus as updateOrderStatusRequest } from '../utils/updateOrderStatus';
import { useAuth } from '../context/AuthContext';

const ASSIGNED_STATUSES: OrderStatus[] = ['confirmed', 'outForDelivery'];

function RiderPage(): JSX.Element {
  const { token, user } = useAuth();
  const { orders, status, error, refresh } = useOrders(50, { token, requireAuth: true });
  const [updating, setUpdating] = useState<Record<string, boolean>>({});
  const [statusError, setStatusError] = useState<string>();

  const activeOrders = useMemo(
    () =>
      orders
        .filter((order) => ASSIGNED_STATUSES.includes(order.status))
        .sort((a, b) => new Date(a.deliverySlot ?? a.createdAt).getTime() - new Date(b.deliverySlot ?? b.createdAt).getTime()),
    [orders]
  );

  const backlogOrders = useMemo(
    () =>
      orders
        .filter((order) => order.status === 'pending')
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
    [orders]
  );

  const handleStatusAdvance = async (order: OrderRecord, nextStatus: OrderStatus) => {
    setStatusError(undefined);
    setUpdating((prev) => ({ ...prev, [order.id]: true }));
    try {
      await updateOrderStatusRequest(order.id, nextStatus, token);
      refresh();
    } catch (updateError) {
      const message = updateError instanceof Error ? updateError.message : 'Unable to update order right now.';
      setStatusError(message);
    } finally {
      setUpdating((prev) => ({ ...prev, [order.id]: false }));
    }
  };

  const renderOrderCard = (order: OrderRecord) => {
    const buttonLabel = order.status === 'confirmed' ? 'Start delivery' : 'Complete delivery';
    const nextStatus: OrderStatus = order.status === 'confirmed' ? 'outForDelivery' : 'delivered';
    const disableAdvance = order.status === 'delivered' || updating[order.id];
    const itemsLine = order.items.map((item) => `${item.name} ×${item.quantity}`).join(', ');

    return (
      <article
        key={order.id}
        className="rounded-3xl border border-emerald-100/70 bg-white/95 p-4 shadow-sm sm:p-5 dark:border-emerald-900/60 dark:bg-slate-950/60"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-200">{order.id}</p>
            <p className="text-lg font-semibold text-emerald-950 dark:text-brand-100">{order.customerName}</p>
            <a href={`tel:${order.customerPhone ?? ''}`} className="mt-1 inline-flex items-center gap-1 text-sm text-brand-600">
              <Phone className="h-4 w-4" /> {order.customerPhone ?? 'Phone missing'}
            </a>
          </div>
          <div className="text-right">
            <p className="font-display text-xl font-semibold text-emerald-900 dark:text-emerald-100">
              {formatCurrency(order.totalAmount)}
            </p>
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-500 dark:text-emerald-200">
              {order.deliverySlot ?? 'Slot pending'}
            </p>
          </div>
        </div>
        <div className="mt-3 text-sm text-slate-600 dark:text-slate-300">
          <p className="flex items-start gap-2">
            <MapPin className="mt-0.5 h-4 w-4 text-emerald-500" />
            <span>{order.customerAddress ?? 'Address missing'}</span>
          </p>
          <p className="mt-2 flex items-center gap-2 text-xs font-semibold text-slate-500">
            <PackageCheck className="h-4 w-4 text-slate-400" />
            {itemsLine || 'Items unavailable'}
          </p>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-semibold">
          <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600 dark:bg-slate-800/60 dark:text-slate-200">
            {order.paymentMethod || 'Payment TBD'}
          </span>
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-100">
            {order.status}
          </span>
        </div>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <button
            type="button"
            onClick={() => handleStatusAdvance(order, nextStatus)}
            disabled={disableAdvance}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-brand-500 to-brand-600 px-4 py-2 text-sm font-semibold text-white shadow transition hover:from-brand-600 hover:to-brand-700 disabled:opacity-60 sm:flex-1"
          >
            {order.status === 'confirmed' ? <Truck className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
            {buttonLabel}
          </button>
          <button
            type="button"
            onClick={refresh}
            className="inline-flex w-full items-center justify-center rounded-full border border-emerald-200/70 bg-white px-4 py-2 text-sm font-semibold text-emerald-800 shadow-sm transition hover:border-emerald-400 hover:text-emerald-900 dark:border-emerald-900/60 dark:bg-slate-950 dark:text-emerald-200 sm:w-auto"
          >
            Sync
          </button>
        </div>
      </article>
    );
  };

  return (
    <PageSection
      title="Rider console"
      description="Grab the next delivery, call the customer, and update status as you go."
      actions={
        <div className="flex flex-wrap items-center gap-3">
          {user && (
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200/70 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-900/30 dark:text-emerald-100">
              <Shield className="h-4 w-4" /> {(user.fullName ?? user.displayName ?? user.phone) ?? ''} • {user.role}
            </span>
          )}
          <button
            type="button"
            onClick={refresh}
            className="inline-flex items-center gap-2 rounded-full border border-emerald-200/70 bg-white px-4 py-2 text-sm font-semibold text-emerald-800 shadow-sm transition hover:border-emerald-400 hover:text-emerald-900 dark:border-emerald-900/60 dark:bg-slate-950 dark:text-emerald-200"
            disabled={status === 'loading'}
          >
            {status === 'loading' ? 'Refreshing…' : 'Refresh feed'}
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        {statusError && (
          <div className="rounded-2xl border border-rose-200/70 bg-rose-50/70 p-4 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-900/30 dark:text-rose-100">
            {statusError}
          </div>
        )}

        {status === 'error' && (
          <div className="rounded-2xl border border-rose-200/70 bg-rose-50/70 p-4 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-900/30 dark:text-rose-100">
            {error ?? 'Unable to load rider data right now.'}
          </div>
        )}

        <section className="space-y-4">
          <header>
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-200">Today&apos;s queue</p>
            <p className="text-lg font-semibold text-emerald-950 dark:text-brand-100">
              {activeOrders.length ? `${activeOrders.length} delivery stops` : 'No assigned orders yet'}
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Orders move here when staff confirms the slot. Hit “Start delivery” once you leave the store.
            </p>
          </header>
          {status === 'loading' && (
            <p className="rounded-2xl border border-dashed border-emerald-200/70 p-4 text-sm text-slate-500 dark:border-emerald-900/60 dark:text-slate-300">
              Loading assigned orders…
            </p>
          )}
          {!activeOrders.length && status === 'success' && (
            <p className="rounded-2xl border border-dashed border-emerald-200/70 p-4 text-sm text-slate-500 dark:border-emerald-900/60 dark:text-slate-300">
              Nothing on your route right now. Pull to refresh when dispatch assigns more.
            </p>
          )}
          <div className="space-y-4">{activeOrders.map((order) => renderOrderCard(order))}</div>
        </section>

        {backlogOrders.length > 0 && (
          <section className="rounded-3xl border border-amber-200/70 bg-amber-50/50 p-5 text-sm text-amber-900 dark:border-amber-900/60 dark:bg-amber-900/20 dark:text-amber-100">
            <p className="text-xs font-semibold uppercase tracking-wide">Waiting confirmation</p>
            <p className="mt-2 font-semibold">{backlogOrders.length} order(s) still pending approval.</p>
            <p className="mt-1 text-amber-800/80 dark:text-amber-100/80">
              Dispatch will move them into your queue once slots and payments are verified.
            </p>
          </section>
        )}
      </div>
    </PageSection>
  );
}

export default RiderPage;
