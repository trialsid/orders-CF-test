import { useEffect, useMemo, useState } from 'react';
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
        const uniqueDepartments = [...new Set(items.map((item) => getDepartmentLabel(item)))].sort();
        setDepartments(uniqueDepartments);
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
  };
}
