import { OrderRecord, OrderStatus } from '../types';

export const getMapsUrl = (address?: string) => {
  if (!address?.trim()) return undefined;
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`;
};

export const getCallHref = (phone?: string) => (phone ? `tel:${phone}` : undefined);

export const getAdvanceMeta = (order: OrderRecord): { buttonLabel: string; nextStatus: OrderStatus } => {
  if (order.status === 'confirmed') {
    return { buttonLabel: 'Start delivery', nextStatus: 'outForDelivery' };
  }
  return { buttonLabel: 'Complete delivery', nextStatus: 'delivered' };
};

export const isUrgent = (order: OrderRecord) => {
  const now = Date.now();
  const createdAt = new Date(order.createdAt).getTime();
  const ageMinutes = Number.isNaN(createdAt) ? undefined : (now - createdAt) / 60000;

  let slotTime: number | undefined;
  if (order.deliverySlot) {
    const parsedSlot = new Date(order.deliverySlot);
    if (!Number.isNaN(parsedSlot.getTime())) {
      slotTime = parsedSlot.getTime();
    }
  }

  const slotPast = slotTime ? slotTime < now - 5 * 60 * 1000 : false;
  const slotVerySoon = slotTime ? slotTime - now <= 15 * 60 * 1000 : false;

  if (order.status === 'confirmed') {
    return slotPast || slotVerySoon || (ageMinutes !== undefined && ageMinutes > 20);
  }

  if (order.status === 'outForDelivery') {
    return slotPast || (ageMinutes !== undefined && ageMinutes > 90);
  }

  return false;
};
