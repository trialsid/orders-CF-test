import { useCallback, useEffect, useState } from 'react';

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

interface UseAdminProductsOptions {
  token?: string | null;
  enabled?: boolean;
}

export function useAdminProducts({ token, enabled = true }: UseAdminProductsOptions) {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string>();

  const loadProducts = useCallback(async (force = false) => {
    if (!token || !enabled) return;

    setStatus('loading');
    setError(undefined);

    try {
      const res = await fetch('/admin/products', {
        headers: { Authorization: `Bearer ${token}` },
        cache: force ? 'no-cache' : 'default',
      });

      if (res.status === 304) {
        setStatus('success');
        return;
      }

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Failed to fetch products');

      setProducts(data.items || []);
      setStatus('success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setStatus('error');
    }
  }, [token, enabled]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const updateProduct = async (id: string, updates: Partial<AdminProduct>) => {
    if (!token) throw new Error('Not authenticated');

    const res = await fetch('/admin/products', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ id, ...updates }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Update failed');

    // Optimistic update locally
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
    );

    return data;
  };

  return { products, status, error, refresh: () => loadProducts(true), updateProduct };
}
