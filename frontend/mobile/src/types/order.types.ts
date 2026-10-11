export interface OrderItem {
  productId: string;
  title: string;
  variantName: string | null;
  unitPrice: number;
  quantity: number;
}

export interface DeliveryAddress {
  area: string;
  streetDetail: string;
  landmark?: string;
  phone: string;
}

export interface Order {
  _id: string;
  items: OrderItem[];
  deliveryAddress: DeliveryAddress;
  paymentMethod: "COD" | "JazzCash";
  paymentStatus: "pending" | "pending_verification";
  transactionId?: string;
  subtotal: number;
  deliveryFee: number;
  total: number;
  status: "Pending" | "Preparing" | "Out for Delivery" | "Delivered" | "Cancelled";
  estimatedDeliveryMinutes?: number;
  createdAt: string;
}

export interface PlaceOrderPayload {
  items: {
    productId: string;
    variantName: string | null;
    quantity: number;
  }[];
  area: string;
  streetDetail: string;
  landmark?: string;
  phone: string;
  paymentMethod: "COD" | "JazzCash";
  transactionId?: string;
  paymentScreenshotBase64?: string; // "data:image/jpeg;base64,...."
}
