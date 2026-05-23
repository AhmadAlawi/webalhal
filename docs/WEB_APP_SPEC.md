# Rizik (رزق) — Web Application Specification

> **الغرض:** وثيقة مرجعية لبناء نسخة **Web** من تطبيق **Rizik** (Souq Al Hal) باستخدام AI agent + تصميم UI (Figma/صور).  
> **التطبيق المرجعي:** `rizaq-app` (Expo / React Native).  
> **API المرجعي:** `SOUQ_ALHAL_API_COMPLETE_GUIDE.md` + Swagger على `https://alhal.awnak.net/swagger`

---

## 0. Prompt سريع للـ AI Agent

```
Build a responsive RTL Arabic web app for Rizik (رزق) — Syrian agricultural marketplace (Souq Al Hal).

Stack: Next.js or React + TypeScript + Tailwind + Cairo font + @microsoft/signalr for auctions/chat.

API: NEXT_PUBLIC_API_URL=https://alhal.awnak.net
Auth: JWT Bearer in localStorage or httpOnly cookie.
Envelope: { success, data, message, error, traceId }

Match attached Figma/design. Reference this file (WEB_APP_SPEC.md) and SOUQ_ALHAL_API_COMPLETE_GUIDE.md.

Core: Home (auctions/tenders/direct tabs), auction live bidding, tenders, direct sales, transport, chat, notifications, account, multi-step registration.

RTL, primary #059669, rounded cards, Arabic copy from mobile screens.
```

---

## 1. نظرة عامة على المنتج

**Rizik (رزق)** منصة سوق زراعي تربط:

| roleId | الدور | الدور في المنصة |
|--------|-------|-----------------|
| 1 | مزارع (Farmer) | ينشئ **مزادات** و**بيع مباشر**، يشارك في **مناقصات** كمورّد |
| 2 | تاجر (Trader) | يزايد على **مزادات**، ينشئ **مناقصات**، يشتري **بيع مباشر** |
| 3 | ناقل (Transport) | يدير مزود النقل وخطوط الأسعار، يستقبل طلبات النقل ويقدّم عروضاً |
| 4 | حكومي (Government) | صلاحيات موسّعة (مزاد + مناقصة) |

**دورة الصفقة النموذجية:** اكتشاف → مزايدة/عرض → اتفاق → (اختياري) نقل → شات → إشعارات.

---

## 2. البنية التقنية

### 2.1 Mobile (المرجع الحالي)

| الطبقة | التقنية |
|--------|---------|
| Framework | Expo ~54, React Native, **expo-router** |
| Styling | NativeWind (Tailwind) + خط **Cairo** |
| Forms | react-hook-form + zod |
| i18n | i18next — عربي RTL |
| HTTP | `utils/http.ts` + services |
| Real-time | SignalR `@microsoft/signalr` |
| Auth storage | AsyncStorage (`storage/auth-storage`) |

### 2.2 Web (المطلوب)

| البند | التوصية |
|-------|---------|
| Framework | Next.js App Router أو Vite + React |
| RTL | `dir="rtl"`, logical CSS |
| Font | Cairo (Google Fonts) |
| API client | fetch/axios + interceptor للـ Bearer |
| SignalR | WebSocket من المتصفح — نفس hubs |
| Maps | Google Maps JS (بدل react-native-maps) |
| Push | Web Push اختياري — أو إشعارات in-app فقط في v1 |

### 2.3 الإعداد

```env
NEXT_PUBLIC_API_URL=https://alhal.awnak.net
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=...
```

الكود: `utils/config.ts` → `getApiBaseUrl()`.

---

## 3. عقد API

### 3.1 الرد القياسي

```json
{
  "success": true,
  "data": {},
  "message": "optional",
  "traceId": "optional",
  "error": { "code", "title", "detail", "status", "errors" }
}
```

### 3.2 المصادقة

```http
Authorization: Bearer <access_token>
```

**تسجيل الدخول:** `POST /api/auth/login`

```json
{
  "emailOrPhone": "string",
  "password": "string"
}
```

**نجاح:** `data.accessToken`, `data.refreshToken`, `data.userId`, `data.expiresAt`  
**409 registration_incomplete:** `data.registrationId`, `data.currentStep` — توجيه لإكمال التسجيل.

