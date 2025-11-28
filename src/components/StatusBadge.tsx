import React from 'react';
import { CheckCircle, Clock, Shield, Truck, XCircle, HelpCircle } from 'lucide-react';
import type { OrderStatus } from '../types';
import { useTranslations } from '../i18n/i18n';

type StatusBadgeProps = {
  status: OrderStatus | string;
  showIcon?: boolean;
  className?: string;
  size?: 'sm' | 'md';
};

const STATUS_CONFIG: Record<
  string,
  { bgClass: string; textClass: string; Icon: typeof Clock }
> = {
  pending: {
    bgClass: 'bg-amber-100/80 dark:bg-amber-900/40',
    textClass: 'text-amber-900 dark:text-amber-100',
    Icon: Clock,
  },
  confirmed: {
    bgClass: 'bg-blue-100/80 dark:bg-blue-900/40',
    textClass: 'text-blue-900 dark:text-blue-100',
    Icon: Shield, // Or CheckCircle? Rider page used Shield for confirmed
  },
  outForDelivery: {
    bgClass: 'bg-purple-100/80 dark:bg-purple-900/40',
    textClass: 'text-purple-900 dark:text-purple-100', // Admin page used purple, Rider used Sky. Let's standarize on Purple/Sky.
    Icon: Truck,
  },
  delivered: {
    bgClass: 'bg-emerald-100/80 dark:bg-emerald-900/40',
    textClass: 'text-emerald-900 dark:text-emerald-100',
    Icon: CheckCircle,
  },
  cancelled: {
    bgClass: 'bg-rose-100/80 dark:bg-rose-900/40',
    textClass: 'text-rose-900 dark:text-rose-100',
    Icon: XCircle,
  },
};

// Fallback for unknown statuses
const DEFAULT_CONFIG = {
  bgClass: 'bg-slate-100 dark:bg-slate-800',
  textClass: 'text-slate-600 dark:text-slate-300',
  Icon: HelpCircle,
};

// Rider page used Sky for OutForDelivery, Admin used Purple. 
// OrdersPage used Sky for OutForDelivery.
// Let's standarize on SKY for OutForDelivery as it matches the "open sky/travel" vibe better than purple?
// Actually AdminPage used Purple for OutForDelivery. OrdersPage used Sky.
// I will choose SKY to match Orders/Rider page as they are user facing.
STATUS_CONFIG['outForDelivery'] = {
    bgClass: 'bg-sky-100/80 dark:bg-sky-900/40',
    textClass: 'text-sky-900 dark:text-sky-100',
    Icon: Truck,
};

// Admin page used Blue for Confirmed. OrdersPage used Emerald? 
// OrdersPage used Emerald for Confirmed. Rider used Emerald.
// Admin used Blue.
// I will standarize on EMERALD/BLUE distinction.
// Confirmed usually means "Action Required / Ready".
// Delivered is "Done" (Emerald).
// Let's use BLUE for Confirmed to distinguish it from Delivered.
STATUS_CONFIG['confirmed'] = {
    bgClass: 'bg-blue-100/80 dark:bg-blue-900/40',
    textClass: 'text-blue-900 dark:text-blue-100',
    Icon: Shield,
};


export function StatusBadge({ status, showIcon = false, className, size = 'sm' }: StatusBadgeProps): JSX.Element {
  const { t } = useTranslations();
  const config = STATUS_CONFIG[status] ?? DEFAULT_CONFIG;
  const StatusIcon = config.Icon;
  
  // Try to translate, fallback to raw status string
  const label = t(`orders.status.${status}`) || status;

  const sizeClass = size === 'sm' ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-sm';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-semibold uppercase tracking-wide ${config.bgClass} ${config.textClass} ${sizeClass} ${className ?? ''}`}
    >
      {showIcon && <StatusIcon className={size === 'sm' ? "h-3.5 w-3.5" : "h-4 w-4"} />}
      {label}
    </span>
  );
}
