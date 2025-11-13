import type { OrderStatus } from '../types';

export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus,
  token?: string | null
): Promise<{ orderId: string; status: OrderStatus }> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch('/order', {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ orderId, status }),
  });

  const payload = await response.json();
  if (!response.ok || payload.error) {
    throw new Error(payload.error || 'Unable to update order status.');
  }

  return payload as { orderId: string; status: OrderStatus };
}