### 3.3 SignalR Hubs

| Hub | URL | الاستخدام |
|-----|-----|-----------|
| Auctions | `/hubs/auctions` | مزايدة حية، PriceTick، BidPlaced |
| Chat | `/hubs/chat` | رسائل فورية |
| Tenders | `/hubs/tenders` | حسب الباكند |
| Direct | `/hubs/direct` | حسب الباكند |

الاتصال: JWT في `accessTokenFactory` أو query حسب إعداد السيرفر.

---

## 4. الصلاحيات (يجب تطبيقها في Web)

مصدر: `hooks/useUserPermissions.ts`

```typescript
enum UserRole {
  Farmer = 1,
  Trader = 2,
  Transport = 3,
  Government = 4,
}

canCreateAuction  = Farmer | Government      // إنشاء مزاد
canJoinAuction    = Trader | Government     // المزايدة
canCreateTender   = Trader | Government     // إنشاء مناقصة
canJoinTender     = Farmer | Government     // تقديم عرض على مناقصة
// بيع مباشر — إنشاء listing: ليس للتاجر (Trader)
// FAB إنشاء: مخفي للناقل (Transport)
// تبويب طلبات النقل: للناقل فقط
```

**بوابة الدخول:** إجراءات حساسة تتطلب JWT — redirect إلى `/login`.

---

## 5. خريطة الشاشات (Web Routes المقترحة)

| المسار Web | Mobile | الوصف |
|------------|--------|-------|
| `/` | `/(tabs)/index` | الرئيسية |
| `/login` | `/login` | دخول |
| `/register/*` | `/registration/*` | تسجيل متعدد الخطوات |
| `/auctions` | `/auctions/index` | قائمة مزادات |
| `/auctions/:id` | `/auctions/[id]` | تفاصيل |
| `/auctions/:id/join` | `/auctions/join/[id]` | مزايدة حية |
| `/auctions/create` | `/auctions/create` | إنشاء مزاد |
| `/tenders` | `/tenders/index` | مناقصات |
| `/tenders/:id` | `/tenders/[id]` | تفاصيل |
| `/tenders/create` | `/tenders/create` | إنشاء |
| `/direct` | `/direct/index` | بيع مباشر — قائمة |
| `/direct/new` | `/direct/new` | إنشاء عرض |
| `/direct/:id/buy` | `/direct/buy` | شراء |
| `/orders/direct` | `/direct/orders` | طلباتي |
| `/transport/requests` | `transport-requests` tab | مشتري / عام |
| `/transport/inbox` | tab (ناقل) | وارد + معيّن |
| `/transport/provider/:id` | `/transport/[id]` | إدارة الناقل |
| `/chat` | `/(tabs)/messages` | قائمة محادثات |
| `/chat/:conversationId` | `/chat/[conversationId]` | محادثة |
| `/notifications` | `/(tabs)/notifications` | إشعارات |
| `/account` | `/(tabs)/account` | حساب |
| `/farms` | `/farms/*` | مزارع |
| `/tickets` | `/tickets/*` | دعم |

### 5.1 التبويبات السفلية (Mobile → Web nav)

1. **الرئيسية** — دائماً  
2. **طلبات النقل** — `roleId === 3` فقط  
3. **المحادثات** — مع badge غير مقروء  
4. **الإشعارات** — مع badge  
5. **الحسابات**

---

## 6. الشاشة الرئيسية `/`

### 6.1 التخطيط (من أعلى لأسفل)

1. **Banner Carousel** — `GET /api/advertisement/app?enabledOnly=true`  
   - تتبع: `POST /api/advertisement/{id}/view`, `POST /api/advertisement/click`  
   - Header اختياري: `X-Platform: web`

2. **شريط بحث** — يمرّر `searchQuery` للتبويبات

3. **أقسام المنتجات** — `GET /api/categories` (+ `GET /api/categories/{id}` للأصناف الفرعية)

4. **بطاقات خدمات** — معلومات تسويقية (توصيل، تخزين، بذور…) — `components/ui/home/ServicesCardContainer.tsx`

