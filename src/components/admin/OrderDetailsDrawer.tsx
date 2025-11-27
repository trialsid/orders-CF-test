import React, { useEffect, useMemo, useRef, useState } from 'react';
import { X, Phone, MapPin, Truck, CheckCircle2, Clock, Ban, MessageCircle } from 'lucide-react';
import { formatCurrency } from '../../utils/formatCurrency';
import type { OrderRecord, OrderStatus } from '../../types';
import { useApiClient } from '../../hooks/useApiClient';
import { useAuth } from '../../context/AuthContext';

interface OrderDetailsDrawerProps {
  order: OrderRecord;
  isOpen: boolean;
  onClose: () => void;
  onStatusChange: (orderId: string, nextStatus: OrderStatus) => Promise<void>;
}

const STATUS_CONFIG: Record<OrderStatus, { color: string; icon: React.ElementType; label: string }> = {
  pending: { color: 'text-amber-600 bg-amber-50 border-amber-200', icon: Clock, label: 'Pending' },
  confirmed: { color: 'text-blue-600 bg-blue-50 border-blue-200', icon: CheckCircle2, label: 'Confirmed' },
  outForDelivery: { color: 'text-purple-600 bg-purple-50 border-purple-200', icon: Truck, label: 'Out for Delivery' },
  delivered: { color: 'text-emerald-600 bg-emerald-50 border-emerald-200', icon: CheckCircle2, label: 'Delivered' },
  cancelled: { color: 'text-rose-600 bg-rose-50 border-rose-200', icon: Ban, label: 'Cancelled' },
};

const ORDER_STATUS_OPTIONS: Array<{ value: OrderStatus; label: string }> = [
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'outForDelivery', label: 'Out for delivery' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
];

