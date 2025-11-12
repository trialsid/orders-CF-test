import type { OrderStatus } from '../types';

export async function updateOrderStatus(orderId: string, status: OrderStatus): Promise<{ orderId: string; status: OrderStatus }> {
  const response = await fetch('/order', {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ orderId, status }),
  });

  const payload = await response.json();
  if (!response.ok || payload.error) {
    throw new Error(payload.error || 'Unable to update order status.');
  }

  return payload as { orderId: string; status: OrderStatus };
}