5. **تبويبات السوق** (Pill tabs):
   - **المزادات** → `AuctionsTab`
   - **المناقصات** → `TendersTab`
   - **البيع المباشر** → `LiveSellTab` (`GET /api/marketplace`)

6. **تحليل السوق** — widget

7. **المفضلات** — localStorage / `GET /api/favorites` إن وُجد

8. **شريط إعلانات سفلي** — `GET /api/advertisement/app/bottom`

9. **FAB** — إنشاء مناقصة / مزاد / بيع مباشر (حسب الصلاحيات)

### 6.2 فلاتر الرئيسية

- فلتر عام: قسم + بحث نصي  
- `FilterBottomSheet`: فلاتر منفصلة لكل تبويب (سعر، تاريخ، محافظة، حالة…)

### 6.3 APIs للقوائم

| التبويب | Endpoint رئيسي |
|---------|----------------|
| مزادات | `GET /api/auctions/open` (+ query filters) |
| مناقصات | `GET /api/tenders/open` أو `GET /api/tenders/filtered` |
| بيع مباشر | `GET /api/marketplace` |

**صور المزاد:** `productMainImage`, `images`, `productImageUrl`  
**صور المباشر:** `utils/directImages.ts` → `getDirectMainImage`

---

## 7. المزادات (Auctions)

### 7.1 قائمة وتفاصيل

| Action | Method | Path |
|--------|--------|------|
| قائمة مفتوحة | GET | `/api/auctions/open` |
| تفاصيل | GET | `/api/auctions/{id}` |
| مزايدات | GET | `/api/auctions/bids/{auctionId}` |
| انضمام HTTP | GET | `/api/auctions/{id}/join?userId={userId}` |
| طلب وصول (خاص) | POST | `/api/auctions/{id}/access` body: `targetUserId` |

**فلاتر `getOpenAuctionsFiltered`:** `categoryId`, `subCategoryId`, `searchTerm`, `minStartingPrice`, `maxStartingPrice`, `startTimeFrom`, `endTimeTo`, `sortBy`, `sortOrder`, `page`, `pageSize` — راجع `services/auction.ts`.

### 7.2 إنشاء مزاد — `POST /api/auctions?createdByUserId={userId}`

**من يستطيع:** Farmer, Government  
**UI:** 3 خطوات — مزرعة → محصول → تفاصيل (`app/auctions/create.tsx`)

**Body (`CreateAuctionDto`):**

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `cropId` | number | yes | من محصول المزرعة |
| `startingPrice` | number | yes | سعر البداية |
| `minIncrement` | number | yes | أقل زيادة |
| `startTime` | ISO string | yes | بداية المزاد |
| `endTime` | ISO string | yes | نهاية المزاد |
| `secondEndTime` | ISO string | no | تمديد (عادة قبل النهاية بساعتين) |
| `auctionTitle` | string | no | |
| `auctionDescription` | string | no | |

**Dependencies:**

- `GET /api/farms` (مزارع المستخدم)  
- `GET /api/crops?farmId={id}` أو `getCropsByFarm`

### 7.3 المزايدة الحية — `/auctions/:id/join`

**التسلسل:**

1. `GET /api/auctions/{id}/join?userId=` — تسجيل المشارك  
2. اتصال SignalR: `{baseUrl}/hubs/auctions` + Bearer  
3. `invoke("JoinAuction", auctionId, userId, inviteCode?)` — كود للمزادات الخاصة  
4. استقبال: `BidPlaced`, `PriceTick`, `GetCurrentPrice`  
5. مزايدة: `invoke("PlaceBid", payload)`

**PlaceBid payload:**

```json
{
  "AuctionId": 123,
  "BidderUserId": 456,
  "bidAmount": 150000
}
```

> `bidAmount`: حسب `pricing.bidAmountBasis` — إما إجمالي أو لكل وحدة. استخدم منطق `utils/auctionPricing.ts` (`resolvePlaceBidAmount`, `parseAuctionPricing`).

**كائن pricing (من REST أو SignalR):**

```typescript
{
  bidAmountBasis: 'total' | 'perUnit',
  currentPriceTotal: number,
  currentPricePerUnit: number,
  minIncrementTotal: number,
  minIncrementPerUnit: number,
  maxPriceTotal: number | null,  // سقف حكومي
  quantity: number,
  unit: string
}
```

