export interface City {
  cityId: number;
  nameAr?: string;
  name?: string;
  governorateId?: number;
  governorateNameAr?: string;
}

export interface TransportPriceLineMatch {
  priceLineId: number;
  transportProviderId: number;
  price: number;
  governmentMaxPrice?: number;
  isAvailable?: boolean;
  fromCityId?: number;
  toCityId?: number;
  fromRegion?: string;
  toRegion?: string;
  transporterName?: string;
  providerName?: string;
}

export interface AssignTransportPayload {
  conversationId: number;
  orderType: string;
  orderId: number;
  transportProviderId: number;
  priceLineId: number;
  agreedPrice?: number;
}

export interface TransportRequestDetail {
  requestId: number;
  status?: string;
  orderType?: string;
  orderId?: number;
  fromCityId?: number;
  toCityId?: number;
  fromRegion?: string;
  toRegion?: string;
  agreedPrice?: number;
  assignedTransportProviderId?: number;
  transportProviderName?: string;
  productType?: string;
  weightKg?: number;
  preferredPickupDate?: string;
}

export interface AssignTransportResult {
  success: boolean;
  request?: TransportRequestDetail;
  /** تعيين نجح في الخادم رغم خطأ HTTP (مثل 500) */
  recoveredFromServerError?: boolean;
  message?: string;
}
