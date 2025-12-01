import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ClipboardList,
  RefreshCw,
  Settings2,
  Truck,
  Users,
  ShieldCheck,
  LayoutDashboard,
  Package,
  Sliders,
  ChevronRight,
  Search,
  Filter,
  Tag
} from 'lucide-react';
import PageSection from '../components/PageSection';
import { useOrders } from '../hooks/useOrders';
import { useAdminConfig } from '../hooks/useAdminConfig';
import { formatCurrency } from '../utils/formatCurrency';
import { updateOrderStatus as updateOrderStatusRequest } from '../utils/updateOrderStatus';
import type { AdminConfig, OrderRecord, OrderStatus, User } from '../types';
import { useAuth } from '../context/AuthContext';
import { OrderDetailsDrawer } from '../components/admin/OrderDetailsDrawer';
import { ProductCatalog } from '../components/admin/ProductCatalog';
import { useAdminUsers } from '../hooks/useAdminUsers';
import { useApiClient } from '../hooks/useApiClient';
import { StatusBadge } from '../components/StatusBadge';

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

const USER_ROLE_FILTERS: Array<{ value: User['role'] | 'all'; label: string }> = [
  { value: 'all', label: 'All roles' },
  { value: 'admin', label: 'Admins' },
  { value: 'rider', label: 'Riders' },
  { value: 'customer', label: 'Customers' },
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

type Tab = 'dashboard' | 'orders' | 'catalog' | 'settings' | 'users';

function AdminPage(): JSX.Element {
  const { token, user } = useAuth();
  const { apiFetch } = useApiClient();
  const { orders, status, error, refresh } = useOrders(100, { requireAuth: true });
  const { users, status: usersStatus, error: usersError, refresh: refreshUsers, updateUserRole, updateUserStatus } = useAdminUsers();
  const {
    config,
    status: configStatus,
    error: configError,
    refresh: refreshConfig,
    saveConfig,
    saving,
  } = useAdminConfig();

  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [statusUpdateError, setStatusUpdateError] = useState<string>();
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [userUpdateError, setUserUpdateError] = useState<string>();

  // Search & Filter State (Orders)
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');

  // Search & Filter State (Users)
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<User['role'] | 'all'>('all');


  const filteredOrders = useMemo(() => {
    let result = orders;
    
    if (statusFilter !== 'all') {
      result = result.filter((o) => resolveStatus(o.status) === statusFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (o) =>
          o.id.toLowerCase().includes(q) ||
          o.customerName?.toLowerCase().includes(q) ||
          o.customerPhone?.includes(q)
      );
    }
    
    return result;
  }, [orders, statusFilter, searchQuery]);
  
  const filteredUsers = useMemo(() => {
    let result = users;

    if (userRoleFilter !== 'all') {
      result = result.filter((u) => u.role === userRoleFilter);
    }

    if (userSearchQuery.trim()) {
      const q = userSearchQuery.toLowerCase();
      result = result.filter(
        (u) =>
          u.id.toLowerCase().includes(q) ||
          u.full_name?.toLowerCase().includes(q) ||
          u.phone.includes(q)
      );
    }

    return result;
  }, [users, userRoleFilter, userSearchQuery]);

  // Config Form State
  const [configFields, setConfigFields] = useState<Record<keyof AdminConfig, string>>({
    minimumOrderAmount: '100',
    freeDeliveryThreshold: '299',
    deliveryFeeBelowThreshold: '15',
  });
  const [configBanner, setConfigBanner] = useState<{ type: 'success' | 'error'; message: string }>();

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
    try {
      await updateOrderStatusRequest(orderId, nextStatus, token, apiFetch);
      await refresh(); // Refresh list to reflect changes
    } catch (updateError) {
      const message = updateError instanceof Error ? updateError.message : 'Unable to update order status right now.';
      setStatusUpdateError(message);
      // Re-throw to let the drawer know it failed
      throw updateError;
    }
  };

  const isLoadingOrders = status === 'loading';
  const isOrdersError = status === 'error';
  const isLoadingUsers = usersStatus === 'loading';
  const isUsersError = usersStatus === 'error';

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

  const selectedOrder = useMemo(() => 
    orders.find(o => o.id === selectedOrderId), 
    [orders, selectedOrderId]
  );

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

  const renderOrderRow = (order: OrderRecord, interactive = false) => {
    const statusKey = resolveStatus(order.status);
    const nextAction = NEXT_ACTION_COPY[statusKey];

    return (
      <li
        key={order.id}
        onClick={interactive ? () => setSelectedOrderId(order.id) : undefined}
        className={`rounded-2xl border border-emerald-100/70 bg-white/90 p-4 shadow-sm dark:border-emerald-900/60 dark:bg-slate-900/70 ${interactive ? 'cursor-pointer transition hover:border-emerald-300 hover:shadow-md' : ''}`}
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
        </div>
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-300">{formatDateTime(order.createdAt)}</p>
      </li>
    );
  };

  const handleUserRoleChange = async (userId: string, role: User['role']) => {
    setUserUpdateError(undefined);
    setUpdatingUserId(userId);
    try {
      await updateUserRole(userId, role);
    } catch (updateError) {
      const message = updateError instanceof Error ? updateError.message : 'Unable to update role right now.';
      setUserUpdateError(message);
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleUserStatusChange = async (userId: string, nextStatus: User['status']) => {
    setUserUpdateError(undefined);
    setUpdatingUserId(userId);
    try {
      await updateUserStatus(userId, nextStatus);
    } catch (updateError) {
      const message = updateError instanceof Error ? updateError.message : 'Unable to update status right now.';
      setUserUpdateError(message);
    } finally {
      setUpdatingUserId(null);
    }
  };

  return (
    <PageSection
      title="Store Management"
      description="Overview, order processing, and store configuration."
      layout="split"
      actions={
        <div className="flex flex-wrap items-center gap-3">
          {user && (
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200/70 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-900/40 dark:text-emerald-100">
              <ShieldCheck className="h-4 w-4" /> {(user.fullName ?? user.displayName ?? user.phone) ?? ''} • {user.role}
            </span>
          )}
          <button
            type="button"
            onClick={() => {
              refresh();
              refreshUsers();
            }}
            disabled={isLoadingOrders || isLoadingUsers}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-emerald-200/70 bg-white px-4 py-2 text-sm font-semibold text-emerald-800 shadow-sm transition hover:border-emerald-400 hover:text-emerald-900 disabled:opacity-60 sm:w-auto dark:border-emerald-800 dark:bg-slate-900 dark:text-emerald-200"
          >
            <RefreshCw className="h-4 w-4" />
            {isLoadingOrders || isLoadingUsers ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto border-b border-emerald-100 pb-1 dark:border-emerald-900/50">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition ${
              activeTab === 'dashboard'
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-100'
                : 'text-slate-600 hover:bg-emerald-50 dark:text-slate-400 dark:hover:bg-slate-800'
            }`}
          >
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition ${
              activeTab === 'orders'
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-100'
                : 'text-slate-600 hover:bg-emerald-50 dark:text-slate-400 dark:hover:bg-slate-800'
            }`}
          >
            <Package className="h-4 w-4" />
            Orders
          </button>
          <button
            onClick={() => setActiveTab('catalog')}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition ${
              activeTab === 'catalog'
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-100'
                : 'text-slate-600 hover:bg-emerald-50 dark:text-slate-400 dark:hover:bg-slate-800'
            }`}
          >
            <Tag className="h-4 w-4" />
            Catalog
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition ${
              activeTab === 'users'
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-100'
                : 'text-slate-600 hover:bg-emerald-50 dark:text-slate-400 dark:hover:bg-slate-800'
            }`}
          >
            <Users className="h-4 w-4" />
            Users
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition ${
              activeTab === 'settings'
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-100'
                : 'text-slate-600 hover:bg-emerald-50 dark:text-slate-400 dark:hover:bg-slate-800'
            }`}
          >
            <Sliders className="h-4 w-4" />
            Settings
          </button>
        </div>

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

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
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
                  Pending and confirmed orders surface here. Click an order to manage it.
                </p>
                <ul className="mt-4 space-y-3">
                  {actionableOrders.length === 0 && (
                    <li className="rounded-2xl border border-dashed border-emerald-200/70 p-4 text-sm text-emerald-600 dark:border-emerald-900/50 dark:text-emerald-200">
                      All caught up. New orders will show up automatically.
                    </li>
                  )}
                  {actionableOrders.map((order) => renderOrderRow(order, true))}
                </ul>
              </section>

              <div className="space-y-6">
                 <section className="rounded-3xl border border-emerald-100/70 bg-white/90 p-6 shadow-sm dark:border-emerald-900/60 dark:bg-slate-950/60">
                  <div className="flex items-center gap-3">
                    <Settings2 className="h-5 w-5 text-brand-600 dark:text-brand-300" />
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-200">Delivery playbook</p>
                      <p className="text-lg font-semibold text-emerald-950 dark:text-brand-100">Fulfilment stages</p>
                    </div>
                  </div>
                  <div className="mt-5 grid grid-cols-2 gap-4">
                    {pipelineStats.map((stage) => (
                      <div
                        key={stage.key}
                        className="rounded-2xl border border-emerald-100/70 bg-emerald-50/40 p-3 text-sm dark:border-emerald-900/60 dark:bg-emerald-950/30"
                      >
                        <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-200">{stage.label}</p>
                        <p className="mt-1 text-2xl font-display font-semibold text-emerald-950 dark:text-brand-100">{stage.count}</p>
                      </div>
                    ))}
                  </div>
                </section>
                
                <section className="rounded-3xl border border-emerald-100/70 bg-white/90 p-6 shadow-sm dark:border-emerald-900/60 dark:bg-slate-950/60">
                   <header className="mb-4">
                     <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-200">Preferred slots</p>
                     <p className="text-lg font-semibold text-emerald-950 dark:text-brand-100">Load balancing</p>
                   </header>
                  {slotInsights.hasData ? (
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-center justify-between rounded-lg bg-emerald-50 px-3 py-2 font-semibold text-emerald-900 dark:bg-emerald-900/20 dark:text-emerald-100">
                        <span>{slotInsights.topSlot?.[0]}</span>
                        <span>{slotInsights.topSlot?.[1]} orders</span>
                      </li>
                      {slotInsights.others.map(([slot, count]) => (
                        <li key={slot} className="flex items-center justify-between px-3 text-slate-600 dark:text-slate-300">
                          <span>{slot}</span>
                          <span>{count}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-slate-600 dark:text-slate-300">No slot data yet.</p>
                  )}
                </section>
              </div>
            </div>
          </div>
        )}

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
             <section className="min-w-0 rounded-3xl border border-emerald-100/70 bg-white/90 p-6 shadow-sm dark:border-emerald-900/60 dark:bg-slate-950/60">
              <header className="flex flex-col gap-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-200">Order Management</p>
                    <p className="text-lg font-semibold text-emerald-950 dark:text-brand-100">
                      {statusFilter === 'all' ? 'All Orders' : getStatusLabel(statusFilter)} ({filteredOrders.length})
                    </p>
                  </div>
                  
                  {/* Search Bar */}
                  <div className="relative w-full sm:w-64">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <Search className="h-4 w-4 text-slate-400" />
                    </div>
                    <input
                      type="text"
                      placeholder="Search ID, Name, Phone..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="block w-full rounded-full border border-slate-200 bg-white py-2 pl-10 pr-3 text-sm placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                    />
                  </div>
                </div>

                {/* Status Tabs/Filter */}
                <div className="flex flex-wrap gap-2">
                   <button
                     onClick={() => setStatusFilter('all')}
                     className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                       statusFilter === 'all' 
                         ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-100' 
                         : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700'
                     }`}
                   >
                     All
                   </button>
                   {ORDER_STATUS_OPTIONS.map((option) => (
                     <button
                       key={option.value}
                       onClick={() => setStatusFilter(option.value)}
                       className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                         statusFilter === option.value
                           ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-100'
                           : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700'
                       }`}
                     >
                       {option.label}
                     </button>
                   ))}
                </div>
              </header>
              
              <div className="mt-6 overflow-hidden rounded-2xl border border-emerald-100/70 dark:border-emerald-900/60">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[800px] text-left text-sm">
                    <thead className="bg-emerald-50/60 text-xs uppercase tracking-wide text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-200">
                      <tr>
                        <th className="px-4 py-3 font-semibold">Order ID</th>
                        <th className="px-4 py-3 font-semibold">Date</th>
                        <th className="px-4 py-3 font-semibold">Customer</th>
                        <th className="px-4 py-3 font-semibold">Status</th>
                        <th className="px-4 py-3 font-semibold">Slot</th>
                        <th className="px-4 py-3 font-semibold text-right">Total</th>
                        <th className="px-4 py-3 font-semibold text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-emerald-50/60 dark:divide-emerald-900/40">
                      {filteredOrders.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                            No orders found matching your filters.
                          </td>
                        </tr>
                      ) : (
                        filteredOrders.map((order) => (
                          <tr 
                            key={order.id} 
                            className="group bg-white/70 transition-colors hover:bg-emerald-50/30 dark:bg-slate-950/40 dark:hover:bg-emerald-900/10"
                          >
                            <td className="px-4 py-3 font-mono text-xs font-medium text-slate-500">{order.id}</td>
                            <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{formatDateTime(order.createdAt)}</td>
                            <td className="px-4 py-3">
                              <div className="font-semibold text-emerald-900 dark:text-emerald-100">{order.customerName}</div>
                              <div className="text-xs text-slate-500">{order.customerPhone}</div>
                            </td>
                            <td className="px-4 py-3">
                               <StatusBadge status={order.status} />
                            </td>
                            <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{order.deliverySlot}</td>
                            <td className="px-4 py-3 text-right font-medium text-emerald-900 dark:text-emerald-100">{formatCurrency(order.totalAmount)}</td>
                            <td className="px-4 py-3 text-center">
                              <button
                                onClick={() => setSelectedOrderId(order.id)}
                                className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-brand-600 dark:hover:bg-slate-800 dark:hover:text-brand-400"
                              >
                                <ChevronRight className="h-5 w-5" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* Catalog Tab */}
        {activeTab === 'catalog' && (
           <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
             <section className="min-w-0 rounded-3xl border border-emerald-100/70 bg-white/90 p-6 shadow-sm dark:border-emerald-900/60 dark:bg-slate-950/60">
               <ProductCatalog />
             </section>
           </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {isUsersError && (
              <div className="rounded-2xl border border-rose-200/70 bg-rose-50/80 p-4 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-900/30 dark:text-rose-100">
                {usersError ?? 'Unable to load users right now.'}
              </div>
            )}
            {userUpdateError && (
              <div className="rounded-2xl border border-amber-200/70 bg-amber-50/80 p-4 text-sm text-amber-800 dark:border-amber-900/50 dark:bg-amber-900/40 dark:text-amber-100">
                {userUpdateError}
              </div>
            )}

            <section className="min-w-0 rounded-3xl border border-emerald-100/70 bg-white/90 p-6 shadow-sm dark:border-emerald-900/60 dark:bg-slate-950/60">
              <header className="flex flex-col gap-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-200">User access</p>
                    <p className="text-lg font-semibold text-emerald-950 dark:text-brand-100">
                      {USER_ROLE_FILTERS.find((option) => option.value === userRoleFilter)?.label ?? 'All users'} ({filteredUsers.length})
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-300">Review accounts, assign roles, and block risky profiles.</p>
                  </div>
                  <div className="relative w-full sm:w-80">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <Search className="h-4 w-4 text-slate-400" />
                    </div>
                    <input
                      type="text"
                      placeholder="Search phone, name, or user id..."
                      value={userSearchQuery}
                      onChange={(e) => setUserSearchQuery(e.target.value)}
                      className="block w-full rounded-full border border-slate-200 bg-white py-2 pl-10 pr-3 text-sm placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-100">
                    <Filter className="h-3.5 w-3.5" />
                    Role filters
                  </span>
                  {USER_ROLE_FILTERS.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setUserRoleFilter(option.value)}
                      className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                        userRoleFilter === option.value
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-100'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </header>

              <div className="mt-6 overflow-hidden rounded-2xl border border-emerald-100/70 dark:border-emerald-900/60">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[820px] text-left text-sm">
                    <thead className="bg-emerald-50/60 text-xs uppercase tracking-wide text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-200">
                      <tr>
                        <th className="px-4 py-3 font-semibold">User</th>
                        <th className="px-4 py-3 font-semibold">Phone</th>
                        <th className="px-4 py-3 font-semibold">Role</th>
                        <th className="px-4 py-3 font-semibold">Status</th>
                        <th className="px-4 py-3 font-semibold">Created</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-emerald-50/60 dark:divide-emerald-900/40">
                      {isLoadingUsers ? (
                        <tr>
                          <td colSpan={5} className="px-4 py-6 text-center text-slate-500 dark:text-slate-300">
                            Loading users…
                          </td>
                        </tr>
                      ) : filteredUsers.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-4 py-8 text-center text-slate-500 dark:text-slate-300">
                            No users found for this filter.
                          </td>
                        </tr>
                      ) : (
                        filteredUsers.map((adminUser) => {
                          const isUpdating = updatingUserId === adminUser.id;
                          return (
                            <tr
                              key={adminUser.id}
                              className="bg-white/70 transition-colors hover:bg-emerald-50/30 dark:bg-slate-950/40 dark:hover:bg-emerald-900/10"
                            >
                              <td className="px-4 py-3">
                                <div className="font-semibold text-emerald-900 dark:text-emerald-100">
                                  {adminUser.full_name || adminUser.display_name || 'Name unavailable'}
                                </div>
                                <div className="text-xs text-slate-500">{adminUser.id}</div>
                              </td>
                              <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{adminUser.phone}</td>
                              <td className="px-4 py-3">
                                <select
                                  value={adminUser.role}
                                  onChange={(event) => handleUserRoleChange(adminUser.id, event.target.value as User['role'])}
                                  disabled={isUpdating}
                                  className="w-full rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                                >
                                  <option value="admin">Admin</option>
                                  <option value="rider">Rider</option>
                                  <option value="customer">Customer</option>
                                </select>
                              </td>
                              <td className="px-4 py-3">
                                <select
                                  value={adminUser.status}
                                  onChange={(event) => handleUserStatusChange(adminUser.id, event.target.value as User['status'])}
                                  disabled={isUpdating}
                                  className={`w-full rounded-full border px-3 py-1.5 text-sm font-semibold shadow-sm focus:outline-none focus:ring-1 ${
                                    adminUser.status === 'active'
                                      ? 'border-emerald-200 bg-emerald-50 text-emerald-800 focus:border-emerald-400 focus:ring-emerald-400 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-100'
                                      : 'border-amber-200 bg-amber-50 text-amber-800 focus:border-amber-400 focus:ring-amber-400 dark:border-amber-800 dark:bg-amber-900/30 dark:text-amber-100'
                                  } disabled:opacity-60`}
                                >
                                  <option value="active">Active</option>
                                  <option value="blocked">Blocked</option>
                                </select>
                              </td>
                              <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{formatDateTime(adminUser.created_at)}</td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <section className="rounded-3xl border border-emerald-100/70 bg-white/90 p-6 shadow-sm dark:border-emerald-900/60 dark:bg-slate-950/60 animate-in fade-in slide-in-from-bottom-4 duration-500">
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
               <div className="rounded-2xl border border-emerald-100/70 bg-brand-50/60 p-4 dark:border-emerald-900/60 dark:bg-brand-900/30">
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-200">Payments offered</p>
                <ul className="mt-3 space-y-1 text-sm text-emerald-900 dark:text-emerald-100">
                  <li>Cash on delivery</li>
                  <li>UPI on delivery</li>
                </ul>
                <p className="mt-2 text-xs text-brand-600/80 dark:text-brand-200/80">Expose future prepaid/credit options here.</p>
              </div>
            </div>
          </section>
        )}
      </div>

      {/* Details Drawer */}
      {selectedOrder && (
        <OrderDetailsDrawer
          order={selectedOrder}
          isOpen={!!selectedOrder}
          onClose={() => setSelectedOrderId(null)}
          onStatusChange={handleStatusChange}
          onOrderUpdate={refresh}
        />
      )}
    </PageSection>
  );
}

export default AdminPage;
