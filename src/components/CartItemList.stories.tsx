import type { Story } from '@ladle/react';
import React, { useState } from 'react';
import CartItemList from './CartItemList';
import { mockProducts } from '../../.ladle/mocks';
import { CartEntry } from '../types';

export const Default: Story = () => {
    const [items, setItems] = useState<CartEntry[]>([
        { product: mockProducts[0], quantity: 1 },
        { product: mockProducts[1], quantity: 2 },
    ]);

    const handleUpdate = (id: string, delta: number) => {
        setItems(prev => {
            return prev.map(item => {
                if (item.product.id === id) {
                    const newQty = Math.max(0, item.quantity + delta);
                    return { ...item, quantity: newQty };
                }
                return item;
            }).filter(item => item.quantity > 0);
        });
    };

    return <CartItemList items={items} onUpdateQuantity={handleUpdate} />;
};

export const ReadOnly: Story = () => (
     <CartItemList 
        items={[
            { product: mockProducts[2], quantity: 1 },
            { product: mockProducts[3], quantity: 5 },
        ]} 
        onUpdateQuantity={() => {}} 
        readOnly 
    />
);

export const Empty: Story = () => <CartItemList items={[]} onUpdateQuantity={() => {}} />;
