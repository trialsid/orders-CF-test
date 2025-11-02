import { useEffect, useMemo, useState } from 'react';
import type { Product, ProductsResponse } from '../types';

const INITIAL_STATUS = 'Loading fresh items...';

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [statusMessage, setStatusMessage] = useState<string>(INITIAL_STATUS);
  const [storeNote, setStoreNote] = useState<string>('');

  useEffect(() => {
    let cancelled = false;

    async function loadProducts() {
      setStatusMessage(INITIAL_STATUS);
      try {
        const response = await fetch('/products');
        if (!response.ok) {
          throw new Error(`Failed to load products: ${response.status}`);
        }
        const data = (await response.json()) as ProductsResponse;
        if (cancelled) {
          return;
        }
        const items = data.items ?? [];
        setProducts(items);
        const message = (data.message ?? '').trim();
        setStoreNote(message);
        const uniqueCategories = [...new Set(items.map((item) => item.category))].sort();
        setCategories(uniqueCategories);
        setStatusMessage(message);
      } catch (error) {
        console.error(error);
        if (!cancelled) {
          setStatusMessage('Unable to load items right now. Please refresh later.');
        }
      }
    }

    loadProducts();

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredProducts = useMemo(() => {
    if (filter === 'all') {
      return products;
    }
    return products.filter((product) => product.category === filter);
  }, [products, filter]);

  const highlights = useMemo(() => products.slice(0, 3), [products]);

  const productsStatusText = useMemo(() => {
    if (!products.length && statusMessage) {
      return statusMessage;
    }

    if (!filteredProducts.length) {
      return filter === 'all'
        ? 'No items available right now. Please check back later.'
        : `We are restocking ${filter.toLowerCase()} soon.`;
    }

    if (filter === 'all') {
      const base = `${filteredProducts.length} items available today.`;
      return storeNote ? `${base} ${storeNote}`.trim() : base;
    }

    const label = filter.toLowerCase();
    return `Showing ${filteredProducts.length} ${label} pick(s).`;
  }, [filter, filteredProducts, products.length, statusMessage, storeNote]);

  return {
    products,
    categories,
    filter,
    setFilter,
    filteredProducts,
    highlights,
    productsStatusText,
  };
}
