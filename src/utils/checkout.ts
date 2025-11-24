import type { CheckoutFormValues } from '../types';
import {
  MAX_ITEM_QUANTITY,
  createEmptyCheckoutForm,
  normalizeCheckoutForm,
  prepareOrderPayload,
  validateCheckoutFields,
  formatAddressSnapshot,
} from '../../shared/order-schema.js';
export type {
  CheckoutFieldErrors,
  CheckoutValidationResult,
  CheckoutCartErrorCode,
  PreparedOrderPayload,
} from '../../shared/order-schema.js';

export {
  MAX_ITEM_QUANTITY,
  createEmptyCheckoutForm,
  normalizeCheckoutForm,
  prepareOrderPayload,
  validateCheckoutFields,
  formatAddressSnapshot,
};
