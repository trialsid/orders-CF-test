import type { CartEntry, CheckoutFormValues, OrderPayload } from '../types';

export const MAX_ITEM_QUANTITY = 20;
const PHONE_MIN_DIGITS = 6;

export const createEmptyCheckoutForm = (): CheckoutFormValues => ({
  name: '',
  phone: '',
  address: '',
  slot: '',
  paymentMethod: '',
  instructions: '',
});

export type CheckoutFieldErrorCode = 'required' | 'invalidPhone';
export type CheckoutFieldErrors = Partial<Record<keyof CheckoutFormValues, CheckoutFieldErrorCode>>;

export type CheckoutCartErrorCode = 'empty' | 'quantityLimit';

export type CheckoutValidationResult = {
  normalizedForm: CheckoutFormValues;
  fieldErrors: CheckoutFieldErrors;
};

export type PreparedOrderPayload =
  | {
      ok: true;
      payload: OrderPayload;
      normalizedForm: CheckoutFormValues;
    }
  | {
      ok: false;
      normalizedForm: CheckoutFormValues;
      fieldErrors?: CheckoutFieldErrors;
      cartError?: CheckoutCartErrorCode;
      offendingItem?: {
        id: string;
        name: string;
        quantity: number;
      };
    };

const normalize = (value: string): string => value.trim();

const normalizeOptional = (value: string): string | undefined => {
  const trimmed = normalize(value);
  return trimmed.length > 0 ? trimmed : undefined;
};

export const normalizeCheckoutForm = (form: CheckoutFormValues): CheckoutFormValues => ({
  name: normalize(form.name),
  phone: normalize(form.phone),
  address: normalize(form.address),
  slot: normalize(form.slot),
  paymentMethod: normalize(form.paymentMethod),
  instructions: normalize(form.instructions),
});

export function validateCheckoutFields(form: CheckoutFormValues): CheckoutValidationResult {
  const normalizedForm = normalizeCheckoutForm(form);
  const fieldErrors: CheckoutFieldErrors = {};

  if (!normalizedForm.name) {
    fieldErrors.name = 'required';
  }

  if (!normalizedForm.phone) {
    fieldErrors.phone = 'required';
  } else {
    const digits = normalizedForm.phone.replace(/\D/g, '');
    if (digits.length < PHONE_MIN_DIGITS) {
      fieldErrors.phone = 'invalidPhone';
    }
  }

  if (!normalizedForm.address) {
    fieldErrors.address = 'required';
  }

  if (!normalizedForm.slot) {
    fieldErrors.slot = 'required';
  }

  if (!normalizedForm.paymentMethod) {
    fieldErrors.paymentMethod = 'required';
  }

  return { normalizedForm, fieldErrors };
}

export function prepareOrderPayload(
  form: CheckoutFormValues,
  cartItems: CartEntry[]
): PreparedOrderPayload {
  const { normalizedForm, fieldErrors } = validateCheckoutFields(form);

  const hasFieldErrors = Object.keys(fieldErrors).length > 0;
  if (hasFieldErrors) {
    return {
      ok: false,
      normalizedForm,
      fieldErrors,
    };
  }

  if (cartItems.length === 0) {
    return {
      ok: false,
      normalizedForm,
      cartError: 'empty',
    };
  }

  const items: OrderPayload['items'] = [];

  for (const entry of cartItems) {
    const quantity = entry.quantity;
    if (quantity <= 0 || quantity > MAX_ITEM_QUANTITY) {
      return {
        ok: false,
        normalizedForm,
        cartError: 'quantityLimit',
        offendingItem: {
          id: entry.product.id,
          name: entry.product.name,
          quantity,
        },
      };
    }

    items.push({
      id: entry.product.id,
      name: entry.product.name,
      quantity,
      price: entry.product.price,
    });
  }

  const payload: OrderPayload = {
    items,
    customer: {
      name: normalizeOptional(normalizedForm.name) ?? 'Walk-in customer',
      phone: normalizeOptional(normalizedForm.phone),
      address: normalizeOptional(normalizedForm.address),
    },
    delivery: {
      slot: normalizeOptional(normalizedForm.slot),
      instructions: normalizeOptional(normalizedForm.instructions),
    },
    payment: {
      method: normalizeOptional(normalizedForm.paymentMethod),
    },
  };

  return {
    ok: true,
    payload,
    normalizedForm,
  };
}
