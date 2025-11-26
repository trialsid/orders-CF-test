import type { Story } from '@ladle/react';
import React from 'react';
import AdminPage from './AdminPage';
import { AuthContext } from '../context/AuthContext';
import { AuthUser, OrderRecord, User } from '../types';

const mockAdminUser: AuthUser = {
  id: 'admin-1',
  phone: '9999999999',
  role: 'admin',
  status: 'active',
  fullName: 'Store Manager',
};

const mockOrders: OrderRecord[] = [
  {
    id: 'ORD-001',
    customerName: 'Alice Johnson',
    customerPhone: '9876543210',
    totalAmount: 450,
    status: 'pending',
    createdAt: new Date().toISOString(),
    items: [],
    currency: 'INR',
    paymentMethod: 'Cash on delivery',
    deliverySlot: '11:30 AM'
  },
  {
    id: 'ORD-002',
    customerName: 'Bob Smith',
    customerPhone: '9123456780',
    totalAmount: 1200,
    status: 'confirmed',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    items: [],
    currency: 'INR',
    paymentMethod: 'UPI',
    deliverySlot: '6:30 PM'
  },
  {
    id: 'ORD-003',
    customerName: 'Charlie Brown',
    totalAmount: 300,
    status: 'outForDelivery',
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    items: [],
    currency: 'INR'
  },
  {
    id: 'ORD-004',
    customerName: 'Diana Prince',
    totalAmount: 850,
    status: 'delivered',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    items: [],
    currency: 'INR'
  }
];

const mockUsers: User[] = [
    { id: '1', phone: '9999999999', role: 'admin', status: 'active', full_name: 'Store Manager' },
    { id: '2', phone: '8888888888', role: 'rider', status: 'active', full_name: 'Rider Raj' },
    { id: '3', phone: '7777777777', role: 'customer', status: 'active', full_name: 'Customer Carrol' },
];

export const Dashboard: Story = () => {
  React.useEffect(() => {
    const originalFetch = window.fetch;
    window.fetch = async (url) => {
      const urlStr = url.toString();
      if (urlStr.includes('/orders') || urlStr.includes('/order')) {
        return {
          ok: true,
          json: async () => ({ orders: mockOrders })
        } as any;
      }
      if (urlStr.includes('/admin/users')) {
          return {
              ok: true,
              json: async () => ({ users: mockUsers })
          } as any;
      }
      if (urlStr.includes('/admin/config')) {
          return {
              ok: true,
              json: async () => ({ config: { minimumOrderAmount: 100 } })
          } as any;
      }
      // Mock Product Catalog fetch too if needed, or let it fail gracefully
       if (urlStr.includes('/admin/products')) {
            return {
            ok: true,
            json: async () => ({
                products: [],
                pagination: { page: 1, pages: 1, total: 0 }
            })
        } as Response;
       }
      
      return originalFetch(url as any);
    };
    return () => { window.fetch = originalFetch; };
  }, []);

  return (
    <AuthContext.Provider value={{
      user: mockAdminUser,
      token: 'mock-token',
      status: 'ready',
      authError: null,
      isAuthenticating: false,
      login: async () => mockAdminUser,
      register: async () => mockAdminUser,
      logout: () => {},
      revokeSessions: async () => {},
      refreshSession: async () => null,
    }}>
      <AdminPage />
    </AuthContext.Provider>
  );
};
