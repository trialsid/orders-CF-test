import { useCallback, useEffect, useState, useRef } from 'react';
import { useApiClient } from './useApiClient';
import type { OrderRecord, OrdersResponse, OrderStatus } from '../types';

type OrdersStatus = 'idle' | 'loading' | 'success' | 'error';

type UseOrdersOptions = {
  token?: string | null;
  enabled?: boolean;
  requireAuth?: boolean;
  searchTerm?: string;
  statusFilter?: OrderStatus | 'all';
  pollIntervalMs?: number;
  onlyWhenVisible?: boolean;
};

type UseOrdersResult = {
  orders: OrderRecord[];
  status: OrdersStatus;
  error?: string;
  refresh: () => void;
  lastUpdatedAt?: number;
};

const DEFAULT_ERROR_MESSAGE = 'Unable to load orders right now. Please try again later.';

export function useOrders(limit = 100, options?: UseOrdersOptions): UseOrdersResult {
  const {
    token,
    enabled = true,
    requireAuth = false,
    searchTerm,
    statusFilter,
    pollIntervalMs,
    onlyWhenVisible = true,
  } = options ?? {};
  const { apiFetch } = useApiClient();
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [status, setStatus] = useState<OrdersStatus>('idle');
  const [error, setError] = useState<string | undefined>();
  const [lastUpdatedAt, setLastUpdatedAt] = useState<number | undefined>();

  const loadOrders = useCallback(
    async (signal?: AbortSignal) => {
      if (!enabled) {
        return;
      }
      if (requireAuth && !token) {
        setOrders([]);
        setStatus('idle');
        setError(undefined);
        return;
      }

      setStatus('loading');
      setError(undefined);

      try {
        const params = new URLSearchParams();
        params.append('limit', String(limit));
        if (searchTerm) {
          params.append('search', searchTerm);
        }
        if (statusFilter && statusFilter !== 'all') {
          params.append('status', statusFilter);
        }

        const response = await apiFetch(`/order?${params.toString()}`, {
          signal,
          tokenOverride: token ?? undefined,
        });
        
        if (response.status === 304) {
          // Not Modified - use cached data (browser handles this transparently after ETag check)
          // We don't need to update state, just mark as success if it was previously loading.
          setStatus((prev) => (prev === 'loading' ? 'success' : prev));
          return;
        }

        if (!response.ok) {
          throw new Error(`Failed to load orders: ${response.status}`);
        }
        
        const payload = (await response.json()) as OrdersResponse;

        if (!response.ok || payload.error) {
          throw new Error(payload.error || DEFAULT_ERROR_MESSAGE);
        }

        if (!signal?.aborted) {
          setOrders(payload.orders ?? []);
          setStatus('success');
          setLastUpdatedAt(Date.now());
        }
      } catch (fetchError) {
        if (signal?.aborted) {
          return;
        }
        const message = fetchError instanceof Error ? fetchError.message : DEFAULT_ERROR_MESSAGE;
        setError(message || DEFAULT_ERROR_MESSAGE);
        setStatus('error');
      }
    },
    [limit, token, enabled, requireAuth, searchTerm, statusFilter, apiFetch]
  );

  // Initial Load
  useEffect(() => {
    if (!enabled) {
      return;
    }
    const controller = new AbortController();
    loadOrders(controller.signal);
    return () => controller.abort();
  }, [loadOrders, enabled]);

  // Polling for auto-refresh, gated by visibility to reduce compute/network usage
  useEffect(() => {
    if (!enabled || !pollIntervalMs) {
      return;
    }

    const tick = () => {
      if (onlyWhenVisible && typeof document !== 'undefined' && document.visibilityState !== 'visible') {
        return;
      }
      loadOrders();
    };

    const id = window.setInterval(tick, pollIntervalMs);
    return () => window.clearInterval(id);
  }, [enabled, loadOrders, pollIntervalMs, onlyWhenVisible]);

  // Revalidate on Window Focus
  useEffect(() => {
    if (!enabled) return;

    const handleFocus = () => {
      // When user switches back to the tab, check for updates.
      // Thanks to ETag, this is cheap if nothing changed.
      if (document.visibilityState === 'visible') {
        loadOrders();
      }
    };

    window.addEventListener('focus', handleFocus);
    window.addEventListener('visibilitychange', handleFocus);

    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('visibilitychange', handleFocus);
    };
  }, [loadOrders, enabled]);

  const refresh = useCallback(() => {
    loadOrders();
  }, [loadOrders]);

  return { orders, status, error, refresh, lastUpdatedAt };
}
