// types/order.ts
// Order Types

export type OrderStatus =
  | 'pending'       // Cliente ha inviato ordine
  | 'verified'      // Admin ha verificato ordine
  | 'confirmed'     // Admin ha confermato e inviato link pagamento
  | 'paid'          // Cliente ha pagato
  | 'processing'    // In lavorazione
  | 'shipped'       // Spedito
  | 'delivered'     // Consegnato
  | 'cancelled';    // Annullato

export interface OrderItem {
  productCode: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  variant?: Record<string, any>;
}

export interface Order {
  id: string;
  orderNumber: string; // Es: "ORD-20251023-001"

  // User info
  userId: string;
  userEmail: string;
  userRole: 'b2c' | 'b2b';

  // Items
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;

  // Status
  status: OrderStatus;
  statusHistory: {
    status: OrderStatus;
    timestamp: Date;
    note?: string;
  }[];

  // Shipping info
  shippingAddress: {
    nome: string;
    via: string;
    citta: string;
    cap: string;
    provincia: string;
    paese: string;
    telefono: string;
  };

  // Billing info (for B2B)
  billingAddress?: {
    ragioneSociale: string;
    partitaIva: string;
    codiceSDI: string;
    via: string;
    citta: string;
    cap: string;
    provincia: string;
    paese: string;
  };

  // Payment
  paymentMethod?: string;
  paymentLink?: string; // Link pagamento dalla banca
  paymentDate?: Date;
  paymentConfirmed?: boolean;

  // Notes
  customerNotes?: string;
  adminNotes?: string;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  confirmedAt?: Date;
  paidAt?: Date;
  shippedAt?: Date;
  deliveredAt?: Date;
}

// Order Creation Data (from customer)
export interface CreateOrderData {
  items: OrderItem[];
  shippingAddress: Order['shippingAddress'];
  billingAddress?: Order['billingAddress'];
  customerNotes?: string;
}

// Order Update Data (from admin)
export interface UpdateOrderData {
  status?: OrderStatus;
  paymentLink?: string;
  paymentConfirmed?: boolean;
  adminNotes?: string;
  statusNote?: string;
}
