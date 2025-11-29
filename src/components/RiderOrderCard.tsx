import React from 'react';
import { Clock, MapPin, Navigation, Phone, Package, Wallet, CreditCard, AlertCircle, ChevronDown, ChevronRight, Truck, CheckCircle } from 'lucide-react';
import { getMapsUrl, getCallHref, getAdvanceMeta, isUrgent } from '../utils/riderUtils';
import type { OrderRecord, OrderStatus } from '../types';
import { formatCurrency } from '../utils/formatCurrency';
import { StatusBadge } from './StatusBadge';
export type RiderOrderCardProps = {
  order: OrderRecord;
  isPrimary: boolean;
  isUpdating: boolean;
  onAdvanceStatus: (order: OrderRecord, nextStatus: OrderStatus) => void;
};

export function RiderOrderCard({ order, isPrimary, isUpdating, onAdvanceStatus }: RiderOrderCardProps): JSX.Element {
  const [itemsExpanded, setItemsExpanded] = React.useState(false);

  const { buttonLabel, nextStatus } = getAdvanceMeta(order);
  const mapUrl = getMapsUrl(order.customerAddress);
  const callHref = getCallHref(order.customerPhone);
  const urgent = isUrgent(order);
  const isCOD = order.paymentMethod?.toLowerCase().includes('cash') || order.paymentMethod === 'COD';

  // Format Items
  const itemCount = order.items.reduce((acc, item) => acc + item.quantity, 0);
  const itemsSummary = order.items.map((i) => `${i.quantity}× ${i.name}`).join(', ');

  // Format Slot
  // Assuming deliverySlot is a string or date. If it's a specific ISO string, we might want to just show time.
  // For now, using the raw string or a simple fallback.
  const slotLabel = order.deliverySlot
    ? new Date(order.deliverySlot).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
    : 'ASAP';

  return (
    <article
      className={`relative flex flex-col gap-0 overflow-hidden rounded-3xl border bg-white transition-all dark:bg-slate-900 ${
        isPrimary
          ? 'border-brand-500/50 shadow-[0_0_0_2px_rgba(16,185,129,0.1)] ring-1 ring-brand-500 dark:border-brand-400/50'
          : 'border-slate-200 shadow-sm hover:border-slate-300 dark:border-slate-800'
      }`}
    >
      {/* 1. Header: Time, ID, Status */}
      <div className={`flex items-center justify-between px-4 py-3 ${
        urgent ? 'bg-amber-50 dark:bg-amber-950/30' : 'bg-slate-50/50 dark:bg-slate-900'
      }`}>
        <div className="flex items-center gap-2.5">
          <div className={`flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-bold uppercase tracking-wide ${
             urgent ? 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100' : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
          }`}>
            <Clock className="h-3.5 w-3.5" />
            <span>{slotLabel}</span>
          </div>
          {urgent && (
            <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
              <AlertCircle className="h-3 w-3" /> Urgent
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-medium text-slate-400">#{order.id.slice(-4)}</span>
          <StatusBadge status={order.status} showIcon={false} />
        </div>
      </div>

      {/* 2. Hero: Address */}
      <div className="flex flex-col gap-1 p-4 pb-2">
        <div className="flex items-start gap-3">
          <MapPin className={`mt-1 h-5 w-5 shrink-0 ${isPrimary ? 'text-brand-600 dark:text-brand-400' : 'text-slate-400'}`} />
          <div>
            <h3 className="text-lg font-bold leading-snug text-slate-900 dark:text-slate-100">
              {order.customerAddress || 'No address provided'}
            </h3>
            <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
              {order.customerName}
            </p>
          </div>
        </div>
      </div>

      {/* 3. Context: Items Toggle */}
      <button
        type="button"
        onClick={() => setItemsExpanded(!itemsExpanded)}
        className="flex items-center gap-2 px-4 py-2 text-left text-sm text-slate-500 transition hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
      >
        <Package className="h-4 w-4 shrink-0" />
        <span className="flex-1 truncate font-medium">
          {itemCount} items {itemsExpanded ? '' : `• ${itemsSummary}`}
        </span>
        {itemsExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
      </button>
      
      {itemsExpanded && (
        <div className="bg-slate-50 px-4 py-2 text-sm text-slate-600 dark:bg-slate-800/50 dark:text-slate-300">
          <ul className="list-inside list-disc space-y-1">
            {order.items.map((item, idx) => (
              <li key={idx}>
                <span className="font-semibold text-slate-900 dark:text-slate-100">{item.quantity}×</span> {item.name}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 4. Footer: Money & Actions */}
      <div className="mt-2 grid border-t border-slate-100 dark:border-slate-800 sm:grid-cols-[1fr_auto]">
        {/* Money Section */}
        <div className={`flex items-center justify-between gap-3 px-4 py-3 sm:border-r sm:border-slate-100 sm:dark:border-slate-800 ${
          isCOD ? 'bg-red-50/50 dark:bg-red-950/10' : ''
        }`}>
          <div className="flex items-center gap-2">
            {isCOD ? (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400">
                <Wallet className="h-4 w-4" />
              </div>
            ) : (
               <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                <CreditCard className="h-4 w-4" />
              </div>
            )}
            <div>
              <p className={`text-[10px] font-bold uppercase tracking-wider ${isCOD ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                {isCOD ? 'Collect Cash' : 'Prepaid'}
              </p>
              <p className="text-sm font-bold text-slate-900 dark:text-white">
                {formatCurrency(order.totalAmount)}
              </p>
            </div>
          </div>
        </div>

        {/* Actions Section */}
        <div className="flex items-stretch p-2">
          {isPrimary ? (
            <>
              <div className="flex w-full items-center justify-center rounded-xl bg-brand-50 px-4 py-2 text-xs font-bold uppercase tracking-wide text-brand-700 dark:bg-brand-950/30 dark:text-brand-300 md:hidden sm:w-auto">
                Active on Rider Console ↓
              </div>
              <div className="hidden w-full gap-2 md:flex sm:w-auto">
                 <a
                href={mapUrl}
                target="_blank"
                rel="noreferrer"
                className={`flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 ${!mapUrl ? 'opacity-50 pointer-events-none' : ''}`}
              >
                <Navigation className="mb-1 h-4 w-4" />
                Nav
              </a>
              <a
                href={callHref}
                className={`flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 ${!callHref ? 'opacity-50 pointer-events-none' : ''}`}
              >
                <Phone className="mb-1 h-4 w-4" />
                Call
              </a>
              <button
                type="button"
                onClick={() => onAdvanceStatus(order, nextStatus)}
                disabled={isUpdating}
                className="flex flex-col items-center justify-center rounded-xl bg-slate-900 px-3 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-slate-800 dark:bg-brand-600 dark:hover:bg-brand-500 disabled:opacity-50"
              >
                {order.status === 'confirmed' ? <Truck className="mb-1 h-4 w-4" /> : <CheckCircle className="mb-1 h-4 w-4" />}
                {buttonLabel}
              </button>
              </div>
            </>
          ) : (
            <div className="grid w-full grid-cols-3 gap-2 sm:w-auto sm:flex">
              <a
                href={mapUrl}
                target="_blank"
                rel="noreferrer"
                className={`flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 ${!mapUrl ? 'opacity-50 pointer-events-none' : ''}`}
              >
                <Navigation className="mb-1 h-4 w-4" />
                Nav
              </a>
              <a
                href={callHref}
                className={`flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 ${!callHref ? 'opacity-50 pointer-events-none' : ''}`}
              >
                <Phone className="mb-1 h-4 w-4" />
                Call
              </a>
              <button
                type="button"
                onClick={() => onAdvanceStatus(order, nextStatus)}
                disabled={isUpdating}
                className="flex flex-col items-center justify-center rounded-xl bg-slate-900 px-3 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-slate-800 dark:bg-brand-600 dark:hover:bg-brand-500 disabled:opacity-50"
              >
                {order.status === 'confirmed' ? <Truck className="mb-1 h-4 w-4" /> : <CheckCircle className="mb-1 h-4 w-4" />}
                {buttonLabel}
              </button>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
