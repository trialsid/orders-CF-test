import React, { useMemo, useState } from 'react';
import { CheckCircle, Navigation, Phone, Truck, Shield } from 'lucide-react';
import PageSection from '../components/PageSection';
import { StickyBottomContainer } from '../components/StickyBottomContainer';
import { RiderOrderCard } from '../components/RiderOrderCard';
import { useOrders } from '../hooks/useOrders';
import { useApiClient } from '../hooks/useApiClient';
import { getMapsUrl, getCallHref, getAdvanceMeta } from '../utils/riderUtils';
import type { OrderRecord, OrderStatus } from '../types';
import { updateOrderStatus as updateOrderStatusRequest } from '../utils/updateOrderStatus';
import { useAuth } from '../context/AuthContext';
import { StatusBadge } from '../components/StatusBadge';

const ASSIGNED_STATUSES: OrderStatus[] = ['confirmed', 'outForDelivery'];
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
            <div className="space-y-4">
              {activeOrders.map((order) => (
                <RiderOrderCard
                  key={order.id}
                  order={order}
                  isPrimary={primaryOrder?.id === order.id}
                  isUpdating={!!updating[order.id]}
                  onAdvanceStatus={handleStatusAdvance}
                />
              ))}
            </div>
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

      <StickyBottomContainer
        hidden={!primaryOrder}
        className="pb-4"
      >
          {primaryOrder ? (
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
          ) : null}
      </StickyBottomContainer>
    </>
  );
}

export default RiderPage;
