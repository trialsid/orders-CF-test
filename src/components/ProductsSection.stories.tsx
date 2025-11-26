import type { Story } from '@ladle/react';
import React, { useState } from 'react';
import ProductsSection from './ProductsSection';
import { mockProducts } from '../../.ladle/mocks';

const departments = ['Fresh Produce', 'Groceries', 'Dairy & Breakfast', 'Snacks'];

export const Default: Story = () => {
  const [filter, setFilter] = useState('all');
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  const handleUpdateQuantity = (id: string, delta: number) => {
    setQuantities(prev => ({
      ...prev,
      [id]: Math.max(0, (prev[id] || 0) + delta)
    }));
  };

  const filteredProducts = filter === 'all' 
    ? mockProducts 
    : mockProducts.filter(p => p.department === filter);

  return (
    <ProductsSection
      departments={departments}
      filter={filter}
      onFilterChange={setFilter}
      products={filteredProducts}
      statusText={`${filteredProducts.length} items available`}
      onAddToCart={(p) => handleUpdateQuantity(p.id, 1)}
      getQuantity={(id) => quantities[id] || 0}
      onUpdateQuantity={handleUpdateQuantity}
    />
  );
};

export const Empty: Story = () => (
  <ProductsSection
    departments={departments}
    filter="all"
    onFilterChange={() => {}}
    products={[]}
    statusText="No items available right now."
    onAddToCart={() => {}}
  />
);
