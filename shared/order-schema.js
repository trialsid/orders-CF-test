export const MAX_ITEM_QUANTITY = 20;
export const PHONE_MIN_DIGITS = 6;

const DEFAULT_CITY = "Ieeja";
const DEFAULT_STATE = "Telangana";
const DEFAULT_POSTAL = "509127";

export const createEmptyCheckoutForm = () => ({
  name: "",
  phone: "",
  address: "",
  addressLine2: "",
  area: "",
  city: DEFAULT_CITY,
  state: DEFAULT_STATE,
  postalCode: DEFAULT_POSTAL,
  landmark: "",
  slot: "",
  paymentMethod: "",
  instructions: "",
});

const normalize = (value) => (typeof value === "string" ? value.trim() : "");
const normalizeOptional = (value) => {
  const trimmed = normalize(value);
  return trimmed.length > 0 ? trimmed : undefined;
};

export const normalizeCheckoutForm = (form) => ({
  name: normalize(form?.name),
  phone: normalize(form?.phone),
  address: normalize(form?.address),
  addressLine2: normalize(form?.addressLine2),
  area: normalize(form?.area),
  city: normalize(form?.city) || DEFAULT_CITY,
  state: normalize(form?.state) || DEFAULT_STATE,
  postalCode: normalize(form?.postalCode) || DEFAULT_POSTAL,
  landmark: normalize(form?.landmark),
  slot: normalize(form?.slot),
  paymentMethod: normalize(form?.paymentMethod),
  instructions: normalize(form?.instructions),
});

export function validateCheckoutFields(form) {
  const normalizedForm = normalizeCheckoutForm(form);
  const fieldErrors = {};

  if (!normalizedForm.name) {
    fieldErrors.name = "required";
  }

  if (!normalizedForm.phone) {
    fieldErrors.phone = "required";
  } else {
    const digits = normalizedForm.phone.replace(/\D/g, "");
    if (digits.length < PHONE_MIN_DIGITS) {
      fieldErrors.phone = "invalidPhone";
    }
  }

  if (!normalizedForm.address) {
    fieldErrors.address = "required";
  }

  if (!normalizedForm.slot) {
    fieldErrors.slot = "required";
  }

  if (!normalizedForm.paymentMethod) {
    fieldErrors.paymentMethod = "required";
  }

  return { normalizedForm, fieldErrors };
}

/**
 * Convert an order payload (customer/delivery/payment) back to the form shape
 * so both client and server can reuse the same validators.
 */
export function formFromOrderRequest(body = {}) {
  const customer = body.customer ?? {};
  const delivery = body.delivery ?? {};
  const payment = body.payment ?? {};

  return {
    name: typeof customer.name === "string" ? customer.name : "",
    phone: typeof customer.phone === "string" ? customer.phone : "",
    address: typeof customer.address === "string" ? customer.address : "",
    addressLine2: typeof customer.addressLine2 === "string" ? customer.addressLine2 : "",
    area: typeof customer.area === "string" ? customer.area : "",
    city: typeof customer.city === "string" ? customer.city : DEFAULT_CITY,
    state: typeof customer.state === "string" ? customer.state : DEFAULT_STATE,
    postalCode: typeof customer.postalCode === "string" ? customer.postalCode : DEFAULT_POSTAL,
    landmark: typeof customer.landmark === "string" ? customer.landmark : "",
    slot: typeof delivery.slot === "string" ? delivery.slot : "",
    paymentMethod: typeof payment.method === "string" ? payment.method : "",
    instructions: typeof delivery.instructions === "string" ? delivery.instructions : "",
  };
}

export function validateOrderRequest(body = {}) {
  const form = formFromOrderRequest(body);
  return validateCheckoutFields(form);
}

export function prepareOrderPayload(form, cartItems, options) {
  const { normalizedForm, fieldErrors } = validateCheckoutFields(form);
  const hasFieldErrors = Object.keys(fieldErrors).length > 0;
  if (hasFieldErrors) {
    return { ok: false, normalizedForm, fieldErrors };
  }

  if (!Array.isArray(cartItems) || cartItems.length === 0) {
    return { ok: false, normalizedForm, cartError: "empty" };
  }

  const items = [];

  for (const entry of cartItems) {
    const quantity = Number(entry?.quantity);
    if (!Number.isFinite(quantity) || quantity <= 0 || quantity > MAX_ITEM_QUANTITY) {
      return {
        ok: false,
        normalizedForm,
        cartError: "quantityLimit",
        offendingItem: entry?.product
          ? { id: entry.product.id, name: entry.product.name, quantity }
          : undefined,
      };
    }

    items.push({
      id: entry.product.id,
      name: entry.product.name,
      quantity,
      price: entry.product.price,
    });
  }

  const payload = {
    items,
    customer: {
      name: normalizeOptional(normalizedForm.name) ?? "Walk-in customer",
      phone: normalizeOptional(normalizedForm.phone),
      address: normalizeOptional(normalizedForm.address),
      addressLine2: normalizeOptional(normalizedForm.addressLine2),
      area: normalizeOptional(normalizedForm.area),
      city: normalizeOptional(normalizedForm.city) ?? DEFAULT_CITY,
      state: normalizeOptional(normalizedForm.state) ?? DEFAULT_STATE,
      postalCode: normalizeOptional(normalizedForm.postalCode) ?? DEFAULT_POSTAL,
      landmark: normalizeOptional(normalizedForm.landmark),
    },
    delivery: {
      slot: normalizeOptional(normalizedForm.slot),
      instructions: normalizeOptional(normalizedForm.instructions),
    },
    payment: {
      method: normalizeOptional(normalizedForm.paymentMethod),
    },
    saveAddress: options?.saveAddress,
  };

  return {
    ok: true,
    payload,
    normalizedForm,
  };
}

export const formatAddressSnapshot = (address) => {
  if (!address || typeof address !== "object") return "";
  const parts = [
    "line1" in address ? address.line1 : address.address,
    "line2" in address ? address.line2 : address.addressLine2,
    "area" in address ? address.area : undefined,
    "city" in address ? address.city : undefined,
    "state" in address ? address.state : undefined,
    "postalCode" in address ? address.postalCode : undefined,
    "landmark" in address ? address.landmark : undefined,
  ]
    .map((part) => (typeof part === "string" ? part.trim() : ""))
    .filter((part) => part.length > 0);
  return parts.join(", ");
};
