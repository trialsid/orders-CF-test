export type CheckoutFormValues = {
  name: string;
  phone: string;
  address: string;
  addressLine2: string;
  area: string;
  city: string;
  state: string;
  postalCode: string;
  landmark: string;
  slot: string;
  paymentMethod: string;
  instructions: string;
};

export type CheckoutFieldErrorCode = "required" | "invalidPhone";
export type CheckoutFieldErrors = Partial<Record<keyof CheckoutFormValues, CheckoutFieldErrorCode>>;
export type CheckoutCartErrorCode = "empty" | "quantityLimit";
export type CheckoutValidationResult = {
  normalizedForm: CheckoutFormValues;
  fieldErrors: CheckoutFieldErrors;
};

export type CartEntry = {
  product: { id: string; name: string; price: number };
  quantity: number;
};

export type PreparedOrderPayload =
  | {
      ok: true;
      payload: {
        items: Array<{ id: string; name: string; quantity: number; price: number }>;
        customer: {
          name?: string;
          phone?: string;
          address?: string;
          addressLine2?: string;
          area?: string;
          city?: string;
          state?: string;
          postalCode?: string;
          landmark?: string;
        };
        delivery: { slot?: string; instructions?: string };
        payment: { method?: string };
        saveAddress?: boolean;
      };
      normalizedForm: CheckoutFormValues;
    }
  | {
      ok: false;
      normalizedForm: CheckoutFormValues;
      fieldErrors?: CheckoutFieldErrors;
      cartError?: CheckoutCartErrorCode;
      offendingItem?: {
        id?: string;
        name?: string;
        quantity?: number;
      };
    };

export const MAX_ITEM_QUANTITY: number;
export const PHONE_MIN_DIGITS: number;

export const createEmptyCheckoutForm: () => CheckoutFormValues;
export const normalizeCheckoutForm: (form: CheckoutFormValues) => CheckoutFormValues;
export function validateCheckoutFields(
  form: CheckoutFormValues
): { normalizedForm: CheckoutFormValues; fieldErrors: CheckoutFieldErrors };

export function formFromOrderRequest(body: unknown): CheckoutFormValues;
export function validateOrderRequest(
  body: unknown
): { normalizedForm: CheckoutFormValues; fieldErrors: CheckoutFieldErrors };

export function prepareOrderPayload(
  form: CheckoutFormValues,
  cartItems: CartEntry[],
  options?: { saveAddress?: boolean }
): PreparedOrderPayload;

export function formatAddressSnapshot(
  address?: unknown
): string;
