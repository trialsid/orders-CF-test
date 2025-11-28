import React, { useMemo, useState } from 'react';
import { CheckCircle, Clock, MapPin, Navigation, PackageCheck, Phone, RefreshCw, Truck, Shield, Map } from 'lucide-react';
import PageSection from '../components/PageSection';
import MobileStickyAction from '../components/MobileStickyAction';
import { useOrders } from '../hooks/useOrders';
import { useApiClient } from '../hooks/useApiClient';
import type { OrderRecord, OrderStatus } from '../types';
import { formatCurrency } from '../utils/formatCurrency';
import { updateOrderStatus as updateOrderStatusRequest } from '../utils/updateOrderStatus';
import { useAuth } from '../context/AuthContext';
import { StatusBadge } from '../components/StatusBadge';

const ASSIGNED_STATUSES: OrderStatus[] = ['confirmed', 'outForDelivery'];

const getMapsUrl = (address?: string) => {
  if (!address?.trim()) return undefined;
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`;
};

const getCallHref = (phone?: string) => (phone ? `tel:${phone}` : undefined);

const getAdvanceMeta = (order: OrderRecord): { buttonLabel: string; nextStatus: OrderStatus } => {
  if (order.status === 'confirmed') {
    return { buttonLabel: 'Start delivery', nextStatus: 'outForDelivery' };
  }
  return { buttonLabel: 'Complete delivery', nextStatus: 'delivered' };
};

const isUrgent = (order: OrderRecord) => {
  const now = Date.now();
  const createdAt = new Date(order.createdAt).getTime();
  const ageMinutes = Number.isNaN(createdAt) ? undefined : (now - createdAt) / 60000;

  let slotTime: number | undefined;
  if (order.deliverySlot) {
    const parsedSlot = new Date(order.deliverySlot);
    if (!Number.isNaN(parsedSlot.getTime())) {
      slotTime = parsedSlot.getTime();
    }
  }

  const slotPast = slotTime ? slotTime < now - 5 * 60 * 1000 : false;
  const slotVerySoon = slotTime ? slotTime - now <= 15 * 60 * 1000 : false;

  if (order.status === 'confirmed') {
    return slotPast || slotVerySoon || (ageMinutes !== undefined && ageMinutes > 20);
  }

  if (order.status === 'outForDelivery') {
    return slotPast || (ageMinutes !== undefined && ageMinutes > 90);
  }

  return false;
};

function RiderPage(): JSX.Element {
  const { token, user } = useAuth();
  const { apiFetch } = useApiClient();
  const { orders, status, error, refresh, lastUpdatedAt } = useOrders(50, {
    requireAuth: true,
    pollIntervalMs: 60000,
    onlyWhenVisible: true,
  });
  const [updating, setUpdating] = useState<Record<string, boolean>>({});
  const [statusError, setStatusError] = useState<string>();
  const primaryOrder = useMemo(() => (orders ? orders.find((order) => ASSIGNED_STATUSES.includes(order.status)) : undefined), [orders]);

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
  const primaryMapUrl = getMapsUrl(primaryOrder?.customerAddress);
  const primaryCallHref = getCallHref(primaryOrder?.customerPhone);
  const primaryAdvance = primaryOrder ? getAdvanceMeta(primaryOrder) : undefined;
  const primaryAdvanceDisabled =
    !primaryOrder || primaryOrder.status === 'delivered' || primaryOrder.status === 'cancelled' || updating[primaryOrder.id];
  const lastSyncLabel = lastUpdatedAt
    ? new Date(lastUpdatedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
    : 'Not synced yet';

  const handleStatusAdvance = async (order: OrderRecord, nextStatus: OrderStatus) => {
    setStatusError(undefined);
    setUpdating((prev) => ({ ...prev, [order.id]: true }));
    try {
      await updateOrderStatusRequest(order.id, nextStatus, token, apiFetch);
      refresh();
    } catch (updateError) {
      const message = updateError instanceof Error ? updateError.message : 'Unable to update order right now.';
      setStatusError(message);
    } finally {
      setUpdating((prev) => ({ ...prev, [order.id]: false }));
    }
  };

  const renderOrderCard = (order: OrderRecord) => {
    const { buttonLabel, nextStatus } = getAdvanceMeta(order);
    const disableAdvance = order.status === 'delivered' || order.status === 'cancelled' || updating[order.id];
    const urgent = isUrgent(order);
    const itemsLine = order.items.map((item) => `${item.name} ×${item.quantity}`).join(', ');
    const mapUrl = getMapsUrl(order.customerAddress);
    const callHref = getCallHref(order.customerPhone);
    const isPrimary = primaryOrder?.id === order.id;

    return (
      <article
        key={order.id}
        className={`rounded-3xl border border-emerald-100/70 bg-white/95 p-4 shadow-sm sm:p-5 dark:border-emerald-900/60 dark:bg-slate-950/60 ${
          isPrimary ? 'ring-2 ring-brand-500 ring-offset-2 dark:ring-offset-slate-950' : ''
        }`}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-200">{order.id}</p>
              <StatusBadge status={order.status} showIcon />
              {urgent && (
                <span className="inline-flex items-center gap-2 rounded-full bg-amber-100/80 px-3 py-1 text-xs font-semibold text-amber-900 ring-1 ring-amber-200/70 dark:bg-amber-900/40 dark:text-amber-100 dark:ring-amber-900/60">
                  <Clock className="h-3.5 w-3.5" />
                  Urgent
                </span>
              )}
            </div>
            <p className="text-lg font-semibold text-emerald-950 dark:text-brand-100">{order.customerName}</p>
            {order.customerPhone && (
              <div className="inline-flex items-center gap-1 text-sm font-semibold text-brand-600">
                <Phone className="h-4 w-4" /> {order.customerPhone}
              </div>
            )}
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
        <div className="mt-3 space-y-3 text-sm text-slate-600 dark:text-slate-300">
          <div className="flex flex-col gap-2 rounded-2xl border border-emerald-100/70 bg-emerald-50/60 p-3 dark:border-emerald-900/50 dark:bg-emerald-900/20">
            <div className="text-sm text-slate-600 dark:text-slate-300">
              <div className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 text-emerald-500" />
                <span className="flex-1">{order.customerAddress ?? 'Address missing'}</span>
                {order.customerAddress && !isPrimary && (
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.customerAddress)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded-lg bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-100 dark:hover:bg-emerald-900/60"
                  >
                    <Map className="h-3 w-3" />
                    Nav
                  </a>
                )}
              </div>
              <p className="mt-2 flex items-center gap-2 text-xs font-semibold text-slate-500">
                <PackageCheck className="h-4 w-4 text-slate-400" />
                {itemsLine || 'Items unavailable'}
              </p>
            </div>
            {!isPrimary && (
              <div className="flex flex-wrap gap-2">
                <a
                  href={mapUrl}
                  aria-disabled={!mapUrl}
                  onClick={(event) => {
                    if (!mapUrl) event.preventDefault();
                  }}
                  className={`inline-flex flex-1 items-center justify-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition sm:flex-none ${
                    mapUrl
                      ? 'border-emerald-200/70 bg-white text-emerald-800 hover:border-emerald-400 hover:text-emerald-900 dark:border-emerald-900/60 dark:bg-slate-950 dark:text-emerald-100'
                      : 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-600'
                  }`}
                >
                  <Navigation className="h-4 w-4" />
                  Navigate
                </a>
                <a
                  href={callHref}
                  aria-disabled={!callHref}
                  onClick={(event) => {
                    if (!callHref) event.preventDefault();
                  }}
                  className={`inline-flex flex-1 items-center justify-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition sm:flex-none ${
                    callHref
                      ? 'border-brand-200/70 bg-white text-brand-700 hover:border-brand-300 hover:text-brand-800 dark:border-brand-900/70 dark:bg-slate-950 dark:text-brand-100'
                      : 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-600'
                  }`}
                >
                  <Phone className="h-4 w-4" />
                  Call customer
                </a>
              </div>
            )}
          </div>
          <p className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <PackageCheck className="h-4 w-4 text-slate-400" />
            {itemsLine || 'Items unavailable'}
          </p>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-semibold">
          <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600 dark:bg-slate-800/60 dark:text-slate-200">
            {order.paymentMethod || 'Payment TBD'}
          </span>
          <StatusBadge status={order.status} showIcon />
        </div>
        {!isPrimary && (
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
        )}
        {isPrimary && (
          <p className="mt-4 text-center text-xs font-semibold italic text-brand-600 dark:text-brand-400">
            Actions for this order are available in the rider bar below ↓
          </p>
        )}
      </article>
    );
  };

  return (
    <>
      <PageSection
        title="Rider console"
        description="Grab the next delivery, call the customer, and update status as you go."
        paddingBottom={primaryOrder ? 140 : undefined}
        layout="split"
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
              <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
                Last sync: {lastSyncLabel} • Auto-syncs every ~60s while this tab is open.
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

      <MobileStickyAction
        hidden={!primaryOrder}
        label="" 
        containerClassName="pb-4"
        customMainAction={
          primaryOrder ? (
            <div className="rounded-3xl border border-slate-900/10 bg-slate-900 p-4 shadow-2xl shadow-slate-900/30 ring-1 ring-white/10 dark:bg-slate-100 dark:shadow-slate-100/10">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500">Current Stop</p>
                  <p className="text-base font-bold text-white dark:text-slate-900">{primaryOrder.customerName}</p>
                </div>
                <div className="flex items-center gap-2">
                   <StatusBadge status={primaryOrder.status} showIcon />
                </div>
              </div>
              <div className="mt-4 grid grid-cols-4 gap-2">
                 <a
                  href={primaryMapUrl}
                  onClick={(e) => !primaryMapUrl && e.preventDefault()}
                  className="flex flex-col items-center justify-center gap-1 rounded-2xl bg-slate-800 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 dark:bg-slate-200 dark:text-slate-800 dark:hover:bg-slate-300"
                >
                  <Navigation className="h-5 w-5" />
                  Nav
                </a>
                <a
                  href={primaryCallHref}
                  onClick={(e) => !primaryCallHref && e.preventDefault()}
                  className="flex flex-col items-center justify-center gap-1 rounded-2xl bg-slate-800 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 dark:bg-slate-200 dark:text-slate-800 dark:hover:bg-slate-300"
                >
                  <Phone className="h-5 w-5" />
                  Call
                </a>
                <button
                  type="button"
                  disabled={primaryAdvanceDisabled}
                  onClick={() => primaryOrder && handleStatusAdvance(primaryOrder, primaryAdvance?.nextStatus ?? 'delivered')}
                  className="col-span-2 flex items-center justify-center gap-2 rounded-2xl bg-brand-500 py-2 text-sm font-bold text-white shadow-lg shadow-brand-500/30 hover:bg-brand-600 disabled:opacity-50"
                >
                  {primaryOrder.status === 'confirmed' ? <Truck className="h-5 w-5" /> : <CheckCircle className="h-5 w-5" />}
                  {primaryAdvance?.buttonLabel ?? 'Advance'}
                </button>
              </div>
            </div>
          ) : null
        }
      />
    </>
  );
}

export default RiderPage;
