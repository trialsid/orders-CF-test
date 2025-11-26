import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useApiClient } from './useApiClient';

export interface AdminProduct {
  id: string;
  name: string;
  description?: string;
  department?: string;
  category?: string;
  price: number;
  mrp?: number;
  isActive: boolean;
  stockQuantity: number;
}

export interface ProductPagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

interface UseAdminProductsOptions {
  enabled?: boolean;
  page?: number;
  limit?: number;
  search?: string;
}

export function useAdminProducts({ enabled = true, page = 1, limit = 50, search = '' }: UseAdminProductsOptions) {
  const { token } = useAuth();
  const { apiFetch } = useApiClient();
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [pagination, setPagination] = useState<ProductPagination>({ page: 1, limit: 50, total: 0, pages: 1 });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string>();

  const loadProducts = useCallback(async (force = false) => {
    if (!token || !enabled) return;

    setStatus('loading');
    setError(undefined);

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        search: search,
      });

      const res = await apiFetch(`/admin/products?${params.toString()}`, {
        cache: force ? 'no-cache' : 'default',
      });

      if (res.status === 304) {
        setStatus('success');
        return;
      }

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Failed to fetch products');

      setProducts(data.items || []);
      if (data.pagination) {
        setPagination(data.pagination);
      }
      setStatus('success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setStatus('error');
    }
  }, [enabled, page, limit, search, apiFetch, token]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const updateProduct = async (id: string, updates: Partial<AdminProduct>) => {
    if (!token) throw new Error('Not authenticated');

    const res = await apiFetch('/admin/products', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id, ...updates }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Update failed');

    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
    );

    return data;
  };

  const addProduct = async (product: Omit<AdminProduct, 'id'>) => {
    if (!token) throw new Error('Not authenticated');

    const res = await apiFetch('/admin/products', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(product),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to create product');

    // Reload to get the correct sort order and ID
    loadProducts(true);
    return data;
  };

  const deleteProduct = async (id: string) => {
    if (!token) throw new Error('Not authenticated');

    const res = await apiFetch(`/admin/products?id=${id}`, {
      method: 'DELETE',
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to delete product');

    setProducts((prev) => prev.filter((p) => p.id !== id));
    return data;
  };

  return {
    products,
    pagination,
    status,
    error,
    refresh: () => loadProducts(true),
    updateProduct,
    addProduct,
    deleteProduct,
  };
}
