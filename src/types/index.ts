export enum UserRole {
  Farmer = 1,
  Trader = 2,
  Transport = 3,
  Government = 4,
}

export interface ApiError {
  code?: string;
  title?: string;
  detail?: string;
  status?: number;
  errors?: Record<string, string[]>;
}

export interface ApiEnvelope<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  traceId?: string;
  error?: ApiError;
}

export interface AuthUser {
  userId: number;
  roleId: UserRole;
  fullName?: string;
  email?: string;
  phone?: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken?: string;
  userId: number;
  expiresAt?: string;
}

export interface RegistrationIncomplete {
  registrationId: string;
  currentStep: number;
}

export interface Auction {
  auctionId: number;
  auctionTitle?: string;
  auctionDescription?: string;
  cropName?: string;
  productNameAr?: string;
  startingPrice?: number;
  currentPrice?: number;
  minIncrement?: number;
  endTime?: string;
  startTime?: string;
  status?: string;
  productMainImage?: string;
  productImageUrl?: string;
  images?: string[];
  unit?: string;
  cropUnit?: string;
  quantity?: number;
  cropQuantity?: number;
  governorateName?: string;
  cityName?: string;
  farmCity?: string;
  farmGovernorate?: string;
  categoryId?: number;
  categoryNameAr?: string;
  createdByUserId?: number;
  sellerUserId?: number;
  bidsCount?: number;
  pricing?: AuctionPricing & {
    startingPriceTotal?: number;
    currentPriceTotal?: number;
  };
}

export interface Tender {
  tenderId: number;
  title?: string;
  description?: string;
  cropName?: string;
  productNameAr?: string;
  quantity?: number;
  unit?: string;
  maxBudget?: number;
  endTime?: string;
  startTime?: string;
  status?: string;
  createdByUserId?: number;
  imageUrls?: string[];
  productImageUrl?: string;
  productMainImage?: string;
  deliveryLocation?: string;
  farmCity?: string;
  farmGovernorate?: string;
  categoryId?: number;
  categoryNameAr?: string;
  offersCount?: number;
}

export interface MarketplaceListing {
  listingId: number;
  title?: string;
  cropName?: string;
  productNameAr?: string;
  unitPrice?: number;
  availableQty?: number;
  unit?: string;
  farmCity?: string;
  governorateName?: string;
  farmGovernorate?: string;
  location?: string;
  productImageUrl?: string;
  imageUrls?: string[];
  status?: string;
  sellerUserId?: number;
  categoryId?: number;
  categoryNameAr?: string;
}

export interface MarketplaceBrowseData {
  auctions: Auction[];
  tenders: Tender[];
  direct: MarketplaceListing[];
}

export interface Category {
  categoryId: number;
  nameAr?: string;
  name?: string;
  iconUrl?: string;
}

export interface Advertisement {
  advertisementId: number;
  title?: string;
  description?: string;
  imageUrl?: string;
  linkUrl?: string;
  navigationType?: string;
  navigationValue?: string;
}

export interface Conversation {
  conversationId: number;
  title?: string;
  lastMessage?: string;
  lastMessageAt?: string;
  unreadCount?: number;
  contextType?: string;
  contextId?: number;
}

export interface NotificationItem {
  notificationId: number;
  title?: string;
  body?: string;
  isRead?: boolean;
  createdAt?: string;
  clickAction?: string;
}

export interface TransportRequest {
  requestId: number;
  orderType?: string;
  orderId?: number;
  status?: string;
  fromRegion?: string;
  toRegion?: string;
  productType?: string;
  weightKg?: number;
  preferredPickupDate?: string;
  agreedPrice?: number;
  assignedTransportProviderId?: number;
}

export interface AuctionPricing {
  bidAmountBasis: "total" | "perUnit";
  currentPriceTotal: number;
  currentPricePerUnit: number;
  minIncrementTotal: number;
  minIncrementPerUnit: number;
  maxPriceTotal: number | null;
  quantity: number;
  unit: string;
}

export interface Bid {
  bidId?: number;
  bidAmount: number;
  bidderUserId?: number;
  bidderName?: string;
  createdAt?: string;
}
