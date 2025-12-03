import type { Story } from '@ladle/react';
import React, { useState } from 'react';
import { OrderDetailsDrawer } from './OrderDetailsDrawer';
import { OrderRecord, OrderStatus } from '../../types';

const mockOrder: OrderRecord = {
    id: 'ORD-12345-ABCDE',
    customerName: 'Surya Reddy',
    customerPhone: '9876543210',
    customerAddress: 'Flat 101, Green Apts, Ieeja',
    totalAmount: 450,
    currency: 'INR',
    status: 'pending',
    createdAt: new Date().toISOString(),
    deliverySlot: '11:30 AM',
    paymentMethod: 'pay_on_delivery',
    deliveryInstructions: 'Ring bell twice',
    items: [
        { id: '1', name: 'Tomatoes', quantity: 2, unitPrice: 40, lineTotal: 80 },
        { id: '2', name: 'Atta 5kg', quantity: 1, unitPrice: 370, lineTotal: 370 },
    ]
};

export const Default: Story = () => {
    const [isOpen, setIsOpen] = useState(true);
    const [order, setOrder] = useState(mockOrder);

    React.useEffect(() => {
        const originalFetch = window.fetch;
        window.fetch = async (url) => {
             if (url.toString().includes('/order?id=')) {
                 return {
                     ok: true,
                     status: 200,
                     headers: { get: () => 'etag-123' },
                     json: async () => ({ orders: [order] })
                 } as any;
             }
             return originalFetch(url as any);
        };
        return () => { window.fetch = originalFetch; };
    }, [order]);

    const handleStatusChange = async (id: string, status: OrderStatus, paymentCollectedMethod?: string) => {
        console.log('Changing status to', status, paymentCollectedMethod);
        await new Promise(r => setTimeout(r, 1000));
        setOrder(prev => ({ ...prev, status, paymentCollectedMethod: paymentCollectedMethod ?? prev.paymentCollectedMethod }));
    };

    return (
        <div className="p-4">
            <button onClick={() => setIsOpen(true)} className="btn btn-primary">Open Drawer</button>
            <OrderDetailsDrawer 
                order={order}
                isOpen={isOpen} 
                onClose={() => setIsOpen(false)} 
                onStatusChange={handleStatusChange}
            />
        </div>
    );
};

export const Delivered: Story = () => (
     <OrderDetailsDrawer 
        order={{ ...mockOrder, status: 'delivered', paymentCollectedMethod: 'cash' }}
        isOpen={true} 
        onClose={() => {}} 
        onStatusChange={async () => {}}
    />
);
