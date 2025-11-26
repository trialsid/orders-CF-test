import type { Story } from '@ladle/react';
import React from 'react';
import RiderPage from './RiderPage';
import { AuthContext } from '../context/AuthContext';
import { AuthUser, OrderRecord } from '../types';

const mockRiderUser: AuthUser = {
  id: 'rider-1',
  phone: '8888888888',
  role: 'rider',
  status: 'active',
  fullName: 'Rider Raj',
};

const mockRiderOrders: OrderRecord[] = [
  {
    id: 'ORD-101',
    customerName: 'Priya Reddy',
    customerPhone: '9876543210',
    customerAddress: 'Flat 402, Sunshine Apts, Gadwal',
    totalAmount: 550,
    status: 'confirmed', // Ready for pickup
    createdAt: new Date().toISOString(),
    items: [
        { id: '1', name: 'Milk', quantity: 2, unitPrice: 30, lineTotal: 60 },
        { id: '2', name: 'Bread', quantity: 1, unitPrice: 40, lineTotal: 40 },
    ],
    currency: 'INR',
    paymentMethod: 'Cash on delivery',
    deliverySlot: '11:30 AM'
  },
  {
    id: 'ORD-102',
    customerName: 'Rahul Kumar',
    customerPhone: '9123456780',
    customerAddress: 'H.No 1-2-3, Near Temple, Ieeja',
    totalAmount: 120,
    status: 'outForDelivery', // Currently delivering
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    items: [
        { id: '3', name: 'Curd', quantity: 2, unitPrice: 60, lineTotal: 120 }
    ],
    currency: 'INR',
    paymentMethod: 'UPI',
    deliverySlot: '11:30 AM'
  },
   {
    id: 'ORD-103',
    customerName: 'Waiting Customer',
    customerPhone: '9123456780',
    totalAmount: 900,
    status: 'pending', // Backlog
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    items: [],
    currency: 'INR',
    paymentMethod: 'UPI',
    deliverySlot: '6:30 PM'
  }
];

export const Default: Story = () => {
  React.useEffect(() => {
    const originalFetch = window.fetch;
    window.fetch = async (url) => {
      const urlStr = url.toString();
      if (urlStr.includes('/orders') || urlStr.includes('/order')) {
        return {
          ok: true,
          json: async () => ({ orders: mockRiderOrders })
        } as any;
      }
      return originalFetch(url as any);
    };
    return () => { window.fetch = originalFetch; };
  }, []);

  return (
    <AuthContext.Provider value={{
      user: mockRiderUser,
      token: 'mock-token',
      status: 'ready',
      authError: null,
      isAuthenticating: false,
      login: async () => mockRiderUser,
      register: async () => mockRiderUser,
      logout: () => {},
      revokeSessions: async () => {},
      refreshSession: async () => null,
    }}>
      <div className="pb-24"> {/* Add padding for sticky footer */}
        <RiderPage />
      </div>
    </AuthContext.Provider>
  );
};

export const EmptyQueue: Story = () => {
  React.useEffect(() => {
    const originalFetch = window.fetch;
    window.fetch = async (url) => {
        return {
          ok: true,
          json: async () => ({ orders: [] })
        } as any;
    };
    return () => { window.fetch = originalFetch; };
  }, []);

  return (
    <AuthContext.Provider value={{
      user: mockRiderUser,
      token: 'mock-token',
      status: 'ready',
      authError: null,
      isAuthenticating: false,
      login: async () => mockRiderUser,
      register: async () => mockRiderUser,
      logout: () => {},
      revokeSessions: async () => {},
      refreshSession: async () => null,
    }}>
      <RiderPage />
    </AuthContext.Provider>
  );
};
