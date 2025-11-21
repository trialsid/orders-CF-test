export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  department: string;
  mrp: number;
  rawSellingPrice: number;
  image?: string;
}

export interface ProductsResponse {
  items: Product[];
  message?: string;
}

export interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

export interface OrderPayload {
  items: OrderItem[];
  customer: {
    name: string;
    phone?: string;
    address?: string;
  };
  delivery?: {
    slot?: string;
    instructions?: string;
  };
  payment?: {
    method?: string;
  };
}

export interface OrderResponse {
  message?: string;
  orderId?: string;
  summary?: {
    customer: {
      name: string;
      phone?: string;
      address?: string;
    };
    items: SubmittedOrderItem[];
    total: number;
    status: string;
    delivery?: {
      slot?: string;
      instructions?: string;
    };
    payment?: {
      method?: string;
    };
  };
  error?: string;
}

export interface CartEntry {
  product: Product;
  quantity: number;
}

export interface SubmittedOrderItem {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export type OrderStatus = 'pending' | 'confirmed' | 'outForDelivery' | 'delivered' | 'cancelled';

export interface OrderRecord {
  id: string;
  customerName: string;
  customerPhone?: string;
  customerAddress?: string;
  totalAmount: number;
  currency: string;
  status: OrderStatus;
  items: SubmittedOrderItem[];
  createdAt: string;
  deliverySlot?: string;
  deliveryInstructions?: string;
  paymentMethod?: string;
  userId?: string;
  deliveryAddressId?: string;
}

export interface OrdersResponse {
  orders: OrderRecord[];
  error?: string;
}

export interface AdminConfig {
  minimumOrderAmount: number;
  freeDeliveryThreshold: number;
  deliveryFeeBelowThreshold: number;
}

export interface CheckoutFormValues {
  name: string;
  phone: string;
  address: string;
  slot: string;
  paymentMethod: string;
  instructions: string;
}

export type UserRole = 'customer' | 'rider' | 'admin';

export interface UserAddressSnapshot {
  addressId?: string | null;
  contactName?: string | null;
  phone?: string | null;
  line1?: string | null;
  line2?: string | null;
  area?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  landmark?: string | null;
}

export interface UserAddress {
  id: string;
  label?: string | null;
  contactName?: string | null;
  phone?: string | null;
  line1?: string | null;
  line2?: string | null;
  area?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  landmark?: string | null;
  isDefault: boolean;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface AuthUser {
  id: string;
  phone: string;
  role: UserRole;
  status: string;
  displayName?: string | null;
  fullName?: string | null;
  primaryAddress?: UserAddressSnapshot | null;
  createdAt?: string | null;
}

export interface AuthResponse {
  user: AuthUser;
  token: string;
  error?: string;
}