export function OrderDetailsDrawer({ order, isOpen, onClose, onStatusChange }: OrderDetailsDrawerProps) {
  const { apiFetch } = useApiClient();
  const { token } = useAuth();
  const [isUpdating, setIsUpdating] = useState(false);
  const [resolvedOrder, setResolvedOrder] = useState<OrderRecord>(order);
  const orderEtagsRef = useRef<Record<string, string>>({});

  // Keep local state in sync with parent-provided order object
  useEffect(() => {
    setResolvedOrder(order);
  }, [order]);

  // Revalidate order on open using per-order ETag
  useEffect(() => {
    if (!isOpen || !token || !order?.id) return;
    const controller = new AbortController();

    const guessEtag =
      orderEtagsRef.current[order.id] ||
      (order.updatedAt ? `W/"order-${order.id}-${order.updatedAt}"` : undefined);

    (async () => {
      try {
        const response = await apiFetch(`/order?id=${encodeURIComponent(order.id)}`, {
          headers: {
            ...(guessEtag ? { 'If-None-Match': guessEtag } : {}),
          },
          signal: controller.signal,
        });

        if (response.status === 304) {
          return;
        }

        if (!response.ok) {
          return;
        }

        const payload = (await response.json()) as { orders?: OrderRecord[] };
        const fresh = payload.orders?.[0];
        if (fresh) {
          const nextEtag = response.headers.get('ETag');
          if (nextEtag) {
            orderEtagsRef.current[order.id] = nextEtag;
          }
          setResolvedOrder(fresh);
        }
      } catch (error) {
        if (controller.signal.aborted) return;
        console.warn('Failed to refresh order details', error);
      }
    })();

    return () => controller.abort();
  }, [isOpen, order, apiFetch, token]);

  const statusConfig = STATUS_CONFIG[resolvedOrder.status as OrderStatus] || STATUS_CONFIG.pending;
  const StatusIcon = statusConfig.icon;

  const handleStatusUpdate = async (newStatus: OrderStatus) => {
    setIsUpdating(true);
    try {
      await onStatusChange(resolvedOrder.id, newStatus);
    } finally {
      setIsUpdating(false);
    }
  };

  const whatsappLink = useMemo(() => {
    if (!resolvedOrder.customerPhone) return null;
    const digits = resolvedOrder.customerPhone.replace(/\D/g, '');
    const number = digits.length === 10 ? `91${digits}` : digits;
    return `https://wa.me/${number}?text=Hi ${resolvedOrder.customerName}, regarding your order ${resolvedOrder.id}...`;
  }, [resolvedOrder.customerName, resolvedOrder.customerPhone, resolvedOrder.id]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="relative w-full max-w-md transform bg-white shadow-2xl transition-transform duration-300 ease-in-out dark:bg-slate-900">
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 p-4 dark:border-slate-800">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Order Details</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">{resolvedOrder.id}</p>
            </div>
            <button
              onClick={onClose}
              className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {/* Status Section */}
            <div className={`mb-6 rounded-xl border p-4 ${statusConfig.color} bg-opacity-50 dark:bg-opacity-10`}>
              <div className="flex items-center gap-3">
                <StatusIcon className="h-5 w-5" />
                <span className="font-semibold">{statusConfig.label}</span>
              </div>
              
              <div className="mt-4">
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider opacity-70">
                  Update Status
                </label>
                <select
                  value={resolvedOrder.status}
                  onChange={(e) => handleStatusUpdate(e.target.value as OrderStatus)}
                  disabled={isUpdating}
                  className="w-full rounded-lg border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 shadow-sm outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  {ORDER_STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Customer Details */}
            <section className="mb-6 space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Customer
              </h3>
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/50">
                <div className="mb-4">
                  <p className="text-lg font-semibold text-slate-900 dark:text-white">{resolvedOrder.customerName}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {resolvedOrder.customerPhone && (
                      <a
                        href={`tel:${resolvedOrder.customerPhone}`}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-100 px-3 py-1.5 text-xs font-medium text-emerald-700 transition hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300"
                      >
                        <Phone className="h-3.5 w-3.5" />
                        Call
                      </a>
                    )}
                    {whatsappLink && (
                      <a
                        href={whatsappLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-lg bg-green-100 px-3 py-1.5 text-xs font-medium text-green-700 transition hover:bg-green-200 dark:bg-green-900/30 dark:text-green-300"
                      >
                        <MessageCircle className="h-3.5 w-3.5" />
                        WhatsApp
                      </a>
                    )}
                  </div>
                </div>

                <div className="flex gap-3 text-sm text-slate-600 dark:text-slate-300">
                  <MapPin className="h-5 w-5 shrink-0 text-slate-400" />
                  <div>
                    <p>{resolvedOrder.customerAddress}</p>
                    {resolvedOrder.deliveryInstructions && (
                      <p className="mt-2 rounded bg-amber-50 px-2 py-1 text-xs text-amber-700 dark:bg-amber-900/20 dark:text-amber-300">
                        Note: {resolvedOrder.deliveryInstructions}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </section>

            {/* Order Items */}
            <section className="mb-6">
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Items ({resolvedOrder.items.length})
              </h3>
              <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                    <tr>
                      <th className="px-4 py-3 font-medium">Item</th>
                      <th className="px-4 py-3 text-right font-medium">Qty</th>
                      <th className="px-4 py-3 text-right font-medium">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {resolvedOrder.items.map((item) => (
                      <tr key={item.id} className="bg-white dark:bg-slate-900">
                        <td className="px-4 py-3">
                          <p className="font-medium text-slate-900 dark:text-white">{item.name}</p>
                          <p className="text-xs text-slate-500">{formatCurrency(item.unitPrice)}/ea</p>
                        </td>
                        <td className="px-4 py-3 text-right text-slate-600 dark:text-slate-300">
                          {item.quantity}
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-slate-900 dark:text-white">
                          {formatCurrency(item.lineTotal)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-50 font-medium dark:bg-slate-800">
                    <tr>
                      <td colSpan={2} className="px-4 py-3 text-slate-700 dark:text-slate-200">Total Amount</td>
                      <td className="px-4 py-3 text-right text-slate-900 dark:text-white">
                        {formatCurrency(resolvedOrder.totalAmount)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </section>

            {/* Delivery Info */}
            <section>
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Delivery & Payment
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-700">
                  <p className="text-xs text-slate-500">Slot</p>
                  <p className="font-medium text-slate-900 dark:text-white">{resolvedOrder.deliverySlot}</p>
                </div>
                <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-700">
                  <p className="text-xs text-slate-500">Payment</p>
                  <p className="font-medium text-slate-900 dark:text-white">{resolvedOrder.paymentMethod}</p>
                </div>
              </div>
            </section>
          </div>

          {/* Footer Actions */}
          <div className="border-t border-slate-100 p-4 dark:border-slate-800">
             <button
              onClick={onClose}
              className="w-full rounded-lg bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700"
            >
              Close Details
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
