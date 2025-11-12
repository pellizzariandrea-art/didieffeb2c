// types/shipping-address.ts
// Types for shipping addresses

export interface ShippingAddress {
  id: string;
  recipientName: string;
  addressLine: string;
  city: string;
  postalCode: string;
  province: string;
  country: string;
  phone: string;
  notes?: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAddressData {
  recipientName: string;
  addressLine: string;
  city: string;
  postalCode: string;
  province: string;
  country: string;
  phone: string;
  notes?: string;
  isDefault?: boolean;
}

export interface UpdateAddressData extends Partial<CreateAddressData> {
  id: string;
}
