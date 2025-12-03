import type { OrderStatus } from '../types';

type FetchLike = (input: RequestInfo | URL, init?: RequestInit & { tokenOverride?: string | null }) => Promise<Response>;

export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus,
  token?: string | null,
  fetchImpl: FetchLike = fetch,
  paymentCollectedMethod?: string
): Promise<{ orderId: string; status: OrderStatus; paymentCollectedMethod?: string }> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetchImpl('/api/order', {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ orderId, status, paymentCollectedMethod }),
    tokenOverride: token ?? undefined,
  } as RequestInit & { tokenOverride?: string | null });

  const payload = await response.json();
  if (!response.ok || payload.error) {
    throw new Error(payload.error || 'Unable to update order status.');
  }

  return payload as { orderId: string; status: OrderStatus; paymentCollectedMethod?: string };
}
