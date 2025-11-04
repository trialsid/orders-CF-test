import React, { useMemo, useRef } from 'react';
import { ShoppingCart } from 'lucide-react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import ProductsSection from '../components/ProductsSection';
import type { AppOutletContext } from '../layouts/MainLayout';
import { useTranslations } from '../i18n/i18n';
import { formatCurrency } from '../utils/formatCurrency';
import MobileStickyAction from '../components/MobileStickyAction';

function DiscoverPage(): JSX.Element {
  const sectionRef = useRef<HTMLElement | null>(null);
  const { products, cart } = useOutletContext<AppOutletContext>();
  const navigate = useNavigate();
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

  const totalQuantity = cart.cartItems.reduce((sum, entry) => sum + entry.quantity, 0);
  const cartTotal = cart.cartTotal;
  const quantityById = useMemo(() => {
    const map = new Map<string, number>();
    cart.cartItems.forEach(({ product, quantity }) => {
      map.set(product.id, quantity);
    });
    return map;
  }, [cart.cartItems]);
  const handleGoToCart = () => {
    navigate('/cart');
  };

  return (
    <>
      <ProductsSection
        sectionRef={sectionRef}
        categories={products.categories}
        filter={products.filter}
        onFilterChange={handleFilterChange}
        products={products.filteredProducts}
        statusText={statusText}
        onAddToCart={cart.addItem}
        onUpdateQuantity={cart.updateQuantity}
        getQuantity={(productId) => quantityById.get(productId) ?? 0}
      />
      <MobileStickyAction
        hidden={!cart.hasItems}
        onClick={handleGoToCart}
        label={t('products.actions.viewCart')}
        icon={<ShoppingCart className="h-5 w-5" />}
        helperText={t('products.stickySummary', {
          count: totalQuantity,
          total: formatCurrency(cartTotal),
        })}
        badge={totalQuantity > 0 ? totalQuantity : undefined}
      />
    </>
  );
}

export default DiscoverPage;
