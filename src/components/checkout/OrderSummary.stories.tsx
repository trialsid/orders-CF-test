import type { Story } from '@ladle/react';
import React, { useState } from 'react';
import { OrderSummary } from './OrderSummary';
import { mockProducts } from '../../../.ladle/mocks';
import { AuthUser, CartEntry } from '../../types';

const mockItems: CartEntry[] = [
    { product: mockProducts[0], quantity: 2 },
    { product: mockProducts[2], quantity: 1 },
];

const mockUser: AuthUser = {
    id: '1',
    phone: '9876543210',
    role: 'customer',
    status: 'active',
};

export const Guest: Story = () => (
    <div className="max-w-md mx-auto p-4">
        <OrderSummary
            cartItems={mockItems}
            cartTotal={122}
            hasItems={true}
            isSubmitting={false}
            user={null}
            updateQuantity={() => {}}
            onSubmit={() => console.log('Submit')}
            onLoginRedirect={() => console.log('Redirect to login')}
        />
    </div>
);

export const Authenticated: Story = () => (
    <div className="max-w-md mx-auto p-4">
        <OrderSummary
            cartItems={mockItems}
            cartTotal={122}
            hasItems={true}
            isSubmitting={false}
            user={mockUser}
            updateQuantity={() => {}}
            onSubmit={() => console.log('Submit')}
            onLoginRedirect={() => console.log('Redirect to login')}
        />
    </div>
);

export const Submitting: Story = () => (
    <div className="max-w-md mx-auto p-4">
        <OrderSummary
            cartItems={mockItems}
            cartTotal={122}
            hasItems={true}
            isSubmitting={true}
            user={mockUser}
            updateQuantity={() => {}}
            onSubmit={() => {}}
            onLoginRedirect={() => {}}
        />
    </div>
);

export const Empty: Story = () => (
    <div className="max-w-md mx-auto p-4">
        <OrderSummary
            cartItems={[]}
            cartTotal={0}
            hasItems={false}
            isSubmitting={false}
            user={mockUser}
            updateQuantity={() => {}}
            onSubmit={() => {}}
            onLoginRedirect={() => {}}
        />
    </div>
);
