import { useCallback, useEffect, useState, useRef } from 'react';
import type { OrderRecord, OrdersResponse, OrderStatus } from '../types';

type OrdersStatus = 'idle' | 'loading' | 'success' | 'error';

type UseOrdersOptions = {
  token?: string | null;
  enabled?: boolean;
  requireAuth?: boolean;
  searchTerm?: string;
  statusFilter?: OrderStatus | 'all';
  refreshInterval?: number; // Interval in milliseconds for auto-refresh
};

type UseOrdersResult = {
  orders: OrderRecord[];
  status: OrdersStatus;
  error?: string;
  refresh: () => void;
};

const DEFAULT_ERROR_MESSAGE = 'Unable to load orders right now. Please try again later.';
const DEFAULT_REFRESH_INTERVAL = 30000; // 30 seconds

export function useOrders(limit = 100, options?: UseOrdersOptions): UseOrdersResult {
  const { token, enabled = true, requireAuth = false, searchTerm, statusFilter, refreshInterval = DEFAULT_REFRESH_INTERVAL } = options ?? {};
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [status, setStatus] = useState<OrdersStatus>('idle');
  const [error, setError] = useState<string | undefined>();
  const intervalRef = useRef<number | null>(null);

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

        const response = await fetch(`/order?${params.toString()}`, {
          signal,
          headers: token
            ? {
                Authorization: `Bearer ${token}`,
              }
            : undefined,
        });
        const payload = (await response.json()) as OrdersResponse;

        if (!response.ok || payload.error) {
          throw new Error(payload.error || DEFAULT_ERROR_MESSAGE);
        }

        if (!signal?.aborted) {
          setOrders(payload.orders ?? []);
          setStatus('success');
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
    [limit, token, enabled, requireAuth, searchTerm, statusFilter]
  );

  useEffect(() => {
    if (!enabled) {
      return;
    }
    const controller = new AbortController();
    loadOrders(controller.signal);

    if (refreshInterval > 0) {
      // Clear any existing interval to prevent multiple intervals running
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      intervalRef.current = setInterval(() => {
        loadOrders(controller.signal);
      }, refreshInterval) as unknown as number; // Type assertion for setInterval return
    }

    return () => {
      controller.abort();
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [loadOrders, enabled, refreshInterval]);

  const refresh = useCallback(() => {
    loadOrders();
  }, [loadOrders]);

  return { orders, status, error, refresh };
}
