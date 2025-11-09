export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  department: string;
  mrp: number;
  rawSellingPrice: number;
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

export interface OrderRecord {
  id: string;
  customerName: string;
  customerPhone?: string;
  customerAddress?: string;
  totalAmount: number;
  currency: string;
  status: string;
  items: SubmittedOrderItem[];
  createdAt: string;
  deliverySlot?: string;
  deliveryInstructions?: string;
  paymentMethod?: string;
}

export interface OrdersResponse {
  orders: OrderRecord[];
  error?: string;
}

export interface CheckoutFormValues {
  name: string;
  phone: string;
  address: string;
  slot: string;
  paymentMethod: string;
  instructions: string;
}
