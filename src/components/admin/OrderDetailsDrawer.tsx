import React from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { OrderDetailsPanel } from './OrderDetailsPanel';
import type { OrderRecord, OrderStatus } from '../../types';

interface OrderDetailsDrawerProps {
  order: OrderRecord;
  isOpen: boolean;
  onClose: () => void;
  onStatusChange: (orderId: string, nextStatus: OrderStatus, paymentCollectedMethod?: string) => Promise<void>;
  onOrderUpdate?: () => void;
}

export function OrderDetailsDrawer({ order, isOpen, onClose, onStatusChange, onOrderUpdate }: OrderDetailsDrawerProps) {
  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full justify-end text-center">
            <Transition.Child
              as={Fragment}
              enter="transform transition ease-in-out duration-300"
              enterFrom="translate-x-full"
              enterTo="translate-x-0"
              leave="transform transition ease-in-out duration-300"
              leaveFrom="translate-x-0"
              leaveTo="translate-x-full"
            >
              <Dialog.Panel className="w-full max-w-md transform bg-white text-left align-middle shadow-xl transition-all dark:bg-slate-900">
                <OrderDetailsPanel
                  order={order}
                  onClose={onClose}
                  onStatusChange={onStatusChange}
                  onOrderUpdate={onOrderUpdate}
                />
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
