import { useCallback, useEffect, useState } from 'react';
import type { OrderRecord, OrdersResponse } from '../types';

type OrdersStatus = 'idle' | 'loading' | 'success' | 'error';

type UseOrdersOptions = {
  token?: string | null;
  enabled?: boolean;
  requireAuth?: boolean;
};

type UseOrdersResult = {
  orders: OrderRecord[];
  status: OrdersStatus;
  error?: string;
  refresh: () => void;
};

const DEFAULT_ERROR_MESSAGE = 'Unable to load orders right now. Please try again later.';

export function useOrders(limit = 25, options?: UseOrdersOptions): UseOrdersResult {
  const { token, enabled = true, requireAuth = false } = options ?? {};
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [status, setStatus] = useState<OrdersStatus>('idle');
  const [error, setError] = useState<string | undefined>();

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
        const response = await fetch(`/order?limit=${limit}`, {
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
    [limit, token, enabled, requireAuth]
  );

  useEffect(() => {
    if (!enabled) {
      return;
    }
    const controller = new AbortController();
    loadOrders(controller.signal);
    return () => {
      controller.abort();
    };
  }, [loadOrders, enabled]);

  const refresh = useCallback(() => {
    loadOrders();
  }, [loadOrders]);

  return { orders, status, error, refresh };
}
