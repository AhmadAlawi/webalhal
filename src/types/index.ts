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
  /** من GET /api/profile/UserType — farmer, trader, … */
  roleName?: string;
  fullName?: string;
  email?: string;
  phone?: string;
}

/** استجابة GET /api/profile/UserType/{userId} */
export interface ProfileUserType {
  roleId?: number;
  roleName?: string;
  description?: string;
  scope?: string;
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
  maxPrice?: number;
  endTime?: string;
  startTime?: string;
  secondEndTime?: string;
  status?: string;
  lifecycleStatus?: string;
  isBiddable?: boolean;
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
  winnerUserId?: number;
  chatConversationId?: number;
  conversationId?: number;
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
  minOrderQty?: number;
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
  description?: string | null;
  imageUrl?: string;
  thumbnailUrl?: string | null;
  linkUrl?: string;
  navigationType?: "internal_route" | "external_link" | string;
  navigationValue?: string;
  displayOrder?: number;
  buttonLabel?: string;
  titleColor?: string;
  subtitleColor?: string;
  ctaBackgroundColor?: string;
  ctaTextColor?: string;
  isEnabled?: boolean;
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
  offersCount?: number;
  createdAt?: string;
}

export interface AuctionPricing {
  bidAmountBasis: "total" | "perUnit";
  startingPriceTotal?: number;
  startingPricePerUnit?: number;
  currentPriceTotal: number;
  currentPricePerUnit: number;
  minIncrementTotal: number;
  minIncrementPerUnit: number;
  maxPriceTotal: number | null;
  maxPricePerUnit?: number | null;
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
