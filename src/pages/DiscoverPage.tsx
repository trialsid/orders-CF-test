import React, { useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import ProductsSection from '../components/ProductsSection';
import type { AppOutletContext } from '../layouts/MainLayout';

function DiscoverPage(): JSX.Element {
  const sectionRef = useRef<HTMLElement | null>(null);
  const { products, cart } = useOutletContext<AppOutletContext>();

  const handleFilterChange = (category: string) => {
    products.setFilter(category);
  };

  return (
    <ProductsSection
      sectionRef={sectionRef}
      categories={products.categories}
      filter={products.filter}
      onFilterChange={handleFilterChange}
      products={products.filteredProducts}
      statusText={products.productsStatusText}
      onAddToCart={cart.addItem}
    />
  );
}

export default DiscoverPage;