**قواعد UI:**

- صاحب المزاد لا يزايد (watch فقط)  
- التحقق من `minIncrement` والسقف الحكومي `maxPrice`  
- مزاد خاص: `inviteCode` + `requestAuctionAccess`

---

## 8. المناقصات (Tenders)

### 8.1 APIs

| Action | Method | Path |
|--------|--------|------|
| قائمة | GET | `/api/tenders/open` أو filtered |
| تفاصيل | GET | `/api/tenders/{id}` |
| إنشاء | POST | `/api/tenders` |
| عروض المناقصة | GET | `/api/offers/tender/{tenderId}` |

### 8.2 إنشاء مناقصة — `POST /api/tenders`

**من يستطيع:** Trader, Government  
**UI:** 3 خطوات — منتج → تفاصيل → صور (`app/tenders/create.tsx`)

**Body (`CreateTenderDto`):**

| Field | Type | Required |
|-------|------|----------|
| `productId` | number | yes |
| `quantity` | number | yes |
| `deliveryFrom` | ISO | yes |
| `deliveryTo` | ISO | yes |
| `startTime` | ISO | yes |
| `endTime` | ISO | yes |
| `title` | string | no |
| `description` | string | no |
| `cropName` | string | no |
| `unit` | string | no |
| `maxBudget` | number | no |
| `deliveryLocation` | string | no |
| `imageUrls` | string[] | no |

**وحدات شائعة:** كغ، طن، صندوق، كيس، لتر…

**Dependencies:** `GET /api/products` → `listProducts`

### 8.3 تقديم عرض (مزارع) — `POST /api/offers?supplierUserId={userId}`

**Body (`CreateOfferDto`):**

| Field | Type | Required |
|-------|------|----------|
| `tenderId` | number | yes |
| `price` | number | yes |
| `quantity` / `quantityOffered` | number | recommended |
| `description` | string | no |

---

## 9. البيع المباشر (Direct / Marketplace)

### 9.1 APIs

| Action | Method | Path |
|--------|--------|------|
| marketplace | GET | `/api/marketplace` |
| قائمة مفلترة | GET | `/api/direct/listings/filtered` |
| تفاصيل | GET | `/api/direct/listings/{id}` |
| إنشاء | POST | `/api/direct/listings` |
| طلب شراء | POST | `/api/direct/orders` |
| طلباتي | GET | `/api/direct/orders` (أو by user) |

### 9.2 إنشاء عرض — `POST /api/direct/listings`

**من يستطيع:** Farmer, Government — **ليس Trader**  
**UI:** 3 خطوات — مزرعة/محصول → سعر/وحدة → مراجعة

**Body (كما يرسله التطبيق):**

| Field | Type | Required |
|-------|------|----------|
| `sellerUserId` | number | yes |
| `cropId` | number | yes |
| `unitPrice` | number | yes |
| `price` | number | yes (نفس unitPrice) |
| `availableQty` | number | yes |
| `minOrderQty` | number | yes (غالباً 1) |
| `maxOrderQty` | number | no |
| `unit` | string | yes |
| `cropName` | string | no |
| `title` | string | no |
| `imageUrls` | string[] | no |

### 9.3 شراء — `POST /api/direct/orders`

**Body (`CreateOrderDto`):**

| Field | Type | Required |
|-------|------|----------|
| `listingId` | number | yes |
| `buyerUserId` | number | yes |
| `qty` | number | yes |
| `deliveryAddress` | string | yes |
| `paymentMethod` | string | yes (مثلاً "كاش") |

**ملاحظة:** التطبيق الحالي يطلب الكمية الكاملة `availableQty` في بعض الحالات.

---

## 10. النقل (Transport)

مرجع كامل: `SOUQ_ALHAL_API_COMPLETE_GUIDE.md` §6.6

### 10.1 إنشاء طلب نقل — `POST /api/transport/requests`

