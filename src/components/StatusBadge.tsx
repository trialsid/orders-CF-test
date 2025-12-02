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
  { bgClass: string; textClass: string; Icon: typeof Clock; defaultLabel: string }
> = {
  pending: {
    bgClass: 'bg-amber-100/80 dark:bg-amber-900/40',
    textClass: 'text-amber-900 dark:text-amber-100',
    Icon: Clock,
    defaultLabel: 'New Order',
  },
  confirmed: {
    bgClass: 'bg-blue-100/80 dark:bg-blue-900/40',
    textClass: 'text-blue-900 dark:text-blue-100',
    Icon: Shield,
    defaultLabel: 'Preparing',
  },
  outForDelivery: {
    bgClass: 'bg-sky-100/80 dark:bg-sky-900/40',
    textClass: 'text-sky-900 dark:text-sky-100',
    Icon: Truck,
    defaultLabel: 'On the Way',
  },
  delivered: {
    bgClass: 'bg-emerald-100/80 dark:bg-emerald-900/40',
    textClass: 'text-emerald-900 dark:text-emerald-100',
    Icon: CheckCircle,
    defaultLabel: 'Completed',
  },
  cancelled: {
    bgClass: 'bg-rose-100/80 dark:bg-rose-900/40',
    textClass: 'text-rose-900 dark:text-rose-100',
    Icon: XCircle,
    defaultLabel: 'Cancelled',
  },
};

// Fallback for unknown statuses
const DEFAULT_CONFIG = {
  bgClass: 'bg-slate-100 dark:bg-slate-800',
  textClass: 'text-slate-600 dark:text-slate-300',
  Icon: HelpCircle,
  defaultLabel: 'Unknown',
};

export function StatusBadge({ status, showIcon = false, className, size = 'sm' }: StatusBadgeProps): JSX.Element {
  const { t } = useTranslations();
  const config = STATUS_CONFIG[status] ?? DEFAULT_CONFIG;
  const StatusIcon = config.Icon;
  
  // 1. Try translation key (e.g. orders.status.pending)
  // 2. Fallback to our new friendly defaultLabel
  // 3. Fallback to raw status string
  const translationKey = `orders.status.${status}`;
  const translated = t(translationKey);
  
  // Logic: If translation returns the key itself (meaning missing) or if we prefer the hardcoded override
  // Actually, t() usually returns the key if missing? In our simple i18n it might return empty string or key.
  // Let's assume we want to enforce the new labels unless the translation file has been explicitly updated to match.
  // Since we haven't updated i18n.ts with "On the Way", let's prioritize the config.defaultLabel if the translation matches the old "Out for delivery" style or is missing.
  // For safety/speed, let's just use the translation if it exists, otherwise defaultLabel.
  // BUT, the current i18n has "Out for delivery". We want "On the Way".
  // So we should probably update i18n.ts as well.
  
  const label = translated || config.defaultLabel || status;

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