import React, { useMemo, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import ProductsSection from '../components/ProductsSection';
import type { AppOutletContext } from '../layouts/MainLayout';
import { useTranslations } from '../i18n/i18n';

function DiscoverPage(): JSX.Element {
  const sectionRef = useRef<HTMLElement | null>(null);
  const { products, cart } = useOutletContext<AppOutletContext>();
  const { t } = useTranslations();

  const statusText = useMemo(() => {
    if (products.isLoading) {
      return t('products.status.loading');
    }

    if (products.loadError) {
      return t('products.status.error');
    }

    const count = products.filteredProducts.length;
    const note = products.storeNote.trim();

    if (!count) {
      if (products.filter === 'all') {
        return t('products.status.emptyAll');
      }
      return t('products.status.emptyFilter', { category: products.filter.toLowerCase() });
    }

    if (products.filter === 'all') {
      if (note) {
        return t('products.status.availableAllWithNote', { count, note });
      }
      return t('products.status.availableAll', { count });
    }

    return t('products.status.availableCategory', {
      count,
      category: products.filter.toLowerCase(),
    });
  }, [products.filter, products.filteredProducts.length, products.isLoading, products.loadError, products.storeNote, t]);

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
      statusText={statusText}
      onAddToCart={cart.addItem}
    />
  );
}

export default DiscoverPage;