**Body (`CreateTransportRequestDto`):**

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `orderId` | number | yes | معرف الصفقة |
| `orderType` | string | yes | `auction` \| `tender` \| `direct` |
| `buyerUserId` | number | yes | المشتري |
| `fromCityId` | number | yes* | من `GET /api/cities` |
| `toCityId` | number | yes* | |
| `distanceKm` | number | yes | |
| `productType` | string | yes | |
| `weightKg` | number | yes | |
| `preferredPickupDate` | ISO | yes | |
| `preferredDeliveryDate` | ISO | yes | |
| `conversationId` | number | no | من الشات |
| `contextType` / `contextId` | string/number | no | بديل |
| `fromRegion` / `toRegion` | string | no | عرض نصي |
| `specialRequirements` | string | no | |

**Response:** `requestId`, `notifiedTransporters`, `notifyHint` (عربي عند 0)

### 10.2 عرض ناقل — `POST /api/transport/offers`

| Field | Type | Notes |
|-------|------|-------|
| `transportRequestId` | number | |
| `transporterId` | number | **TransportProviderId** (ليس UserId دائماً) |
| `offeredPrice` | number | |
| `estimatedPickupDate` | ISO | |
| `estimatedDeliveryDate` | ISO | |
| `notes` | string | optional |

### 10.3 قبول / رفض (مشتري)

| Action | Method | Path |
|--------|--------|------|
| قبول عرض | POST | `/api/transport/offers/{offerId}/accept` |
| رفض عرض | POST | `/api/transport/offers/{offerId}/reject` |
| إلغاء طلب | POST | `/api/transport/requests/{id}/cancel` |
| إعادة إشعار | POST | `/api/transport/requests/{id}/notify` |

### 10.4 قوائم

| المستخدم | Endpoint |
|----------|----------|
| مشتري | `GET /api/transport/me/buyer-requests` |
| ناقل — وارد | `GET /api/transport/me/notified-requests` |
| ناقل — معيّن | `GET /api/transport/me/requests` |
| عداد وارد | `GET /api/transport/me/notified-requests/count` |

### 10.5 تتبع — `POST /api/transport/requests/{requestId}/tracking`

```json
{
  "transportProviderId": 1,
  "latitude": 33.5,
  "longitude": 36.3,
  "currentLocation": "وصف",
  "status": "in_transit"
}
```

### 10.6 شات النقل

عند التعيين: محادثات `transport_pickup` و `transport_delivery`

| Action | Method | Path |
|--------|--------|------|
| تسليم (بائع/ناقل) | POST | `/api/Chat/conversations/{id}/transport-deliver` |
| استلام (ناقل/مشتري) | POST | `/api/Chat/conversations/{id}/transport-received` |

**حالات الطلب:** `open` → `negotiating` → `assigned` → `completed` / `cancelled`  
**حالات العرض:** `pending` → `accepted` / `rejected`

### 10.7 مطابقة خطوط الأسعار

`GET /api/transport/matches?fromCityId=&toCityId=&includeReverseRoute=true`

---

## 11. المحادثات (Chat)

### 11.1 REST

- Base: `/api/Chat` (انتبه لحالة الأحرف على Linux)
- فتح محادثة: حسب `contextType` + `contextId`
- أنواع السياق: `auction`, `tender`, `direct`, `transport_pickup`, `transport_delivery`

### 11.2 SignalR

- Hub: `/hubs/chat` — أحداث: `MessageCreated`, `JoinConversation`, `SendMessage`, `MarkAsRead`
- أحداث: رسالة جديدة، تحديث حالة المحادثة

### 11.3 Deep links للإشعارات

من `services/notificationDeepLinks.ts`:

```
/chat/{conversationId}
/auctions/{auctionId}
/tenders/{tenderId}
/transport-requests/{transportRequestId}
/direct/orders
/listings/{listingId}
```

---

## 12. الإشعارات

| Action | Method | Path |
|--------|--------|------|
| قائمة | GET | `/api/notifications` |
| غير مقروء | GET | عداد (انظر `notificationService`) |
| تسجيل جهاز | POST | `/api/notifications` (FCM token — web اختياري) |

---

## 13. التسجيل متعدد الخطوات

