import type { CheckoutFormValues } from '../types';

export const createEmptyCheckoutForm = (): CheckoutFormValues => ({
  name: '',
  phone: '',
  address: '',
  slot: '',
  paymentMethod: '',
  instructions: '',
});
