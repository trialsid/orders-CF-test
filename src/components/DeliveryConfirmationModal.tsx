import React, { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { CheckCircle, Wallet, CreditCard, X, Banknote, QrCode } from 'lucide-react';
import type { OrderRecord } from '../types';
import { formatCurrency } from '../utils/formatCurrency';

interface DeliveryConfirmationModalProps {
  order: OrderRecord | null;
  isOpen: boolean;
  onConfirm: () => void;
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

  const isCOD = order.paymentMethod?.toLowerCase().includes('cash') || order.paymentMethod === 'COD';
  const isUPI = order.paymentMethod?.toLowerCase().includes('upi');
  const isPrepaid = !isCOD && !isUPI; // Simplified assumption

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
                        <div className={`text-4xl font-black tracking-tight ${isPrepaid ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-white'}`}>
                            {formatCurrency(order.totalAmount)}
                        </div>
                    </div>

                    {/* 2. Payment Context Box */}
                    <div className={`w-full rounded-2xl border p-4 text-center ${
                        isCOD 
                            ? 'border-red-100 bg-red-50 text-red-900 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-100'
                            : isUPI
                                ? 'border-purple-100 bg-purple-50 text-purple-900 dark:border-purple-900/50 dark:bg-purple-900/20 dark:text-purple-100'
                                : 'border-emerald-100 bg-emerald-50 text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-900/20 dark:text-emerald-100'
                    }`}>
                        <div className="flex flex-col items-center gap-2">
                             {isCOD && <Banknote className="h-8 w-8 text-red-600 dark:text-red-400" />}
                             {isUPI && <QrCode className="h-8 w-8 text-purple-600 dark:text-purple-400" />}
                             {isPrepaid && <CheckCircle className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />}
                             
                             <p className="font-bold text-lg">
                                {isCOD && 'Collect Cash'}
                                {isUPI && 'Scan UPI QR'}
                                {isPrepaid && 'Already Paid'}
                             </p>
                             <p className="text-xs opacity-80 font-medium uppercase tracking-wide">
                                {order.paymentMethod || 'Unknown Method'}
                             </p>
                        </div>
                    </div>

                    {/* 3. Customer Info Summary */}
                     <div className="w-full text-center border-t border-slate-100 pt-4 mt-2 dark:border-slate-800">
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            Customer: <span className="font-semibold text-slate-900 dark:text-slate-200">{order.customerName}</span>
                        </p>
                     </div>
                </div>

                <div className="mt-8">
                  <button
                    type="button"
                    className={`inline-flex w-full justify-center rounded-xl px-4 py-3.5 text-base font-bold text-white shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 transition-all active:scale-[0.98] ${
                         isCOD
                            ? 'bg-slate-900 hover:bg-slate-800 shadow-slate-900/20 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200' 
                            : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-900/20 focus-visible:ring-emerald-500'
                    }`}
                    onClick={onConfirm}
                    disabled={isUpdating}
                  >
                    {isUpdating ? 'Completing...' : (
                        <span className="flex items-center gap-2">
                            <CheckCircle className="h-5 w-5" />
                            {isPrepaid ? 'Handed Over & Complete' : 'Payment Received & Complete'}
                        </span>
                    )}
                  </button>
                  <button
                     type="button"
                     className="mt-3 w-full rounded-xl px-4 py-2 text-sm font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
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