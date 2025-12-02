import React from 'react';
import { Clock, MapPin, Navigation, Phone, Package, Wallet, CreditCard, AlertCircle, ChevronDown, ChevronRight, Truck, CheckCircle, Play } from 'lucide-react';
import { getMapsUrl, getCallHref, getAdvanceMeta, isUrgent } from '../utils/riderUtils';
import type { OrderRecord, OrderStatus } from '../types';
import { formatCurrency } from '../utils/formatCurrency';
import { StatusBadge } from './StatusBadge';
export type RiderOrderCardProps = {
  order: OrderRecord;
  isPrimary: boolean;
  isUpdating: boolean;
  onAdvanceStatus: (order: OrderRecord, nextStatus: OrderStatus) => void;
  onMakeActive?: (order: OrderRecord) => void;
};

export function RiderOrderCard({ order, isPrimary, isUpdating, onAdvanceStatus, onMakeActive }: RiderOrderCardProps): JSX.Element {
  const [itemsExpanded, setItemsExpanded] = React.useState(false);

  const { buttonLabel, nextStatus } = getAdvanceMeta(order);
  const mapUrl = getMapsUrl(order.customerAddress);
  const callHref = getCallHref(order.customerPhone);
  const urgent = isUrgent(order);
  const isCOD = order.paymentMethod?.toLowerCase().includes('cash') || order.paymentMethod === 'COD';

  // Format Items
  const itemCount = order.items.reduce((acc, item) => acc + item.quantity, 0);
  // Show first 2 items as preview text
  const collapsedSummary = order.items.slice(0, 2).map(i => i.name).join(', ') + (order.items.length > 2 ? '...' : '');

  // Format Slot
  const slotLabel = order.deliverySlot
    ? new Date(order.deliverySlot).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
    : 'ASAP';

  return (
    <article
      className={`group flex flex-col justify-between rounded-3xl border bg-white/95 p-4 transition-all hover:-translate-y-1 sm:p-6 ${
        isPrimary
          ? 'border-brand-500/50 shadow-lg shadow-brand-900/20 ring-1 ring-brand-500 dark:border-brand-400/50 dark:bg-slate-900/80'
          : 'border-emerald-100/70 shadow-md shadow-brand-900/10 hover:shadow-lg dark:border-emerald-900/60 dark:bg-slate-900/70'
      }`}
    >
      {/* 1. Header: Time, ID, Status */}
      <div className="flex items-start justify-between mb-2 sm:mb-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
                urgent ? 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
            }`}>
                <Clock className="mr-1.5 h-3 w-3" />
                {slotLabel}
            </span>
             {urgent && (
                <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                  <AlertCircle className="h-3 w-3" /> Urgent
                </span>
            )}
          </div>
          <span className="font-mono text-xs text-slate-400 dark:text-slate-500 ml-1">
             #{order.id.slice(-4)}
          </span>
        </div>
        <StatusBadge status={order.status} showIcon={false} />
      </div>

      {/* 2. Content: Address, Price, Items */}
      <div className="flex-1 flex flex-col gap-1.5 sm:gap-2">
         <div>
            <h3 className="font-display text-lg font-semibold text-emerald-900 dark:text-brand-100 sm:text-xl line-clamp-2 leading-tight">
               {order.customerAddress || 'No address provided'}
            </h3>
            <p className="flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400 mt-1">
                <MapPin className="h-3.5 w-3.5" />
                {order.customerName}
            </p>
         </div>

         {/* Price & Items Row */}
         <div className="mt-1 flex items-end justify-between sm:mt-2">
             <div className="flex flex-col">
                 <div className="flex items-center gap-1.5 mb-0.5">
                     {isCOD ? <Wallet className="h-3 w-3 text-red-500" /> : <CreditCard className="h-3 w-3 text-emerald-500" />}
                     <span className={`text-[10px] font-bold uppercase tracking-wider ${isCOD ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                       {isCOD ? 'Cash' : 'Prepaid'}
                     </span>
                 </div>
                 <div className="text-base font-semibold text-brand-700 dark:text-brand-300 sm:text-lg">
                      {formatCurrency(order.totalAmount)}
                 </div>
             </div>

             {/* Items Toggle */}
             <button
               type="button"
               onClick={() => setItemsExpanded(!itemsExpanded)}
               className="flex max-w-[60%] items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
             >
               <Package className="h-3.5 w-3.5 shrink-0" />
               <span className="truncate">{itemCount} items {itemsExpanded ? '' : `• ${collapsedSummary}`}</span>
               {itemsExpanded ? <ChevronDown className="h-3 w-3 shrink-0" /> : <ChevronRight className="h-3 w-3 shrink-0" />}
             </button>
         </div>

         {/* Expanded Items List */}
         {itemsExpanded && (
           <div className="mt-2 rounded-xl bg-slate-50 p-3 text-sm text-slate-600 dark:bg-slate-800/50 dark:text-slate-300 animate-in fade-in slide-in-from-top-1">
             <ul className="space-y-1">
               {order.items.map((item, idx) => (
                 <li key={idx} className="flex justify-between items-start">
                   <span className="line-clamp-1 mr-2">{item.name}</span>
                   <span className="font-mono font-semibold text-slate-900 dark:text-slate-100 shrink-0">x{item.quantity}</span>
                 </li>
               ))}
             </ul>
           </div>
         )}
      </div>

      {/* 3. Footer: Actions */}
      <div className="mt-4 flex items-center justify-end gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
        <a
            href={mapUrl}
            target="_blank"
            rel="noreferrer"
            className={`group/btn inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-emerald-50 hover:text-emerald-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-emerald-900/30 dark:hover:text-emerald-400 ${!mapUrl ? 'opacity-50 pointer-events-none' : ''}`}
        >
            <Navigation className="h-4 w-4" />
            <span className="hidden sm:inline">Nav</span>
        </a>
        <a
            href={callHref}
            className={`group/btn inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-emerald-50 hover:text-emerald-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-emerald-900/30 dark:hover:text-emerald-400 ${!callHref ? 'opacity-50 pointer-events-none' : ''}`}
        >
            <Phone className="h-4 w-4" />
            <span className="hidden sm:inline">Call</span>
        </a>
        {isPrimary ? (
            <button
                type="button"
                onClick={() => onAdvanceStatus(order, nextStatus)}
                disabled={isUpdating}
                className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-1 disabled:opacity-50 sm:py-2.5"
            >
                {order.status === 'confirmed' ? <Truck className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                {buttonLabel}
            </button>
        ) : onMakeActive ? (
            <button
                type="button"
                onClick={() => onMakeActive(order)}
                disabled={isUpdating}
                className="inline-flex items-center gap-2 rounded-full border-2 border-slate-900 bg-white px-4 py-2 text-sm font-bold text-slate-900 shadow-sm transition hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-1 disabled:opacity-50 sm:py-2.5 dark:border-slate-100 dark:bg-slate-900 dark:text-white dark:hover:bg-slate-800"
            >
                <Play className="h-4 w-4 fill-current" />
                Start
            </button>
        ) : null}
      </div>
    </article>
  );
}
