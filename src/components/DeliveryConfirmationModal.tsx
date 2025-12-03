import React, { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { CheckCircle, Wallet, CreditCard, X, Banknote, QrCode } from 'lucide-react';
import type { OrderRecord } from '../types';
import { formatCurrency } from '../utils/formatCurrency';

interface DeliveryConfirmationModalProps {
  order: OrderRecord | null;
  isOpen: boolean;
  onConfirm: (method: string) => void;
  onCancel: () => void;
  isUpdating: boolean;
}

export function DeliveryConfirmationModal({
  order,
  isOpen,
  onConfirm,
  onCancel,
  isUpdating,
}: DeliveryConfirmationModalProps): JSX.Element {
  if (!order) return <></>;

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onCancel}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-sm transform overflow-hidden rounded-3xl bg-white p-6 text-left align-middle shadow-xl transition-all dark:bg-slate-900">
                <div className="flex justify-between items-start">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-bold leading-6 text-slate-900 dark:text-white"
                  >
                    Confirm Delivery
                  </Dialog.Title>
                  <button onClick={onCancel} className="rounded-full p-1 hover:bg-slate-100 dark:hover:bg-slate-800 transition">
                    <X className="h-5 w-5 text-slate-400" />
                  </button>
                </div>

                <div className="mt-6 flex flex-col items-center justify-center space-y-4">
                    {/* 1. The Big Number */}
                    <div className="text-center">
                        <p className="text-sm font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                            Collect Amount
                        </p>
                        <div className="text-4xl font-black tracking-tight text-slate-900 dark:text-white">
                            {formatCurrency(order.totalAmount)}
                        </div>
                    </div>

                    {/* 2. Payment Prompt */}
                    <div className="w-full text-center">
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            How did the customer pay?
                        </p>
                    </div>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white py-4 shadow-sm hover:bg-slate-50 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700"
                    onClick={() => onConfirm('cash')}
                    disabled={isUpdating}
                  >
                    <Banknote className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
                    <span className="font-bold text-slate-900 dark:text-white">Cash</span>
                  </button>
                  <button
                    type="button"
                    className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white py-4 shadow-sm hover:bg-slate-50 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700"
                    onClick={() => onConfirm('upi')}
                    disabled={isUpdating}
                  >
                    <QrCode className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                    <span className="font-bold text-slate-900 dark:text-white">UPI</span>
                  </button>
                </div>

                <div className="mt-6">
                  <button
                     type="button"
                     className="w-full rounded-xl px-4 py-2 text-sm font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                     onClick={onCancel}
                     disabled={isUpdating}
                  >
                    Cancel
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}