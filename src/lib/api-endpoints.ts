/**
 * مسارات API من docs/swagger.json — مصدر الحقيقة للويب
 * @see docs/swagger.json
 */

export const API = {
  auth: {
    login: "/api/auth/login",
    me: "/api/auth/me",
    refresh: "/api/auth/refresh",
  },
  profile: {
    me: "/api/profile/me",
    userType: (userId: number) => `/api/profile/UserType/${userId}`,
    phoneChangeRequest: "/api/profile/phone-change/request",
    phoneChangeConfirm: "/api/profile/phone-change/confirm",
  },
  categories: {
    list: (isActive = true) =>
      `/api/admin/categories?isActive=${isActive}`,
    byId: (id: number) => `/api/admin/categories/${id}`,
  },
  products: {
    list: "/api/admin/products",
    images: "/api/products/images",
  },
  crops: {
    list: "/api/crops",
    byId: (id: number) => `/api/crops/${id}`,
    byFarm: (farmId: number) => `/api/crops/by-farmland/${farmId}`,
  },
  ads: {
    app: "/api/advertisement/app",
    appBottom: "/api/advertisement/app/bottom",
    click: "/api/advertisement/click",
    view: (id: number) => `/api/advertisement/${id}/view`,
  },
  marketplace: {
    browse: "/api/marketplace/browse",
  },
  auctions: {
    open: "/api/auctions/open",
    byId: (id: number) => `/api/auctions/${id}`,
    join: (id: number, userId: number) =>
      `/api/auctions/${id}/join?userId=${userId}`,
    joinedByUser: (userId: number) => `/api/auctions/joined/by-user/${userId}`,
    byUser: (userId: number) => `/api/auctions/by-user/${userId}`,
    bids: (auctionId: number) => `/api/auctions/bids/${auctionId}`,
  },
  tenders: {
    open: "/api/tenders/open",
    byId: (id: number) => `/api/tenders/${id}`,
    joinedByUser: (userId: number) => `/api/tenders/joined/by-user/${userId}`,
    byUser: (userId: number) => `/api/tenders/userId/${userId}`,
    award: (tenderId: number, offerId: number) =>
      `/api/tenders/${tenderId}/award/${offerId}`,
    finish: (tenderId: number) => `/api/tenders/${tenderId}/finish`,
  },
  offers: {
    byTender: (tenderId: number) => `/api/offers/tender/${tenderId}`,
    byUser: (userId: number) => `/api/tenders/offers/by-user/${userId}`,
  },
  direct: {
    listings: "/api/direct/listings",
    listingsFiltered: "/api/direct/listings/filtered",
    listingById: (id: number) => `/api/direct/listings/${id}`,
    orders: "/api/direct/orders",
    orderById: (id: number) => `/api/direct/orders/${id}`,
    orderStatus: (id: number) => `/api/direct/orders/${id}/status`,
    buyerOrders: (userId: number) => `/api/direct/buyers/${userId}/orders`,
    sellerOrders: (userId: number) => `/api/direct/sellers/${userId}/orders`,
  },
  chat: {
    conversations: "/api/Chat/conversations",
    conversation: (id: number) => `/api/Chat/conversations/${id}`,
    messages: (id: number) => `/api/Chat/conversations/${id}/messages`,
    open: "/api/Chat/conversations/open",
    openOrder: (orderId: number) => `/api/Chat/open/order/${orderId}`,
    transportDeliver: (id: number) =>
      `/api/Chat/conversations/${id}/transport-deliver`,
    transportReceived: (id: number) =>
      `/api/Chat/conversations/${id}/transport-received`,
  },
  notifications: {
    list: "/api/notifications",
    unreadCount: "/api/notifications/unread/count",
    read: (id: number) => `/api/notifications/${id}/read`,
    readAll: "/api/notifications/read-all",
  },
  transport: {
    regions: "/api/transport-prices/regions",
    officialPrice: "/api/transport-prices/official",
    cheapestPrice: "/api/transport-prices/cheapest",
    requestsByContext: "/api/transport/requests/by-context",
    assignments: "/api/transport/assignments",
  },
  registration: {
    start: "/api/registration/start",
    step1: "/api/registration/step/1",
    verifyOtp: "/api/registration/verify-otp",
    resendOtp: "/api/registration/resend-otp",
    step2: "/api/registration/step/2",
    step3: (role: string) => `/api/registration/step/3/${role}`,
    submit: "/api/registration/submit",
  },
  passwordReset: {
    requestOtp: "/api/password-reset/request-otp",
    confirm: "/api/password-reset/confirm",
  },
  ticketing: {
    tickets: "/api/ticketing/tickets",
    ticket: (id: number) => `/api/ticketing/tickets/${id}`,
    messages: (ticketId: number) =>
      `/api/ticketing/tickets/${ticketId}/messages`,
  },
} as const;

/** أدوار التسجيل step/3 في Swagger */
export const REGISTRATION_STEP3_ROLE: Record<string, string> = {
  farmer: "farmer",
  trader: "trader",
  transporter: "transporter",
  gov_employee: "gov",
  agri_service: "agri",
};
