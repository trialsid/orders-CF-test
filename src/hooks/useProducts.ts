import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Product, ProductsResponse } from '../types';

const getDepartmentLabel = (product: Product): string => {
  const department = product.department?.trim();
  if (department) {
    return department;
  }
  const category = product.category?.trim();
  return category || 'Other';
};

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [storeNote, setStoreNote] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<boolean>(false);

  const loadProducts = useCallback(async (forceRefresh = false) => {
    setIsLoading(true);
    setLoadError(false);
    try {
      // Only append timestamp if explicitly forcing a refresh (bypassing cache)
      const url = forceRefresh ? `/products?t=${Date.now()}` : '/products';
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed to load products: ${response.status}`);
      }
      
      // 304 Not Modified is handled automatically by the browser's fetch API
      // (it returns the cached response with status 200 usually, or we can check status)
      const data = (await response.json()) as ProductsResponse;
      
      const items = data.items ?? [];
      setProducts(items);
      const message = (data.message ?? '').trim();
      setStoreNote(message);
      const uniqueDepartments = [...new Set(items.map((item) => getDepartmentLabel(item)))].sort();
      setDepartments(uniqueDepartments);
      setIsLoading(false);
    } catch (error) {
      console.error(error);
      setLoadError(true);
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const filteredProducts = useMemo(() => {
    if (filter === 'all') {
      return products;
    }
    return products.filter((product) => getDepartmentLabel(product) === filter);
  }, [products, filter]);

  const highlights = useMemo(() => products.slice(0, 3), [products]);

  return {
    products,
    departments,
    filter,
    setFilter,
    filteredProducts,
    highlights,
    storeNote,
    isLoading,
    loadError,
    refresh: () => loadProducts(true),
  };
}
