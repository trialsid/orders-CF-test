import React from 'react';
import { Package, Truck, Eye, Clock3, Wallet } from 'lucide-react';
import { OrderRecord } from '../types';
import { formatCurrency } from '../utils/formatCurrency';
import { StatusBadge } from './StatusBadge';
import { useTranslations } from '../i18n/i18n';
import { formatPaymentMethod } from '../utils/formatPayment';

interface OrderCardProps {
  order: OrderRecord;
}

export function OrderCard({ order }: OrderCardProps): JSX.Element {
  const { locale } = useTranslations();

  const orderDate = order.createdAt ? new Date(order.createdAt) : undefined;
  const formattedDate = orderDate
    ? new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric' }).format(orderDate)
    : '';

  // Friendly delivery slot display (falls back to raw string if not parseable as date)
  const slotLabel = (() => {
    if (!order.deliverySlot) return undefined;
    const slotDate = new Date(order.deliverySlot);
    return Number.isNaN(slotDate.getTime())
      ? order.deliverySlot
      : slotDate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  })();

  // Sort items by lineTotal (descending) to find the "hero" item and for preview
  const sortedItems = [...order.items].sort((a, b) => b.lineTotal - a.lineTotal);

  // The "Hero" item is the most expensive one
  const heroItem = sortedItems[0];
  const mainItemName = heroItem?.name || 'Item';

  // Get first few items for visual preview (from sorted list)
  const previewItems = sortedItems.slice(0, 3);
  const remainingCount = Math.max(0, order.items.length - previewItems.length);
  
  // Logic to determine main items summary text
  const itemCount = order.items.reduce((acc, item) => acc + item.quantity, 0);
  const summaryText = `${mainItemName}${order.items.length > 1 ? ` + ${order.items.length - 1} more` : ''}`;

  return (
    <article className="group flex flex-col justify-between rounded-3xl border border-emerald-100/70 bg-white/95 p-4 shadow-md shadow-brand-900/10 transition hover:-translate-y-1 hover:shadow-lg dark:border-emerald-900/60 dark:bg-slate-900/70 sm:p-6">
      
      {/* 1. Header: Date/ID & Status */}
      <div className="flex items-start justify-between mb-2 sm:mb-4">
        <div className="flex flex-col gap-1.5">
             <div className="flex items-center gap-2">
                <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                    {formattedDate}
                </span>
                <span className="font-mono text-xs text-slate-400 dark:text-slate-500">
                    #{order.id.slice(0, 8)}
                </span>
             </div>
             {/* Metadata Row: Slot & Payment */}
             <div className="flex items-center gap-3 px-1 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                {slotLabel && (
                    <div className="flex items-center gap-1">
                        <Clock3 className="h-3 w-3 text-slate-400" />
                        <span>{slotLabel}</span>
                    </div>
                )}
                {order.paymentMethod && (
                    <div className="flex items-center gap-1">
                        <Wallet className="h-3 w-3 text-slate-400" />
                        <span>{formatPaymentMethod(order.paymentMethod)}</span>
                    </div>
                )}
             </div>
        </div>
        <StatusBadge status={order.status} />
      </div>

      {/* 2. Content: Title, Price, Thumbnails */}
      <div className="flex-1 flex flex-col gap-1.5 sm:gap-2">
           <div>
                <h3 className="font-display text-lg font-semibold text-emerald-900 dark:text-brand-100 sm:text-xl line-clamp-1">
                    {summaryText}
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                    {itemCount} {itemCount === 1 ? 'item' : 'items'}
                </p>
           </div>
           
           <div className="mt-1 flex items-center justify-between sm:mt-2">
               <div className="text-base font-semibold text-brand-700 dark:text-brand-300 sm:text-lg">
                    {formatCurrency(order.totalAmount)}
               </div>

               {/* Thumbnails */}
               <div className="flex items-center -space-x-2 overflow-hidden py-1">
                    {previewItems.map((item, idx) => (
                        <div 
                            key={item.id + idx} 
                            className="inline-flex h-8 w-8 items-center justify-center rounded-full ring-2 ring-white bg-emerald-50 text-emerald-600 dark:ring-slate-900 dark:bg-emerald-900/30 dark:text-emerald-400"
                            title={item.name}
                        >
                           <Package className="h-4 w-4" />
                        </div>
                    ))}
                    {remainingCount > 0 && (
                         <div className="inline-flex h-8 w-8 items-center justify-center rounded-full ring-2 ring-white bg-slate-100 text-[10px] font-bold text-slate-600 dark:ring-slate-900 dark:bg-slate-800 dark:text-slate-300">
                            +{remainingCount}
                        </div>
                    )}
                </div>
           </div>
      </div>

      {/* 3. Footer: Actions */}
      <div className="mt-5 flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
         {/* Status Context Text */}
         <div className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
            {order.status === 'outForDelivery' ? 'Arriving soon' : ''}
         </div>

         <div className="flex items-center gap-3">
             {/* Secondary Action */}
             <button
                type="button"
                 className="group/btn inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 transition hover:text-emerald-700 dark:text-slate-400 dark:hover:text-emerald-400"
             >
                <Eye className="h-4 w-4" />
                <span className="hidden sm:inline">Details</span>
             </button>

             {/* Primary Action */}
             {['pending', 'confirmed', 'outForDelivery'].includes(order.status) ? (
                 <button
                    type="button"
                    className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-1 sm:py-2.5"
                 >
                    <Truck className="h-4 w-4" />
                    Track
                 </button>
             ) : (
                <button
                    type="button"
                    className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-1 dark:bg-slate-700 dark:hover:bg-slate-600 sm:py-2.5"
                >
                    Reorder
                </button>
             )}
         </div>
      </div>
    </article>
  );
}
