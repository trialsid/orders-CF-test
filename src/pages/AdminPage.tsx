import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, ClipboardList, RefreshCw, Settings2, Truck, Users, ShieldCheck } from 'lucide-react';
import PageSection from '../components/PageSection';
import { useOrders } from '../hooks/useOrders';
import { useAdminConfig } from '../hooks/useAdminConfig';
import { formatCurrency } from '../utils/formatCurrency';
import { updateOrderStatus as updateOrderStatusRequest } from '../utils/updateOrderStatus';
import type { AdminConfig, OrderRecord, OrderStatus } from '../types';
import { useAuth } from '../context/AuthContext';

const DEFAULT_STATUS: OrderStatus = 'pending';

const STATUS_PIPELINE: Array<{ key: OrderStatus; label: string; description: string }> = [
  { key: 'pending', label: 'Pending confirmation', description: 'Verify slot, address, and payment preference.' },
  { key: 'confirmed', label: 'Picking & packing', description: 'Move the cart to the store floor team.' },
  { key: 'outForDelivery', label: 'Out for delivery', description: 'Assign a rider and share ETA updates.' },
  { key: 'delivered', label: 'Delivered', description: 'Close the order once the customer confirms drop-off.' },
];

const ORDER_STATUS_OPTIONS: Array<{ value: OrderStatus; label: string }> = [
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'outForDelivery', label: 'Out for delivery' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
];

const NEXT_ACTION_COPY: Partial<Record<OrderStatus, string>> = {
  pending: 'Call customer to lock slot',
  confirmed: 'Stage items for dispatch',
  outForDelivery: 'Track rider progress',
};

const ATTENTION_STATUSES = new Set<OrderStatus>(['pending', 'confirmed']);

const CONFIG_FIELD_META: Array<{ key: keyof AdminConfig; label: string; helper: string }> = [
  {
    key: 'minimumOrderAmount',
    label: 'Minimum order',
    helper: 'Orders below this amount are blocked.',
  },
  {
    key: 'freeDeliveryThreshold',
    label: 'Free delivery threshold',
    helper: 'Orders above this value avoid the delivery fee.',
  },
  {
    key: 'deliveryFeeBelowThreshold',
    label: 'Delivery fee',
    helper: 'Applied when the total is below the threshold.',
  },
];

const formatDateTime = (iso?: string): string => {
  if (!iso) {
    return 'Not timestamped';
  }
  const parsed = Number.isNaN(Date.parse(iso)) ? undefined : new Date(iso);
  return parsed ? parsed.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : 'Not timestamped';
};

const getTimeValue = (iso?: string): number => {
  if (!iso) {
    return 0;
  }
  const ms = Date.parse(iso);
  return Number.isNaN(ms) ? 0 : ms;
};

const isOrderStatus = (value: unknown): value is OrderStatus =>
  typeof value === 'string' && ORDER_STATUS_OPTIONS.some((option) => option.value === value);

const resolveStatus = (status?: string): OrderStatus => (isOrderStatus(status) ? status : DEFAULT_STATUS);

const getStatusLabel = (status: OrderStatus): string =>
  ORDER_STATUS_OPTIONS.find((option) => option.value === status)?.label ?? status;

