import React, { useMemo, useRef, useState, useEffect } from 'react';
import { ShoppingCart } from 'lucide-react';
import { useNavigate, useOutletContext, useLocation } from 'react-router-dom';
import ProductsSection from '../components/ProductsSection';
import type { AppOutletContext } from '../layouts/MainLayout';
import { useTranslations } from '../i18n/i18n';
import { formatCurrency } from '../utils/formatCurrency';
import MobileStickyAction from '../components/MobileStickyAction';

function BrowsePage(): JSX.Element {
  const sectionRef = useRef<HTMLElement | null>(null);
  const { products, cart } = useOutletContext<AppOutletContext>();
  const navigate = useNavigate();
  const { t } = useTranslations();
  const location = useLocation();
  const [stickyHeight, setStickyHeight] = useState(0);

  const searchTerm = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get('search') || '';
  }, [location.search]);

  const filterFromQuery = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get('filter') || 'all';
  }, [location.search]);

  const filteredAndSearchedProducts = useMemo(() => {
    const baseProducts = products.filteredProducts || [];

    if (!searchTerm) {
      return baseProducts;
    }

    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    return baseProducts.filter(
      (product) =>
        product.name.toLowerCase().includes(lowerCaseSearchTerm) ||
        product.description?.toLowerCase().includes(lowerCaseSearchTerm) ||
        product.category?.toLowerCase().includes(lowerCaseSearchTerm) ||
        product.department?.toLowerCase().includes(lowerCaseSearchTerm)
    );
  }, [products.filteredProducts, searchTerm]);

  const statusText = useMemo(() => {
    if (products.isLoading) {
      return t('products.status.loading');
    }

    if (products.loadError) {
      return t('products.status.error');
    }

    const count = filteredAndSearchedProducts?.length ?? 0;
    const note = products.storeNote?.trim() ?? '';

    if (!count) {
      if (searchTerm) {
        return t('products.status.emptySearch', { term: searchTerm });
      }
      if (products.filter === 'all') {
        return t('products.status.emptyAll');
      }
      return t('products.status.emptyFilter', { department: products.filter });
    }

    if (searchTerm) {
      return t('products.status.availableSearch', { count, term: searchTerm });
    }

    if (products.filter === 'all') {
      if (note) {
        return t('products.status.availableAllWithNote', { count, note });
      }
      return t('products.status.availableAll', { count });
    }

    return t('products.status.availableDepartment', {
      count,
      department: products.filter,
    });
  }, [products.filter, filteredAndSearchedProducts.length, products.isLoading, products.loadError, products.storeNote, t, searchTerm]);

  const handleFilterChange = (department: string) => {
    products.setFilter(department);
    // Clear search term from URL when applying a new filter
    navigate(`/browse${department === 'all' ? '' : `?filter=${department}`}`, { replace: true });
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

  useEffect(() => {
    if (!cart.hasItems) {
      setStickyHeight(0);
    }
  }, [cart.hasItems]);

  useEffect(() => {
    const desiredFilter =
      products.departments.includes(filterFromQuery) || filterFromQuery === 'all'
        ? filterFromQuery
        : 'all';
    if (desiredFilter !== products.filter) {
      products.setFilter(desiredFilter);
    }
  }, [filterFromQuery, products.filter, products.departments, products.setFilter]);

  return (
    <>
      <ProductsSection
        sectionRef={sectionRef}
        departments={products.departments}
        filter={products.filter}
        onFilterChange={handleFilterChange}
        products={filteredAndSearchedProducts}
        statusText={statusText}
        onAddToCart={cart.addItem}
        onUpdateQuantity={cart.updateQuantity}
        getQuantity={(productId) => quantityById.get(productId) ?? 0}
        paddingBottom={stickyHeight + 20}
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
        onHeightChange={setStickyHeight}
      />
    </>
  );
}

export default BrowsePage;
