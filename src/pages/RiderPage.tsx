import React, { useMemo, useState, useRef, useEffect } from 'react';
import { CheckCircle, Navigation, Phone, Truck, Shield, Wallet, Banknote, History, Package } from 'lucide-react';
import PageSection from '../components/PageSection';
import { StickyBottomContainer } from '../components/StickyBottomContainer';
import { RiderOrderCard } from '../components/RiderOrderCard';
import { DeliveryConfirmationModal } from '../components/DeliveryConfirmationModal';
import { useOrders } from '../hooks/useOrders';
import { useApiClient } from '../hooks/useApiClient';
import { getMapsUrl, getCallHref, getAdvanceMeta, isUrgent } from '../utils/riderUtils';
import type { OrderRecord, OrderStatus } from '../types';
import { updateOrderStatus as updateOrderStatusRequest } from '../utils/updateOrderStatus';
import { useAuth } from '../context/AuthContext';
import { StatusBadge } from '../components/StatusBadge';
import { formatCurrency } from '../utils/formatCurrency';

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
  const [confirmingOrder, setConfirmingOrder] = useState<OrderRecord | null>(null);
  const [currentTab, setCurrentTab] = useState<'deliveries' | 'wallet'>('deliveries');
  
  // Intersection Observer State for Sticky Bar
  const [isPrimaryVisible, setIsPrimaryVisible] = useState(true);
  const primaryCardRef = useRef<HTMLDivElement>(null);

  // 1. Active Orders Logic (Deliveries Tab)
  const activeOrders = useMemo(
    () =>
      orders
        .filter((order) => ASSIGNED_STATUSES.includes(order.status))
        .sort((a, b) => {
           // A. Active (Out for Delivery) always first
           if (a.status === 'outForDelivery' && b.status !== 'outForDelivery') return -1;
           if (a.status !== 'outForDelivery' && b.status === 'outForDelivery') return 1;

           // B. Urgent orders next
           const aUrgent = isUrgent(a);
           const bUrgent = isUrgent(b);
           if (aUrgent && !bUrgent) return -1;
           if (!aUrgent && bUrgent) return 1;

           // C. Time Slot / Creation Time
           return new Date(a.deliverySlot ?? a.createdAt).getTime() - new Date(b.deliverySlot ?? b.createdAt).getTime();
        }),
    [orders]
  );

  const primaryOrder = useMemo(() => activeOrders[0], [activeOrders]);

  // Observer Logic
  useEffect(() => {
    if (currentTab !== 'deliveries' || !primaryOrder?.id || !primaryCardRef.current) {
      setIsPrimaryVisible(true); // Assume primary card is visible, so sticky bar should be hidden
      return; 
    }

    const observer = new IntersectionObserver(
        ([entry]) => {
        setIsPrimaryVisible(entry.isIntersecting);
        },
        { threshold: 0.1 } 
    );

    observer.observe(primaryCardRef.current);

    return () => observer.disconnect();
  }, [primaryOrder?.id, currentTab]);

  const backlogOrders = useMemo(
    () =>
      orders
        .filter((order) => order.status === 'pending')
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
    [orders]
  );

  // 2. Wallet/History Logic (Wallet Tab)
  const deliveredOrders = useMemo(
    () =>
      orders
        .filter((order) => order.status === 'delivered')
        .sort((a, b) => new Date(b.updatedAt ?? b.createdAt).getTime() - new Date(a.updatedAt ?? a.createdAt).getTime()),
    [orders]
  );

  const stats = useMemo(() => {
    const totalDelivered = deliveredOrders.length;
    const cashCollected = deliveredOrders.reduce((sum, order) => {
      const isCod = order.paymentMethod?.toLowerCase() === 'cod' || order.paymentMethod?.toLowerCase() === 'cash';
      return isCod ? sum + order.totalAmount : sum;
    }, 0);
    return { totalDelivered, cashCollected };
  }, [deliveredOrders]);

  // 3. Helpers
  const primaryMapUrl = getMapsUrl(primaryOrder?.customerAddress);
  const primaryCallHref = getCallHref(primaryOrder?.customerPhone);
  const primaryAdvance = primaryOrder ? getAdvanceMeta(primaryOrder) : undefined;
  const primaryAdvanceDisabled =
    !primaryOrder || primaryOrder.status === 'delivered' || primaryOrder.status === 'cancelled' || updating[primaryOrder.id];
  const lastSyncLabel = lastUpdatedAt
    ? new Date(lastUpdatedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
    : 'Not synced yet';

  const handleStatusAdvance = async (order: OrderRecord, nextStatus: OrderStatus) => {
    if (nextStatus === 'delivered') {
        setConfirmingOrder(order);
        return;
    }

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

  const handleConfirmDelivery = async () => {
    if (!confirmingOrder) return;
    
    setStatusError(undefined);
    setUpdating((prev) => ({ ...prev, [confirmingOrder.id]: true }));
    try {
        await updateOrderStatusRequest(confirmingOrder.id, 'delivered', token, apiFetch);
        refresh();
        setConfirmingOrder(null);
    } catch (updateError) {
        const message = updateError instanceof Error ? updateError.message : 'Unable to complete delivery.';
        setStatusError(message);
    } finally {
        setUpdating((prev) => ({ ...prev, [confirmingOrder.id]: false }));
    }
  };

  const handleMakeActive = async (targetOrder: OrderRecord) => {
    setStatusError(undefined);
    const currentActive = orders.find((o) => o.status === 'outForDelivery');

    if (currentActive?.id === targetOrder.id) {
      return;
    }

    setUpdating((prev) => ({ ...prev, [targetOrder.id]: true, ...(currentActive ? { [currentActive.id]: true } : {}) }));
    let downgradedCurrent = false;

    try {
      if (currentActive && currentActive.id !== targetOrder.id) {
        await updateOrderStatusRequest(currentActive.id, 'confirmed', token, apiFetch);
        downgradedCurrent = true;
      }
      if (targetOrder.status !== 'outForDelivery') {
        await updateOrderStatusRequest(targetOrder.id, 'outForDelivery', token, apiFetch);
      }
      refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to switch active order.';
      setStatusError(message);
      if (downgradedCurrent && currentActive && currentActive.id !== targetOrder.id) {
        try { await updateOrderStatusRequest(currentActive.id, 'outForDelivery', token, apiFetch); } catch {}
      }
    } finally {
      setUpdating((prev) => ({ ...prev, [targetOrder.id]: false, ...(currentActive ? { [currentActive.id]: false } : {}) }));
    }
  };

  return (
    <>
      <PageSection
        title="Rider Console"
        paddingBottom={primaryOrder && currentTab === 'deliveries' ? 140 : undefined}
        layout="split"
        actions={
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
             {/* Tab Switcher */}
            <div className="flex items-center rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
              <button
                onClick={() => setCurrentTab('deliveries')}
                className={`flex flex-1 items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold transition sm:flex-initial ${
                  currentTab === 'deliveries'
                    ? 'bg-white text-emerald-700 shadow-sm dark:bg-slate-700 dark:text-emerald-400'
                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                <Truck className="h-4 w-4" />
                Deliveries
              </button>
              <button
                onClick={() => setCurrentTab('wallet')}
                className={`flex flex-1 items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold transition sm:flex-initial ${
                  currentTab === 'wallet'
                    ? 'bg-white text-emerald-700 shadow-sm dark:bg-slate-700 dark:text-emerald-400'
                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                <Wallet className="h-4 w-4" />
                Wallet
              </button>
            </div>
            
            {/* Identity & Refresh */}
            <div className="flex items-center justify-between gap-3 sm:justify-start">
                {user && (
                <span className="hidden items-center gap-2 rounded-full border border-emerald-200/70 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-900/30 dark:text-emerald-100 sm:inline-flex">
                    <Shield className="h-4 w-4" /> {(user.fullName ?? user.displayName ?? user.phone) ?? ''}
                </span>
                )}
                <button
                type="button"
                onClick={refresh}
                className="inline-flex items-center gap-2 rounded-full border border-emerald-200/70 bg-white px-4 py-2 text-xs font-bold text-emerald-800 shadow-sm transition hover:border-emerald-400 hover:text-emerald-900 dark:border-emerald-900/60 dark:bg-slate-950 dark:text-emerald-200"
                disabled={status === 'loading'}
                >
                {status === 'loading' ? 'Refreshing…' : 'Refresh'}
                </button>
            </div>
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

          {/* TAB 1: DELIVERIES */}
          {currentTab === 'deliveries' && (
            <>
                <section className="space-y-4">
                    <header className="flex items-end justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Active Queue</p>
                        <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-slate-900 dark:text-white">
                            {activeOrders.length}
                        </span>
                        <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                            Stops Remaining
                        </span>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500">
                            Synced: {lastSyncLabel}
                        </p>
                    </div>
                    </header>

                    {status === 'loading' && !activeOrders.length && (
                    <div className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                        <div className="animate-pulse">Loading route...</div>
                    </div>
                    )}

                    {!activeOrders.length && status === 'success' && (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 py-12 text-center dark:border-slate-800 dark:bg-slate-900/50">
                        <Truck className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-600" />
                        <p className="mt-3 text-sm font-medium text-slate-900 dark:text-white">All caught up!</p>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        New orders will appear here when assigned.
                        </p>
                    </div>
                    )}

                    <div className="space-y-4">
                    {activeOrders.map((order, index) => (
                        <div key={order.id} ref={index === 0 ? primaryCardRef : undefined}>
                            <RiderOrderCard
                                order={order}
                                isPrimary={order.status === 'outForDelivery'}
                                isUpdating={!!updating[order.id]}
                                onAdvanceStatus={handleStatusAdvance}
                                onMakeActive={handleMakeActive}
                            />
                        </div>
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
            </>
          )}

          {/* TAB 2: WALLET & HISTORY */}
          {currentTab === 'wallet' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                 {/* Stats Cards */}
                 <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-3xl border border-emerald-100 bg-emerald-50/50 p-5 dark:border-emerald-900 dark:bg-emerald-900/20">
                        <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-800 dark:text-emerald-300">
                             <Banknote className="h-5 w-5" />
                        </div>
                        <p className="text-xs font-bold uppercase tracking-wider text-emerald-800/70 dark:text-emerald-200/70">Cash Collected</p>
                        <p className="mt-1 text-2xl font-bold text-emerald-900 dark:text-emerald-100">{formatCurrency(stats.cashCollected)}</p>
                    </div>
                    <div className="rounded-3xl border border-blue-100 bg-blue-50/50 p-5 dark:border-blue-900 dark:bg-blue-900/20">
                        <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-800 dark:text-blue-300">
                             <Package className="h-5 w-5" />
                        </div>
                        <p className="text-xs font-bold uppercase tracking-wider text-blue-800/70 dark:text-blue-200/70">Delivered</p>
                        <p className="mt-1 text-2xl font-bold text-blue-900 dark:text-blue-100">{stats.totalDelivered}</p>
                    </div>
                 </div>

                 {/* History List */}
                 <section>
                    <h3 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-500">
                        <History className="h-4 w-4" /> Today's History
                    </h3>
                    <div className="space-y-3">
                        {deliveredOrders.length === 0 ? (
                             <div className="rounded-2xl border border-dashed border-slate-200 py-8 text-center text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400">
                                No completed deliveries yet.
                             </div>
                        ) : (
                            deliveredOrders.map(order => (
                                <div key={order.id} className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
                                     <div>
                                         <p className="font-bold text-slate-900 dark:text-white">{order.customerName}</p>
                                         <p className="text-xs text-slate-500">#{order.id.slice(-4)} • {new Date(order.updatedAt || order.createdAt).toLocaleTimeString([], {hour: 'numeric', minute:'2-digit'})}</p>
                                     </div>
                                     <div className="text-right">
                                         <p className="font-bold text-slate-900 dark:text-white">{formatCurrency(order.totalAmount)}</p>
                                         <p className="text-xs font-medium uppercase text-emerald-600 dark:text-emerald-400">Delivered</p>
                                     </div>
                                </div>
                            ))
                        )}
                    </div>
                 </section>
              </div>
          )}
        </div>
      </PageSection>

      {/* Sticky Bottom Actions only for Deliveries Tab */}
      {currentTab === 'deliveries' && (
        <StickyBottomContainer
            hidden={!primaryOrder}
            className={`pb-4 transition-transform duration-300 ease-in-out ${isPrimaryVisible ? 'translate-y-[120%]' : 'translate-y-0'}`}
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
      )}
      
      <DeliveryConfirmationModal
        isOpen={!!confirmingOrder}
        order={confirmingOrder}
        onConfirm={handleConfirmDelivery}
        onCancel={() => setConfirmingOrder(null)}
        isUpdating={confirmingOrder ? !!updating[confirmingOrder.id] : false}
      />
    </>
  );
}

export default RiderPage;