| # | Endpoint | Body ملخص |
|---|----------|-----------|
| 0 | `POST /api/registration/start` | فارغ → `registrationId` |
| 1 | `POST /api/registration/step/1` | `registrationId`, `fullName`, `email`, `phone`, `password` |
| OTP | `POST /api/registration/verify-otp` | `registrationId`, `otp` |
| 2 | `POST /api/registration/step/2` | `registrationId`, `roleName` |
| 3 | `POST /api/registration/step/3/{role}` | حقول حسب الدور |
| 4 | `POST /api/registration/step/4/document` | multipart: `registrationId`, `docType`, `file` |
| 4b | `POST /api/registration/step/4/complete` | `registrationId` GUID |
| 5 | `POST /api/registration/step/5/payout` | `type` 1=Wallet 2=Bank, `providerName`, … |
| 5b | `POST /api/registration/step/5/complete` | GUID |
| 10 | `POST /api/registration/submit` | GUID |

**أدوار step/2:** `farmer`, `trader`, `transporter`, `agri_service`, `gov_employee`

**استئناف:** `GET /api/registration/{registrationId}`

---

## 14. الحساب والملف الشخصي

| Feature | Path / API |
|---------|------------|
| الملف | `GET /api/profile` أو `getMyProfile` |
| نوع المستخدم | `getCurrentUserType` → `roleId` |
| تعديل | `/edit-profile` |
| نشاطاتي | `/my-activity` |
| مزادات منضم | `/auctions/joined` |
| مناقصات منضم | `/tenders/joined` |
| مزارع | `/farms` |
| ناقل — توفر | `PUT` availability على `transportProviderId` |
| تذاكر | `/tickets` |
| محفظة | `/wallet` |

---

## 15. المواقع والخرائط

| API | Path |
|-----|------|
| محافظات | `GET /api/governorates` |
| مدن | `GET /api/cities` |
| مدن بمحافظة | `GET /api/cities/by-governorate/{id}` |

**Web:** Google Maps لاختيار إحداثيات → `utils/resolveGovernorateCityFromCoords.ts` (منطق reverse geocode).

---

## 16. UI / Design Tokens

| Token | Value |
|-------|-------|
| Primary green | `#059669`, `#16a34a`, `#047857` |
| Font | Cairo (Bold, SemiBold, Regular) |
| Direction | RTL |
| Cards | `rounded-2xl` / `rounded-3xl`, border gray-100 |
| Tab active | emerald-600 |
| Badges | أحمر `#ef4444` للعدادات |

**أيقونة التطبيق:** `assets/images/9.png`  
**Scheme deep link:** `rizaqapp://`

---

## 17. ملفات مرجعية في المستودع

| الموضوع | الملف |
|---------|-------|
| API شامل | `SOUQ_ALHAL_API_COMPLETE_GUIDE.md` |
| تسعير مزاد | `utils/auctionPricing.ts` |
| صور مزاد | `utils/auctionImages.ts` |
| صور مباشر | `utils/directImages.ts` |
| صلاحيات | `hooks/useUserPermissions.ts` |
| HTTP | `utils/http.ts` |
| خدمات | `services/*.ts` |
| أنواع | `types/*.ts` |
| الرئيسية | `app/(tabs)/index.tsx`, `components/ui/home/*` |

---

## 18. ما لا يُنفَّذ في Web v1 (إلا إن طُلب)

- FCM native push (استبدل بإشعارات in-app أو Web Push لاحقاً)
- Haptics, expo-location native
- EAS builds, app version force modal (يمكن نسخ منطق `app-version` API)
- تبويب explore المخفي

---

## 19. قائمة تحقق للمطور / Agent

- [ ] RTL + Cairo على كل الصفحات
- [ ] JWT + refresh handling
- [ ] الصلاحيات حسب roleId على FAB والأزرار
- [ ] الرئيسية: 3 تبويبات + إعلانات + فئات
- [ ] مزاد: SignalR PlaceBid + pricing basis
- [ ] مناقصة: إنشاء + عروض
- [ ] بيع مباشر: listing + order
- [ ] نقل: create request + offers + accept
- [ ] شات: REST + hub
- [ ] إشعارات + deep links
- [ ] تسجيل متعدد الخطوات
- [ ] CORS: origins مسجّلة على الباكند

---

*آخر تحديث: مبني على `rizaq-app` v1.0.2 — Expo 54.*
