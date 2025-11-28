import React from 'react';
import { Clock3, Wallet, Package, ChevronRight, Truck, Eye } from 'lucide-react';
import { OrderRecord } from '../types';
import { formatCurrency } from '../utils/formatCurrency';
import { StatusBadge } from './StatusBadge';
import { useTranslations } from '../i18n/i18n';

interface OrderCardProps {
  order: OrderRecord;
}

export function OrderCard({ order }: OrderCardProps): JSX.Element {
  const { t, locale } = useTranslations();

  const orderDate = order.createdAt ? new Date(order.createdAt) : undefined;
  const formattedDate = orderDate
    ? new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric' }).format(orderDate)
    : '';

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
    <article className="group relative overflow-hidden rounded-3xl border border-emerald-100/80 bg-white shadow-sm transition-all hover:shadow-md dark:border-emerald-900/60 dark:bg-slate-900/80">
      
      {/* 1. Top Row: Context (Date, ID, Status) */}
      <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-5 py-3 dark:border-slate-800 dark:bg-slate-900/50">
        <div className="flex items-center gap-3">
            <div className="flex flex-col">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    {formattedDate}
                </span>
                <span className="font-mono text-xs text-slate-400 dark:text-slate-500">
                    #{order.id.slice(0, 8)}
                </span>
            </div>
        </div>
        <StatusBadge status={order.status} />
      </div>

      {/* 2. Middle Row: Content (Visuals & Summary) */}
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
            {/* Left: Product Info */}
            <div className="flex-1">
                <h3 className="font-semibold text-slate-900 dark:text-slate-100 line-clamp-1">
                    {summaryText}
                </h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    {itemCount} {itemCount === 1 ? 'item' : 'items'} &bull; {formatCurrency(order.totalAmount)}
                </p>
                
                {/* Thumbnails (Simulated with icons since we might not have images on OrderItem yet, 
                    but if we did, <img /> would go here) */}
                <div className="mt-3 flex items-center -space-x-2 overflow-hidden py-1">
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

             {/* Right: Slot/Payment Info (Compact) */}
             <div className="hidden flex-col items-end gap-1.5 sm:flex">
                {order.deliverySlot && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                        <Clock3 className="h-3 w-3" />
                        {order.deliverySlot}
                    </span>
                )}
                 {order.paymentMethod && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                        <Wallet className="h-3 w-3" />
                        {order.paymentMethod}
                    </span>
                )}
             </div>
        </div>
      </div>

      {/* 3. Bottom Row: Smart Actions */}
      <div className="flex items-center justify-between border-t border-slate-100 bg-white px-5 py-3 dark:border-slate-800 dark:bg-slate-900">
         {/* Status Context Text (Optional, e.g. "Arriving Today") */}
         <div className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
            {/* Logic to show something relevant based on status could go here */}
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
                    className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-1"
                 >
                    <Truck className="h-3.5 w-3.5" />
                    Track
                 </button>
             ) : (
                <button
                    type="button"
                    className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-1 dark:bg-slate-700 dark:hover:bg-slate-600"
                >
                    Reorder
                </button>
             )}
         </div>
      </div>
    </article>
  );
}
