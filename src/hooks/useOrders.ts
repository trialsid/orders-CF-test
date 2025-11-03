import { useCallback, useEffect, useState } from 'react';
import type { OrderRecord, OrdersResponse } from '../types';

type OrdersStatus = 'idle' | 'loading' | 'success' | 'error';

type UseOrdersResult = {
  orders: OrderRecord[];
  status: OrdersStatus;
  error?: string;
  refresh: () => void;
};

const DEFAULT_ERROR_MESSAGE = 'Unable to load orders right now. Please try again later.';

export function useOrders(limit = 25): UseOrdersResult {
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [status, setStatus] = useState<OrdersStatus>('idle');
  const [error, setError] = useState<string | undefined>();

  const loadOrders = useCallback(
    async (signal?: AbortSignal) => {
      setStatus('loading');
      setError(undefined);

      try {
        const response = await fetch(`/order?limit=${limit}`, { signal });
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
    [limit]
  );

  useEffect(() => {
    const controller = new AbortController();
    loadOrders(controller.signal);
    return () => {
      controller.abort();
    };
  }, [loadOrders]);

  const refresh = useCallback(() => {
    loadOrders();
  }, [loadOrders]);

  return { orders, status, error, refresh };
}
