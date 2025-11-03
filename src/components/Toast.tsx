import React, { useEffect } from 'react';
import { AlertTriangle, CheckCircle2, X } from 'lucide-react';

export type ToastMessage = {
  id: number;
  type: 'success' | 'error';
  title: string;
  description?: string;
};

type ToastProps = {
  toast: ToastMessage;
  onDismiss: (id: number) => void;
  duration?: number;
};

function Toast({ toast, onDismiss, duration = 5000 }: ToastProps): JSX.Element {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, duration);
    return () => {
      clearTimeout(timer);
    };
  }, [toast.id, duration, onDismiss]);

  const Icon = toast.type === 'success' ? CheckCircle2 : AlertTriangle;

  const toneClasses = toast.type === 'success'
    ? 'border-emerald-200 bg-white text-emerald-900 dark:border-emerald-700/60 dark:bg-slate-900 dark:text-emerald-100'
    : 'border-rose-200 bg-white text-rose-700 dark:border-rose-800/60 dark:bg-slate-900 dark:text-rose-100';

  return (
    <div className={`pointer-events-auto flex w-72 items-start gap-3 rounded-2xl border px-4 py-3 shadow-xl shadow-brand-900/20 ${toneClasses}`}>
      <Icon className="mt-1 h-5 w-5 flex-shrink-0" />
      <div className="flex-1 text-sm">
        <p className="font-semibold leading-snug">{toast.title}</p>
        {toast.description && <p className="mt-1 text-xs leading-snug opacity-80">{toast.description}</p>}
      </div>
      <button
        type="button"
        aria-label="Dismiss notification"
        onClick={() => onDismiss(toast.id)}
        className="rounded-full p-1 text-current transition hover:bg-black/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-200 dark:hover:bg-white/10"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export default Toast;
