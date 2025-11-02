export interface Product {
  id: string;
  name: string;
  description: string;
  unit: string;
  price: number;
  category: string;
}

export interface ProductsResponse {
  items: Product[];
  message?: string;
}

export interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  price: number;
}

export interface OrderPayload {
  items: OrderItem[];
  customer: {
    name: string;
  };
}

export interface OrderResponse {
  message?: string;
}

export interface CartEntry {
  product: Product;
  quantity: number;
}
