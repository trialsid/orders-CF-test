import { useEffect, useMemo, useState } from 'react';
import type { Product, ProductsResponse } from '../types';

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [storeNote, setStoreNote] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<boolean>(false);

  useEffect(() => {
    let cancelled = false;

    async function loadProducts() {
      setIsLoading(true);
      setLoadError(false);
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
        setIsLoading(false);
      } catch (error) {
        console.error(error);
        if (!cancelled) {
          setLoadError(true);
          setIsLoading(false);
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

  return {
    products,
    categories,
    filter,
    setFilter,
    filteredProducts,
    highlights,
    storeNote,
    isLoading,
    loadError,
  };
}