function AdminPage(): JSX.Element {
  const { token, user } = useAuth();
  const { orders, status, error, refresh } = useOrders(100, { token, requireAuth: true });
  const {
    config,
    status: configStatus,
    error: configError,
    refresh: refreshConfig,
    saveConfig,
    saving,
  } = useAdminConfig(token ?? undefined);

  const [configFields, setConfigFields] = useState<Record<keyof AdminConfig, string>>({
    minimumOrderAmount: '100',
    freeDeliveryThreshold: '299',
    deliveryFeeBelowThreshold: '15',
  });
  const [configBanner, setConfigBanner] = useState<{ type: 'success' | 'error'; message: string }>();
  const [statusUpdateError, setStatusUpdateError] = useState<string>();
  const [updatingOrders, setUpdatingOrders] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (config) {
      setConfigFields({
        minimumOrderAmount: String(config.minimumOrderAmount),
        freeDeliveryThreshold: String(config.freeDeliveryThreshold),
        deliveryFeeBelowThreshold: String(config.deliveryFeeBelowThreshold),
      });
    }
  }, [config]);

  const handleConfigFieldChange = (key: keyof AdminConfig, value: string) => {
    setConfigBanner(undefined);
    setConfigFields((prev) => ({ ...prev, [key]: value }));
  };

  const handleConfigSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setConfigBanner(undefined);

    const parsedEntries: Partial<AdminConfig> = {};
    for (const meta of CONFIG_FIELD_META) {
      const rawValue = configFields[meta.key]?.trim();
      const parsed = Number(rawValue);
      if (!Number.isFinite(parsed) || parsed < 0) {
        setConfigBanner({ type: 'error', message: `Invalid value for ${meta.label}.` });
        return;
      }
      parsedEntries[meta.key] = parsed;
    }

    try {
      await saveConfig(parsedEntries as AdminConfig);
      setConfigBanner({ type: 'success', message: 'Configuration saved.' });
      refresh();
      refreshConfig();
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : 'Unable to save configuration right now.';
      setConfigBanner({ type: 'error', message });
    }
  };

  const handleConfigReset = () => {
    if (config) {
      setConfigFields({
        minimumOrderAmount: String(config.minimumOrderAmount),
        freeDeliveryThreshold: String(config.freeDeliveryThreshold),
        deliveryFeeBelowThreshold: String(config.deliveryFeeBelowThreshold),
      });
    }
    setConfigBanner(undefined);
    refreshConfig();
  };

  const handleStatusChange = async (orderId: string, nextStatus: OrderStatus) => {
    setStatusUpdateError(undefined);
    setUpdatingOrders((prev) => ({ ...prev, [orderId]: true }));
    try {
      await updateOrderStatusRequest(orderId, nextStatus, token);
      refresh();
    } catch (updateError) {
      const message = updateError instanceof Error ? updateError.message : 'Unable to update order status right now.';
      setStatusUpdateError(message);
    } finally {
      setUpdatingOrders((prev) => ({ ...prev, [orderId]: false }));
    }
  };

  const isLoadingOrders = status === 'loading';
  const isOrdersError = status === 'error';

  const derivedMetrics = useMemo(() => {
    if (!orders.length) {
      return {
        ordersToday: 0,
        revenueToday: 0,
        totalRevenue: 0,
        openOrders: 0,
        avgTicket: 0,
        uniqueCustomers: 0,
      };
    }

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    let ordersToday = 0;
    let revenueToday = 0;
    let totalRevenue = 0;
    let openOrders = 0;
    const customers = new Set<string>();

    orders.forEach((order) => {
      const amount = order.totalAmount ?? 0;
      totalRevenue += amount;

      const orderTime = getTimeValue(order.createdAt);
      if (orderTime >= startOfToday.getTime()) {
        ordersToday += 1;
        revenueToday += amount;
      }

      const statusKey = resolveStatus(order.status);
      if (!['delivered', 'cancelled'].includes(statusKey)) {
        openOrders += 1;
      }

      if (order.customerPhone) {
        customers.add(order.customerPhone);
      } else if (order.customerName) {
        customers.add(order.customerName);
      }
    });

    const avgTicket = orders.length ? totalRevenue / orders.length : 0;

    return {
      ordersToday,
      revenueToday,
      totalRevenue,
      openOrders,
      avgTicket,
      uniqueCustomers: customers.size,
    };
  }, [orders]);

  const pipelineStats = useMemo(
    () =>
      STATUS_PIPELINE.map((stage) => ({
        ...stage,
        count: orders.filter((order) => resolveStatus(order.status) === stage.key).length,
      })),
    [orders]
  );

  const actionableOrders = useMemo(() => {
    return orders
      .filter((order) => ATTENTION_STATUSES.has(resolveStatus(order.status)))
      .sort((a, b) => getTimeValue(b.createdAt) - getTimeValue(a.createdAt))
      .slice(0, 5);
  }, [orders]);

  const recentOrders = useMemo(() => {
    return [...orders]
      .sort((a, b) => getTimeValue(b.createdAt) - getTimeValue(a.createdAt))
      .slice(0, 6);
  }, [orders]);

  const slotInsights = useMemo(() => {
    const counts: Record<string, number> = {};
    orders.forEach((order) => {
      if (order.deliverySlot) {
        counts[order.deliverySlot] = (counts[order.deliverySlot] ?? 0) + 1;
      }
    });
    const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    return {
      topSlot: entries[0],
      others: entries.slice(1, 3),
      hasData: entries.length > 0,
    };
  }, [orders]);

  const summaryCards = [
    {
      label: 'Orders today',
      value: derivedMetrics.ordersToday.toString(),
      helper: `${formatCurrency(derivedMetrics.revenueToday)} value`,
    },
    {
      label: 'Open orders',
      value: derivedMetrics.openOrders.toString(),
      helper: 'Pending confirmation or dispatch',
    },
    {
      label: 'Average ticket',
      value: formatCurrency(derivedMetrics.avgTicket || 0),
      helper: `${derivedMetrics.uniqueCustomers} active customers`,
    },
    {
      label: 'Revenue (all time)',
      value: formatCurrency(derivedMetrics.totalRevenue || 0),
      helper: 'Pulled from the latest 100 orders',
    },
  ];

  const renderOrderRow = (order: OrderRecord) => {
    const statusKey = resolveStatus(order.status);
    const nextAction = NEXT_ACTION_COPY[statusKey];
    const isUpdating = Boolean(updatingOrders[order.id]);

    return (
      <li
        key={order.id}
        className="rounded-2xl border border-emerald-100/70 bg-white/90 p-4 shadow-sm dark:border-emerald-900/60 dark:bg-slate-900/70"
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-200">{order.id}</p>
            <p className="text-base font-semibold text-emerald-950 dark:text-brand-100">{order.customerName || 'Customer'}</p>
            <p className="text-sm text-slate-500 dark:text-slate-300">{order.customerPhone || 'Phone unavailable'}</p>
          </div>
          <div className="text-right">
            <p className="font-display text-lg font-semibold text-emerald-800 dark:text-emerald-100">
              {formatCurrency(order.totalAmount)}
            </p>
            {order.deliverySlot && (
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-500 dark:text-emerald-200">
                {order.deliverySlot}
              </p>
            )}
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs font-semibold">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100/70 px-3 py-1 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-100">
            <ClipboardList className="h-3.5 w-3.5" />
            {getStatusLabel(statusKey)}
          </span>
          {nextAction && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-500/10 px-3 py-1 text-brand-600 dark:text-brand-300">
              <Truck className="h-3.5 w-3.5" />
              {nextAction}
            </span>
          )}
          {order.paymentMethod && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-slate-600 dark:bg-slate-800/60 dark:text-slate-200">
              {order.paymentMethod}
            </span>
          )}
          <label className="inline-flex items-center gap-2 rounded-full border border-emerald-100/70 bg-white px-2 py-1 text-slate-600 dark:border-emerald-900/60 dark:bg-slate-950/50">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Set status</span>
            <select
              value={statusKey}
              onChange={(event) => handleStatusChange(order.id, event.target.value as OrderStatus)}
              disabled={isUpdating}
              className="rounded-full border-none bg-transparent text-sm font-semibold text-emerald-800 outline-none disabled:opacity-50 dark:text-emerald-100"
            >
              {ORDER_STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-300">{formatDateTime(order.createdAt)}</p>
      </li>
    );
  };

  return (
    <PageSection
      title="Operations control center"
      description="Monitor live orders, keep delivery economics front-and-center, and stage future tools for staff access."
      actions={
        <div className="flex flex-wrap items-center gap-3">
          {user && (
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200/70 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-900/40 dark:text-emerald-100">
              <ShieldCheck className="h-4 w-4" /> {(user.fullName ?? user.displayName ?? user.phone) ?? ''} • {user.role}
            </span>
          )}
          <button
            type="button"
            onClick={refresh}
            disabled={isLoadingOrders}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-emerald-200/70 bg-white px-4 py-2 text-sm font-semibold text-emerald-800 shadow-sm transition hover:border-emerald-400 hover:text-emerald-900 disabled:opacity-60 sm:w-auto dark:border-emerald-800 dark:bg-slate-900 dark:text-emerald-200"
          >
            <RefreshCw className="h-4 w-4" />
            {isLoadingOrders ? 'Refreshing…' : 'Refresh data'}
          </button>
        </div>
      }
    >
      <div className="space-y-8">
        {isOrdersError && (
          <div className="rounded-3xl border border-rose-200/60 bg-rose-50/80 p-6 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-900/30 dark:text-rose-100">
            <p className="font-semibold">{error ?? 'Unable to load admin data right now.'}</p>
            <p className="mt-1 text-rose-600/80">Retry in a few seconds or confirm the Cloudflare function is up.</p>
          </div>
        )}

        {statusUpdateError && (
          <div className="rounded-2xl border border-amber-200/60 bg-amber-50/80 p-4 text-sm text-amber-800 dark:border-amber-900/50 dark:bg-amber-900/40 dark:text-amber-100">
            {statusUpdateError}
          </div>
        )}

        <div className={`grid gap-4 sm:grid-cols-2 xl:grid-cols-4 ${isLoadingOrders ? 'opacity-70' : ''}`}>
          {summaryCards.map((card) => (
            <div
              key={card.label}
              className="rounded-3xl border border-emerald-100/70 bg-gradient-to-br from-white to-emerald-50/50 p-5 shadow-sm dark:border-emerald-900/60 dark:from-slate-950 dark:to-emerald-950/20"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-300">{card.label}</p>
              <p className="mt-2 text-3xl font-display font-semibold text-emerald-950 dark:text-brand-100">{card.value}</p>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{card.helper}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="min-w-0 rounded-3xl border border-emerald-100/70 bg-white/90 p-6 shadow-sm dark:border-emerald-900/60 dark:bg-slate-950/60">
            <header className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-200">
                  Live fulfilment queue
                </p>
                <p className="text-lg font-semibold text-emerald-950 dark:text-brand-100">Orders requiring attention</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-100">
                <Users className="h-5 w-5" />
              </div>
            </header>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              Pending and confirmed orders surface here for a quick call or slot confirmation.
            </p>
            <ul className="mt-4 space-y-3">
              {actionableOrders.length === 0 && (
                <li className="rounded-2xl border border-dashed border-emerald-200/70 p-4 text-sm text-emerald-600 dark:border-emerald-900/50 dark:text-emerald-200">
                  All caught up. New orders will show up automatically.
                </li>
              )}
              {actionableOrders.map((order) => renderOrderRow(order))}
            </ul>
          </section>

          <section className="min-w-0 rounded-3xl border border-emerald-100/70 bg-white/90 p-6 shadow-sm dark:border-emerald-900/60 dark:bg-slate-950/60">
            <header className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-200">Recent submissions</p>
                <p className="text-lg font-semibold text-emerald-950 dark:text-brand-100">Latest orders log</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-300">
                <ClipboardList className="h-5 w-5" />
              </div>
            </header>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              Use this feed to double-check totals before calling the store team.
            </p>
            <div className="mt-4 rounded-3xl border border-emerald-100/70 bg-white/80 p-1 dark:border-emerald-900/60 dark:bg-slate-950/60">
              <div className="overflow-hidden rounded-t-3xl rounded-b-xl sm:rounded-2xl">
                <div className="overflow-x-auto scrollbar-brand">
                  <table className="min-w-[640px] divide-y divide-emerald-50 text-sm dark:divide-emerald-900/50">
                    <thead className="bg-emerald-50/60 text-left text-xs font-semibold uppercase tracking-wide text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-200">
                      <tr>
                        <th className="px-4 py-3">Order</th>
                        <th className="px-4 py-3">Customer</th>
                        <th className="px-4 py-3">Slot</th>
                        <th className="px-4 py-3">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-emerald-50/60 dark:divide-emerald-900/40">
                      {recentOrders.length === 0 && (
                        <tr>
                          <td colSpan={4} className="px-4 py-4 text-center text-slate-500 dark:text-slate-300">
                            No orders yet. Place a test order to populate this feed.
                          </td>
                        </tr>
                      )}
                      {recentOrders.map((order) => (
                        <tr key={order.id} className="bg-white/70 text-emerald-900 dark:bg-slate-950/40 dark:text-emerald-100">
                          <td className="px-4 py-3">
                            <div className="text-xs font-semibold uppercase tracking-wide text-emerald-500 dark:text-emerald-300">{order.id}</div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-300">{formatDateTime(order.createdAt)}</div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-semibold">{order.customerName || 'Customer'}</div>
                            <div className="text-xs text-slate-500">{order.customerPhone || 'Phone n/a'}</div>
                          </td>
                          <td className="px-4 py-3 text-xs font-semibold text-emerald-700 dark:text-emerald-200">
                            {order.deliverySlot || 'Not selected'}
                          </td>
                          <td className="px-4 py-3 font-semibold">{formatCurrency(order.totalAmount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </section>
        </div>

        <section className="rounded-3xl border border-emerald-100/70 bg-white/90 p-6 shadow-sm dark:border-emerald-900/60 dark:bg-slate-950/60">
          <div className="flex items-center gap-3">
            <Settings2 className="h-5 w-5 text-brand-600 dark:text-brand-300" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-200">Delivery playbook</p>
              <p className="text-lg font-semibold text-emerald-950 dark:text-brand-100">Fulfilment stages</p>
            </div>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {pipelineStats.map((stage) => (
              <div
                key={stage.key}
                className="rounded-2xl border border-emerald-100/70 bg-emerald-50/40 p-4 text-sm dark:border-emerald-900/60 dark:bg-emerald-950/30"
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-200">{stage.label}</p>
                <p className="mt-2 text-3xl font-display font-semibold text-emerald-950 dark:text-brand-100">{stage.count}</p>
                <p className="mt-1 text-slate-600 dark:text-slate-300">{stage.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-emerald-100/70 bg-white/90 p-6 shadow-sm dark:border-emerald-900/60 dark:bg-slate-950/60">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-200">Configuration snapshot</p>
              <p className="text-lg font-semibold text-emerald-950 dark:text-brand-100">Keep teams in sync</p>
            </div>
          </div>
          {configBanner && (
            <div
              className={`mt-4 rounded-2xl border p-4 text-sm ${
                configBanner.type === 'success'
                  ? 'border-emerald-200/70 bg-emerald-50/70 text-emerald-800 dark:border-emerald-900/70 dark:bg-emerald-900/30 dark:text-emerald-200'
                  : 'border-rose-200/70 bg-rose-50/70 text-rose-700 dark:border-rose-900/70 dark:bg-rose-900/30 dark:text-rose-100'
              }`}
            >
              {configBanner.message}
            </div>
          )}
          {configError && (
            <div className="mt-4 rounded-2xl border border-rose-200/70 bg-rose-50/70 p-4 text-sm text-rose-700 dark:border-rose-900/70 dark:bg-rose-900/40 dark:text-rose-100">
              {configError}
            </div>
          )}
          <div className="mt-5 grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
            <form
              onSubmit={handleConfigSubmit}
              className="rounded-2xl border border-emerald-100/70 bg-emerald-50/50 p-4 dark:border-emerald-900/60 dark:bg-emerald-950/20 md:col-span-2"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-200">Order economics</p>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                {CONFIG_FIELD_META.map((field) => (
                  <label key={field.key} className="text-sm font-semibold text-emerald-900 dark:text-emerald-100">
                    {field.label}
                    <div className="mt-2 flex items-center gap-2 rounded-2xl border border-emerald-200/70 bg-white px-3 py-2 text-base text-emerald-900 shadow-inner dark:border-emerald-900/60 dark:bg-slate-950 dark:text-emerald-100">
                      <span className="text-sm font-semibold text-emerald-500">₹</span>
                      <input
                        type="number"
                        min={0}
                        step="1"
                        value={configFields[field.key]}
                        onChange={(event) => handleConfigFieldChange(field.key, event.target.value)}
                        className="w-full bg-transparent text-base font-semibold text-emerald-900 outline-none dark:text-emerald-100"
                        disabled={configStatus === 'loading' || saving}
                      />
                    </div>
                    <span className="mt-1 block text-xs font-normal text-slate-600 dark:text-slate-300">{field.helper}</span>
                  </label>
                ))}
              </div>
              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={saving || configStatus === 'loading'}
                  className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-brand-500 to-brand-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:from-brand-600 hover:to-brand-700 disabled:opacity-60"
                >
                  {saving ? 'Saving…' : 'Save config'}
                </button>
                <button
                  type="button"
                  onClick={handleConfigReset}
                  className="inline-flex items-center justify-center rounded-full border border-emerald-200/70 bg-white px-5 py-2 text-sm font-semibold text-emerald-800 shadow-sm transition hover:border-emerald-400 hover:text-emerald-900 dark:border-emerald-900/60 dark:bg-slate-950 dark:text-emerald-200"
                >
                  Reset values
                </button>
              </div>
            </form>
            <div className="rounded-2xl border border-emerald-100/70 bg-slate-50/80 p-4 dark:border-emerald-900/60 dark:bg-slate-900/40">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-200">Preferred slots</p>
              {slotInsights.hasData ? (
                <ul className="mt-3 space-y-1 text-sm">
                  <li className="font-semibold text-emerald-900 dark:text-emerald-100">
                    {slotInsights.topSlot?.[0]} • {slotInsights.topSlot?.[1]} orders
                  </li>
                  {slotInsights.others.map(([slot, count]) => (
                    <li key={slot} className="text-slate-600 dark:text-slate-300">
                      {slot} • {count}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">No slot data yet. Once orders include slots, the busiest window appears here.</p>
              )}
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Use this to balance load between 11:30 AM & 6:30 PM dispatches.</p>
            </div>
            <div className="rounded-2xl border border-emerald-100/70 bg-brand-50/60 p-4 dark:border-emerald-900/60 dark:bg-brand-900/30">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-200">Payments offered</p>
              <ul className="mt-3 space-y-1 text-sm text-emerald-900 dark:text-emerald-100">
                <li>Cash on delivery</li>
                <li>UPI on delivery</li>
              </ul>
              <p className="mt-2 text-xs text-brand-600/80 dark:text-brand-200/80">Expose future prepaid/credit options here.</p>
            </div>
            <div className="rounded-2xl border border-emerald-100/70 bg-white p-4 dark:border-emerald-900/60 dark:bg-slate-900/40">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-200">Next upgrades</p>
              <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-600 dark:text-slate-300">
                <li>Status updates back to customers</li>
                <li>Slot & payment config stored in D1</li>
                <li>Staff auth for this page</li>
              </ul>
            </div>
          </div>
        </section>
      </div>
    </PageSection>
  );
}

export default AdminPage;
