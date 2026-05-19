# Souq Al Hal — API Guide

> **فهرس عربي سريع:** **§6.5** — الشات: **`/api/Chat`**، `transport-deliver` / `transport-received`، **`transport_pickup`** / **`transport_delivery`**. **§6.6** — ملخص إنجليزي؛ **§6.6.1** قبول/رفض؛ **§6.6.2** — **النقل شرح كامل** (كل الحالات، مسار أ/ب، inbox، تتبع، شات). **§6.3 / §6.7** — مزادات **`productMainImage`**؛ إعلانات **`X-Platform`**. **خرائط Google:** SDK في بناء التطبيق. **§7** — فهرس المسارات.

Single reference for clients integrating with the Souq Al Hal marketplace backend: contracts, registration (with every field), authentication, standard responses, cross-cutting behavior, and end-to-end workflows. Route inventory is grouped by **business area** (not by codebase layout).

**Convention:** JSON uses **camelCase** property names. Dates are typically ISO-8601 unless noted otherwise.

---

## 1. Base URL and discovery

- Deployments use your environment host (for example `https://alhal.awnak.net`).
- Interactive exploration: **`/swagger`** (when enabled).
- Health checks or probes depend on deployment; use Swagger or a known read-only `GET` for smoke tests.

---

## 2. Standard response envelope

Most endpoints return a wrapper shaped like:

| Field       | Type    | Meaning |
|------------|---------|---------|
| `success`  | boolean | Operation succeeded |
| `data`     | object  | Payload when successful |
| `message`  | string  | Human-readable summary (optional) |
| `traceId`  | string  | Correlation id for support logs |
| `error`    | object  | Present when `success` is false |
| `meta`     | object  | Pagination or extras when used |

**Error object** (when present):

| Field    | Type   | Meaning |
|---------|--------|---------|
| `code`  | string | Stable machine code |
| `title` | string | Short title |
| `detail`| string | Longer explanation |
| `status`| number | HTTP status |
| `errors`| map    | Field-level validation messages (optional) |

**Important:** A few routes (notably **`POST /api/auth/login`** on success) return a **custom JSON shape** without this wrapper for historical compatibility. Always branch on HTTP status and inspect the body schema described below.

---

## 3. Authentication and authorization

### 3.1 JWT bearer

For protected routes, send:

```http
Authorization: Bearer <access_token>
```

Tokens are issued after successful login (see §5.2) or related flows. Policies vary by endpoint (`admin`, role-based, ownership checks).

### 3.2 Session token (legacy / simple flows)

Some legacy endpoints reference a **session token** (for example after **`POST /api/auth/register`**). Prefer the **access token / refresh token** pair from the visits-based login when available.

### 3.3 Anonymous endpoints

Many read endpoints and public assets allow anonymous access; sensitive writes require authentication.

---

## 4. CORS and browsers

The API uses a configured **CORS** policy for approved web origins (admin portals, marketing sites, local dev ports). Browser calls from a web app must send an allowed **`Origin`**.

**Public app ads list:** `GET /api/advertisement/app` is additionally configured so cross-origin browser clients (for example `http://localhost:3000` calling production) can receive CORS headers for that path only. Other routes still rely on the global allow-list or same-origin proxies.

---

## 5. Identity: registration and login

There are **two** onboarding paths:

| Path | Purpose |
|------|---------|
| **Multi-step registration** (`/api/registration/*`) | Production-grade signup with OTP, role-specific profiles, documents, payout, submission |
| **Simple register** (`POST /api/auth/register`) | Minimal account creation returning a session-style token |

---

### 5.1 Multi-step registration (`/api/registration`)

All steps use the **`registrationId`** (**GUID**) returned when you start the session. Keep it in client state until completion.

#### Step 0 — Start session

**`POST /api/registration/start`**  
Body: empty.

**Response `data`:**

| Field              | Type | Description |
|-------------------|------|-------------|
| `registrationId`  | guid | Session id — required on all following calls |
| `currentStep`     | int  | Usually `1` |
| `expiresAt`       | datetime | Session expiry |

---

#### Step 1 — Account basics + OTP

**`POST /api/registration/step/1`**  
**JSON body:**

| Field             | Type   | Required | Description |
|------------------|--------|----------|-------------|
| `registrationId` | guid   | yes      | From step 0 |
| `fullName`       | string | yes      | Display name |
| `email`          | string | yes      | Unique email |
| `phone`          | string | yes      | Used for SMS OTP |
| `password`       | string | yes      | Account password |

**Response `data` (typical):**

| Field      | Type   | Description |
|-----------|--------|-------------|
| `otpSent` | bool   | Whether OTP dispatch succeeded |
| `devOtp`  | string | **Development only:** OTP may be echoed for testing |

---

#### OTP — Verify

**`POST /api/registration/verify-otp`**  

| Field             | Type   | Description |
|------------------|--------|-------------|
| `registrationId` | guid   | Session id |
| `otp`            | string | Code received by SMS |

Success advances to **step 2**.

---

#### OTP — Resend

**`POST /api/registration/resend-otp`**  

| Field             | Type | Description |
|------------------|------|-------------|
| `registrationId` | guid | Session id |

---

#### Step 2 — Role selection

**`POST /api/registration/step/2`**  

| Field             | Type   | Description |
|------------------|--------|-------------|
| `registrationId` | guid   | Session id |
| `roleName`       | string | One of: **`farmer`**, **`trader`**, **`transporter`**, **`agri_service`**, **`gov_employee`** |

Then call exactly **one** of the Step 3 endpoints matching that role.

---

#### Step 3 — Role-specific profile

##### Farmer — `POST /api/registration/step/3/farmer`

| Field                   | Type        | Required | Description |
|-------------------------|------------|----------|-------------|
| `registrationId`        | guid       | yes      | Session id |
| `nationality`           | string     | yes      | Nationality |
| `birthDate`             | datetime?  | no       | Birth date |
| `birthPlace`            | string?    | no       | Birth place |
| `province`              | string?    | no       | Province |
| `district`              | string?    | no       | District |
| `farmAddress`           | string?    | no       | Farm address |
| `locationLat`           | number?    | no       | Latitude |
| `locationLng`           | number?    | no       | Longitude |
| `storageAvailable`      | bool       | yes      | Has storage |
| `coldStorageCapacityKg` | decimal?   | no       | Capacity if cold storage |
| `landOwnership`         | string     | yes      | Ownership description |
| `packagingMethods`      | string[]?  | no       | Packaging types |

##### Trader — `POST /api/registration/step/3/trader`

| Field             | Type    | Required | Description |
|------------------|---------|----------|-------------|
| `registrationId` | guid    | yes      | Session id |
| `companyName`    | string  | yes      | Legal / trade name |
| `companyEmail`   | string? | no       | Company email |
| `companyPhone`   | string? | no       | Company phone |
| `activity`       | string  | yes      | Business activity |
| `taxNumber`      | string? | no       | Tax id |
| `licenseNumber`  | string? | no       | Trade license |
| `canBuy`         | bool    | yes      | Domestic buying |
| `canImport`      | bool    | yes      | Import capability |
| `canExport`      | bool    | yes      | Export capability |

##### Transporter — `POST /api/registration/step/3/transporter`

| Field               | Type    | Required | Description |
|--------------------|---------|----------|-------------|
| `registrationId`   | guid    | yes      | Session id |
| `accountType`      | string  | yes      | Account classification |
| `fleetCapacity`    | int?    | no       | Fleet size hint |
| `coverageAreaText` | string? | no       | Areas served (free text) |

##### Government employee — `POST /api/registration/step/3/gov`

| Field             | Type    | Required | Description |
|------------------|---------|----------|-------------|
| `registrationId` | guid    | yes      | Session id |
| `agency`         | string  | yes      | Agency / employer |
| `position`       | string? | no       | Job title |

##### Agricultural service — `POST /api/registration/step/3/agri`

| Field               | Type      | Required | Description |
|--------------------|-----------|----------|-------------|
| `registrationId`   | guid      | yes      | Session id |
| `companyName`      | string    | yes      | Service provider name |
| `serviceCategories`| string[]? | no       | Categories offered |
| `licenseNumber`    | string?   | no       | Professional license |

---

#### Step 4 — Documents (multipart)

**`POST /api/registration/step/4/document`**  
`multipart/form-data` (large payload allowed server-side).

**Form fields:**

| Field             | Type   | Description |
|------------------|--------|-------------|
| `registrationId` | guid   | Session id |
| `docType`        | int    | Document type enum (see below) |
| `number`         | string | Document number (optional) |
| `issuedBy`       | string | Issuer (optional) |
| `expiryDate`     | datetime | Expiry (optional) |
| `file`           | file   | Upload binary |

**`docType` values (`DocumentType`):**

| Value | Name                  |
|-------|------------------------|
| 1     | NationalId           |
| 2     | TradeLicense           |
| 3     | TaxCertificate         |
| 4     | DriverLicense          |
| 5     | VehicleRegistration    |
| 99    | Other                  |

**Supporting endpoints:**

- **`GET /api/registration/step/4/documents/{registrationId}`** — List uploaded documents.
- **`DELETE /api/registration/step/4/document/{documentId}?registrationId={guid}`** — Remove a document.
- **`POST /api/registration/step/4/complete`** — JSON body: raw **`registrationId`** GUID (string in JSON). Marks documents step complete.

---

#### Step 5 — Payout accounts

**`POST /api/registration/step/5/payout`** — JSON:

| Field             | Type   | Description |
|------------------|--------|-------------|
| `registrationId` | guid   | Session id |
| `type`           | int    | **`1`** = Wallet, **`2`** = Bank (`PayoutType`) |
| `providerName`   | string | Wallet provider or bank name |
| `accountNumber`  | string | Wallet / account number (optional) |
| `iban`           | string | IBAN for bank (optional) |
| `isDefault`      | bool   | Set as default |

**Other:**

- **`GET /api/registration/step/5/payout/{registrationId}`** — List payout methods.
- **`PATCH /api/registration/step/5/payout/{payoutId}/default`** — Body: registration GUID JSON.
- **`POST /api/registration/step/5/complete`** — Body: registration GUID JSON.

---

#### Submit registration

**`POST /api/registration/submit`** — Body: registration GUID JSON. Final submission for review.

---

#### Status polling

**`GET /api/registration/{registrationId}`**  

Response includes flags such as: `currentStep`, `isCompleted`, `expired`, `expiresAt`, `accountFilled`, `otpVerified`, `roleSelected`, `documentsUploaded`, `payoutSet` — use these to resume UI after refresh.

---

### 5.2 Login (`POST /api/auth/login`)

**JSON body:**

| Field           | Type   | Description |
|----------------|--------|-------------|
| `emailOrPhone` | string | Email **or** phone |
| `password`     | string | Password |

**Success (`200`):** Custom shape (not always the generic `ApiResponse` wrapper):

- `success`, `traceId`, `message`
- `data`: `userId`, `fullName`, **`accessToken`**, **`refreshToken`**, **`expiresAt`**

**Registration incomplete (`409 Conflict`):**  

- `error.code`: typically `registration_incomplete`
- `data`: `registrationId`, `currentStep`, `canSkipDocuments`, `nextStep`
- Optionally **`Token`** (access/refresh) when the server allows continuing registration (e.g. document step) — treat as described in the live response.

---

### 5.3 Simple register (`POST /api/auth/register`)

**JSON body:**

| Field       | Type   |
|------------|--------|
| `fullName` | string |
| `email`    | string |
| `phone`    | string |
| `password` | string |

Returns wrapped **`LoginResponse`**: user summary + **session token** (legacy pattern).

---

### 5.4 Password reset (`/api/password-reset`)

| Step | Method | Path | Body |
|------|--------|------|------|
| Request OTP | POST | `/api/password-reset/request-otp` | `{ "phone": "<digits>" }` |
| Confirm | POST | `/api/password-reset/confirm` | `{ "phone", "otp", "newPassword" }` |

Responses use the standard envelope. Messaging is intentionally discreet (“if an account exists…”) on OTP request.

---

### 5.5 Google sign-in (browser OAuth)

**`GET /api/auth/google/start?returnUrl=<optional>`** — Redirects user to Google.  
**`GET /api/auth/google/callback`** — Completes OAuth; redirects browser to **`Frontend:CallbackUrl`** (or `returnUrl`) with **`token`** query parameter for the SPA to store.

Mobile apps usually use native Google SDK + backend token exchange if you add one; this stack centers on **web redirect**.

---

## 6. Core business workflows (high level)

These flows describe **how products of the API fit together** for typical users. Exact paths are grouped in §7.

### 6.1 New trader / farmer onboarding

1. **`POST /api/registration/start`** → obtain `registrationId`.
2. **Step 1** account + OTP → **verify-otp** → **step 2** role.
3. **Step 3** profile for chosen role → **step 4** documents → **step 5** payout → **submit**.
4. Admin approval may be required before full marketplace participation (domain rules).
5. **Login** receives JWTs when registration gate clears.

### 6.2 Browse and buy (direct sales)

1. Browse **`/api/marketplace`** listings (filters per controller).
2. Use **`/api/direct`** for listing detail, cart-like flows, and order placement as implemented.
3. **`/api/orders`** tracks purchases and status.

### 6.3 Auctions

1. Discover auctions via **`/api/auctions`** (list, filters, detail).
2. **Open list images:** **`GET /api/auctions/open`** (and general auction list responses) include stable camelCase fields **`productMainImage`**, **`images`**, and **`productImageUrl`** — clients should prefer these names rather than guessing per environment.
3. Bidding and payments may involve **`/api/auctions`** sub-routes and **`/api/payments`** / integrations (see Swagger).
4. Notifications (**`/api/notifications`**) alert on outbid / closing.

### 6.4 Tenders

1. **`/api/tenders`** for publish / browse / offers (government or institutional procurement flows).
2. **`/api/offers`** for tender-specific bids where applicable.

### 6.5 Chat and negotiations

1. **REST base path:** **`/api/Chat`** (controller name `Chat`; match casing your host expects — Linux deployments are often case-sensitive). SignalR hub: **`/hubs/chat`** for real-time updates.
2. **Threads** are tied to a `contextType` + `contextId` (for example `auction` + auction id, `direct` + listing id, `tender` + tender id). Summaries and messages endpoints are under this controller (see Swagger).
3. **Auction reopen:** if a conversation for the same auction already exists, `OpenAsync` does **not** create a duplicate row but may **send one push per participant** so the winner and seller are notified when the chat becomes available again.
4. **Transport handoff chats** use `contextType` values **`transport_pickup`** and **`transport_delivery`** with `contextId` = `transportRequestId`. After a transporter is assigned, use:
   - **`POST /api/Chat/conversations/{conversationId}/transport-deliver`** — seller (pickup) or transporter (delivery) confirms handoff.
   - **`POST /api/Chat/conversations/{conversationId}/transport-received`** — transporter (pickup) or buyer (delivery) confirms receipt.  
   Do **not** use the generic `mark-delivered` / `mark-received` paths when transport is assigned; the API returns a clear error in that case.
5. **Pickup hints on conversation payloads:** `ConversationView` may include `farmCity`, `farmGovernorate`, and when resolvable from the farm row **`farmCityId`**, **`farmGovernorateId`** (same `CityId` universe as **`GET /api/cities`**). Use these to pre-fill transport `fromCityId` on the client.

### 6.6 Transport and logistics

> **Full reference (Arabic, all cases):** see **§6.6.2** — paths A/B, inbox, tracking, chat handoff, state machine, `notifyHint`, misconceptions.

1. **City identifiers:** `fromCityId` / `toCityId` on **`POST /api/transport/requests`** and on **`POST /api/transport/price-lines`** must be **`CityId` values from `GET /api/cities`** (or `GET /api/cities/by-governorate/{id}`). Notifications and matching use these ids against active price lines (including **reversed** route A↔B when enabled).
2. **`GET /api/transport`** — list transporters with **active** `priceLines` (includes **`isAvailable`** from the database). Use as the buyer-facing catalogue when you do not call `matches`.
3. **`GET /api/transport/matches`** — query: `fromCityId`, `toCityId` (preferred), or `fromRegion` / `toRegion` as **numeric governorate id strings**; optional `includeReverseRoute` (default **`true`**) so a line stored B→A still matches request A→B. Response items include `fromCityId`, `toCityId`, `fromRegion`/`toRegion` (display names), `priceLineId`, `transportProviderId`, `isAvailable`, etc.
4. **`POST /api/transport/requests`** — body: `TransportNegotiationRequestDto` (`contextType`/`contextId` or `orderType`/`orderId`, `buyerUserId` = authenticated user, optional `conversationId`, required `fromCityId`/`toCityId`, optional dates/weight/distance/notes). Status stays **`open`** until accept/assign (not auto-`negotiating` on first offer). Notify targets transporters with an **active price line** on the route (reverse optional); **`isAvailable` does not gate push**. Response: **`requestId`**, **`notifiedTransporters`**, optional Arabic **`notifyHint`** when count is 0 (same on **`POST …/notify`**).
5. **Direct assign:** **`POST /api/transport/assignments`** — buyer assigns from a matched price line; must align `conversationId`, `orderType`, `orderId` with the deal chat.
6. **Offers:** **`POST /api/transport/offers`** — `transporterId` in the body is the **`TransportProviderId`** (from `GET /api/transport`). **Legacy:** the same field may be the authenticated transporter’s **`UserId`**; the server resolves it when it matches the current user.
7. **Reject / cancel / update:** **`POST /api/transport/offers/{offerId}/reject`**, **`POST /api/transport/requests/{id}/cancel`**, **`PUT /api/transport/requests/{id}`** (partial update; only sent fields apply; `open` / `negotiating` only for cancel/update).
8. **Lists:** **`GET /api/transport/me/buyer-requests`**, **`GET /api/transport/me/requests`** (assigned jobs), **`GET /api/transport/me/notified-requests`** (+ **`/count`**) for candidate transporters before assignment. **`GET /api/transport/requests`** is **admin-only**.
9. **Tracking:** **`GET/POST /api/transport/requests/{requestId}/tracking`** — body uses **`transportProviderId`** (preferred) or **`transporterId`** as synonym for the same provider id; only the assigned transporter may POST.
10. **Request detail:** **`GET /api/transport/requests/{id}`** includes **`suggestedPickupCityId`** / **`suggestedPickupGovernorateId`** when the farm can be resolved from the deal context (auction crop farm; direct seller farm; tender buyer farm as a weak hint).
11. **Admin:** **`PUT /api/transport/{id}/verify`** — `admin` role only.
12. **`/api/transport-prices`** — reference / government pricing helpers (`official`, `cheapest`, etc.).

#### 6.6.1 Approve / reject — who does what

The API separates **transport requests** from **transport offers**. Do not use “accept” on the request itself for transporters.

| Role | Action | Endpoint | Notes |
|------|--------|----------|--------|
| **Buyer** | Accept a transporter’s offer (assign job) | `POST /api/transport/offers/{offerId}/accept` | Sets request toward **`assigned`** |
| **Buyer** | Reject a pending offer | `POST /api/transport/offers/{offerId}/reject` | Optional body: `{ "notes": "..." }` |
| **Buyer** | Cancel whole request | `POST /api/transport/requests/{id}/cancel` | Only while **`open`** / **`negotiating`** |
| **Buyer** | Update request | `PUT /api/transport/requests/{id}` | Partial fields; same status gate as cancel |
| **Buyer** | Re-notify transporters | `POST /api/transport/requests/{id}/notify` | May return **`notifyHint`** when count is 0 |
| **Transporter** | Submit a quote (respond to job) | `POST /api/transport/offers` | `transporterId` = **`TransportProviderId`** (preferred) or legacy **`UserId`** |
| **Transporter** | Decline a request without quoting | — | **Not implemented** — needs new API if required |

**Request statuses:** `open`, `negotiating`, `assigned`, `completed`, `cancelled`.  
**Offer statuses:** `pending`, `accepted`, `rejected`.

**Lists (mobile app mapping):**

| App screen | Role | API |
|------------|------|-----|
| Tab **طلبات النقل** → **وارد (عروض)** | Transporter | `GET /api/transport/me/notified-requests` |
| Tab **طلبات النقل** → **معيّن لي** | Transporter | `GET /api/transport/me/requests` |
| Same tab (non-transporter) / account link | Buyer | `GET /api/transport/me/buyer-requests` |
| Request detail | Buyer | `GET .../offers` + accept/reject |
| Request detail | Transporter | `POST /api/transport/offers`; tracking when assigned |

**Detail access gap:** `GET /api/transport/requests/{id}` may return **403** for a transporter who only appears in **`notified-requests`** and has not submitted an offer yet. The mobile app passes list row JSON as `data` and shows a banner until the first offer unlocks full detail.

**Push checklist:** خط سعر **نشط** على المسار (مع **`includeReverseRoute`**)، مدن صحيحة على الطلب، اقرأ **`notifyHint`** عند العدد 0، تسجيل FCM على **`/api/notifications`**. **`isAvailable`** للعرض في الكتالوج فقط — **لا يمنع الإشعار** بعد التعديل الأخير في الباكند.

#### 6.6.2 النقل في SouqAlHal — شرح كامل بكل الحالات

مرجع مبني على الكود الحالي (`TransportController`, `TransportNegotiationService`, `TransportProviderPriceLineService`, `TransportTrackingService`, الشات). JSON بصيغة **camelCase** ما لم يُذكر خلاف ذلك.

##### 1) من يشارك وماذا يخزّن النظام

| الجهة | الدور |
|--------|--------|
| **الحكومة** | سقف سعر لمسار محافظة → محافظة في `TransportPrices` (`pricingType = government`) |
| **الناقل (مزود نقل)** | `TransportProvider` + مركبات + خطوط سعر مدينة–مدينة (`TransportProviderPriceLines`) |
| **المشتري** | بعد صفقة (مزاد / مناقصة / بيع مباشر) يبحث أو يفتح طلب نقل أو تعيين مباشر |
| **البائع** | يظهر في محادثات التسليم من المزرعة (`transport_pickup`) |
| **الإدارة** | تحقق الناقل، قائمة كل الطلبات |

**جداول أساسية:** `TransportPrices`, `TransportProviders`, `TransportProviderPriceLines`, `TransportRequests`, `TransportOffers`, `TransportTrackings`.

##### 2) المرحلة الأولى — قبل أي طلب نقل

**2.1 السعر الحكومي (سقف)** — يُخزَّن في `TransportPrices`: `FromRegion` / `ToRegion` = معرّف محافظة كنص، `TotalPrice` = السقف، `PricingType = government`. لا يوجد في الـ API CRUD واضح لإدارة هذه الأسعار (غالباً DB/seed). القراءة عبر:

- `POST /api/transport-prices/official`
- `POST /api/transport-prices/cheapest`
- `GET /api/transport-prices/regions` (قائمة نصية ثابتة في الكود)

**2.2 تسجيل مزود النقل**

| Endpoint | ماذا يفعل |
|----------|-----------|
| `POST /api/transport` | إنشاء `TransportProvider` (مرتبط بـ `UserId`) |
| `POST /api/transport/{id}/vehicles` | إضافة مركبة |
| `PUT` / `DELETE` …`/vehicle/…` | تعديل/حذف مركبة |
| `PUT /api/transport/{id}/availability` | `isAvailable` true/false (**للعرض فقط، لا يحدد من يُشعَر**) |
| `PUT /api/transport/{id}/verify` | admin فقط — توثيق الناقل |

**2.3 خط سعر الناقل** — `POST /api/transport/price-lines`

المدخلات: `transportProviderId`, `fromCityId`, `toCityId`, `price` (مدن من `GET /api/cities`).

التحقق:

- المدينتان موجودتان.
- إن وُجد سقف حكومي لمحافظتي المدينتين → `price` يجب ≤ السقف.
- **لا يُشترط** وجود سجل حكومي: بدون سقف يُنشأ الخط بأي سعر.
- **لا يُشترط** اختيار الناقل من «قائمة خطوط حكومية» — أي زوج مدن صالح مسموح.
- يُحفظ `governmentMaxPrice` على الخط عند وجود سقف.

إدارة الخط: `GET`/`PUT`/`DELETE /api/transport/price-lines/{id}`, `GET …/{providerId}/price-lines`.

##### 3) البحث عن ناقل (قبل الطلب أو التعيين)

**3.1 `GET /api/transport/matches` (مفضّل للمشتري)**

- يتطلب JWT (`GetUserId() != 0`).
- الأفضل: `fromCityId` + `toCityId`.
- بديل: `fromRegion` + `toRegion` كمعرّف محافظة رقمي كنص.
- `includeReverseRoute` افتراضي **true** → خط حلب→دمشق يطابق طلب دمشق→حلب.
- يُرجع فقط خطوط `IsActive` مع: `transportProviderId`, `priceLineId`, `price`, `governmentMaxPrice`, `isAvailable`, أسماء المدن.
- `weightKg` و `productType` **لا يُستخدمان** في الفلترة حالياً.

**3.2 `GET /api/transport`** — قائمة كل المزودين مع خطوطهم النشطة فقط (`isAvailable` حقيقي من DB).

**3.3 `GET /api/transport/area/{area}`** — نفس القائمة مفلترة بـ `coveredAreas` يحتوي النص.

##### 4) مساران للمشتري بعد الصفقة

كلاهما مربوط بسياق الصفقة: `contextType` / `contextId` = `auction` | `tender` | `direct` (+ أسماء بديلة `orderType` / `orderId`).

**من يحق له فتح النقل؟**

| السياق | المشتري المسموح |
|--------|------------------|
| `auction` | الفائز (`WinnerUserId`) |
| `tender` | منشئ المناقصة (`CreatedByUserId`) |
| `direct` | مشتري له `Order` على `ListingId` |

**4أ) المسار أ — مناقصة نقل (طلب → عروض → قبول)**

```
POST transport/requests → open → إشعار push لكل ناقل بخط نشط على المسار
→ POST transport/offers من كل ناقل
→ POST offers/{id}/accept → assigned + شات + handoff
```

**`POST /api/transport/requests`**

- JWT؛ `buyerUserId` = المستخدم الحالي.
- `fromCityId` / `toCityId` > 0 وموجودان في `Cities`.
- صلاحية المشتري على الصفقة (جدول أعلاه).
- `conversationId` اختياري؛ إن وُجد يجب أن يطابق `contextType`/`contextId`.
- يُستنتج `productType` من المنتج إن لم يُرسل.
- يُربط الطلب بالمحصول/المزرعة (تلميحات لاحقاً) — **لا يُملأ** تلقائياً `fromCityId` من المزرعة؛ المشتري يرسل المدن.
- الحالة: **`open`** (لا يتحول تلقائياً إلى `negotiating` عند أول عرض).

**الإشعار التلقائي:**

- كل ناقل لديه `TransportProviderPriceLine` **نشط** يطابق المدينتين (مع العكس).
- **لا يُستخدم** `IsAvailable` في منطق الإشعار.
- الاستجابة: `requestId`, `notifiedTransporters`, `notifyHint` إن كان العدد 0.

**أسباب `notifyHint` عند 0:** مدن ناقصة؛ لا خط نشط على المسار؛ فشل إرسال الإشعارات (استثناء داخلي).

**`POST /api/transport/requests/{id}/notify`** — إعادة نفس منطق الإشعار؛ المشتري صاحب الطلب فقط.

**`POST /api/transport/offers` (الناقل)**

- JWT؛ `transporterId` = `TransportProviderId` أو (قديم) `UserId` للناقل نفسه.
- الطلب `open` (أو نظرياً `negotiating` — الكود لا يضبط `negotiating` تلقائياً).
- خط سعر نشط على مسار الطلب (مع العكس).
- `offeredPrice` ≤ السقف الحكومي إن وُجد.
- الطلب ليس `assigned` / `completed` / `cancelled`.
- **لا يُنشأ** عرض تلقائي من `price` على الخط — السعر في العرض **يدوي**.

**`GET /api/transport/requests/{id}/offers`** — المشتري، الناقل الذي قدّم عرضاً، أو admin.

**`POST /api/transport/offers/{id}/accept` (المشتري)**

- يرفض باقي العروض (`rejected`).
- الطلب → `assigned`، `agreedPrice` = سعر العرض، `assignedTransportProviderId`.
- إشعار للناقل؛ رسالة نظام في محادثة الصفقة؛ `SetTransportAssigned` على المحادثة الرئيسية.
- يفتح: `transport_offer` (مشتري ↔ ناقل)، `transport_pickup` (بائع ↔ ناقل)، `transport_delivery` (ناقل ↔ مشتري).

**`POST /api/transport/offers/{id}/reject`** — المشتري فقط؛ العرض يجب `pending`.

**`PUT /api/transport/requests/{id}` / `POST …/cancel`** — المشتري فقط؛ فقط `open` أو `negotiating`. الإلغاء يلغي العروض المعلقة.

**4ب) المسار ب — تعيين مباشر (من نتيجة البحث)**

**`POST /api/transport/assignments`**

Body: `conversationId`, `orderType`, `orderId`, `transportProviderId`, `priceLineId`, `agreedPrice?`.

- المشتري participant بدور buyer في المحادثة.
- `orderType`/`orderId` يطابقان `Conversation`.
- الخط نشط وينتمي للمزود.
- إن وُجد طلب `assigned` لنفس الصفقة بمزود/خط مختلف → خطأ.
- يُحدَّث طلب `open`/`negotiating` موجود أو يُنشأ طلب **`assigned`** مباشرة.
- المسار من الخط: `fromCityId`/`toCityId` على الطلب.
- `agreedPrice` = المرسل أو `line.Price`.
- **لا إشعار جماعي** لباقي الناقلين؛ إشعار للناقل المعيّن فقط.
- فتح محادثات handoff + `transportAssigned` على شات الصفقة.

**حالة خاصة** `orderType = tender_offer`: `orderId` = معرّف عرض المناقصة؛ التخزين الداخلي `contextType = tender` + `tenderId`.

##### 5) صناديق الوارد (Inbox)

| Endpoint | لمن | ماذا يعرض |
|----------|-----|-----------|
| `GET /api/transport/me/buyer-requests` | مشتري | طلباته |
| `GET /api/transport/me/notified-requests` | ناقل | طلبات `open`/`negotiating` تطابق خطوطه النشطة (مدن + عكس) |
| `GET /api/transport/me/notified-requests/count` | ناقل | العدد |
| `GET /api/transport/me/requests` | ناقل | طلبات `assigned` له |
| `GET /api/transport/requests/by-context?orderType&orderId` | مشتري صاحب الصفقة | أحدث طلب `open`/`negotiating` لهذا السياق |
| `GET /api/transport/requests/{id}` | مشتري / ناقل معيّن / ناقل قدّم عرضاً / admin | تفاصيل + عروض + `suggestedPickupCityId` إن وُجدت المزرعة |
| `GET /api/transport/requests` | admin فقط | كل الطلبات |

**تطبيق Riziq:** تبويب **طلبات النقل** → **وارد (عروض)** = `notified-requests`؛ **معيّن لي** = `me/requests`؛ المشتري من الحساب = `buyer-requests`. عند **403** على التفاصيل قبل أول عرض: معاينة من صف القائمة (انظر §6.6.1).

##### 6) التتبع GPS

| Endpoint | من |
|----------|-----|
| `POST /api/transport/requests/{id}/tracking` | الناقل المعيّن فقط؛ `transportProviderId` أو `transporterId` = المزود المعيّن |
| `GET …/tracking` | مشتري، ناقل معيّن، ناقل قدّم عرضاً، أو admin |

لا تتبع على طلب `cancelled` / `completed`.

##### 7) الشات والتسليم (بعد التعيين)

| نوع المحادثة | `contextType` | التسلسل |
|--------------|---------------|---------|
| تفاوض مع الناقل | `transport_offer` | بعد قبول العرض |
| استلام من المزرعة | `transport_pickup` | بائع **deliver** → ناقل **receive** |
| تسليم للمشتري | `transport_delivery` | ناقل **deliver** → مشتري **receive** |

Endpoints (`/api/Chat`):

- `POST …/transport-deliver`
- `POST …/transport-received`

**مهم:** إن كان `transportAssigned` على محادثة الصفقة، `mark-delivered` / `mark-received` العامة **ترفض** — يجب مسارات النقل أعلاه.

**تلميحات الموقع:** `farmCityId`, `farmGovernorateId`, `suggestedPickupCityId` (مزاد/مباشر من مزرعة؛ مناقصة: تلميح ضعيف من مشتري).

##### 8) آلة حالات طلب النقل

| الحالة | المعنى | انتقالات شائعة |
|--------|--------|----------------|
| `open` | طلب جديد / بانتظار عروض | → `assigned` (قبول/تعيين مباشر)، → `cancelled` |
| `negotiating` | مذكور في الفلاتر | **لا يُضبط تلقائياً** في الكود حالياً |
| `assigned` | ناقل محدد | تتبع، handoff |
| `cancelled` | ملغى من المشتري | — |
| `completed` | مذكور في التتبع | (إكمال يدوي/مستقبلي إن وُجد) |

**عروض النقل:** `pending` → `accepted` / `rejected`.

##### 9) مصفوفة صلاحيات مختصرة

| العملية | مشتري | ناقل (خط مطابق) | ناقل معيّن | admin |
|---------|-------|-----------------|------------|-------|
| إنشاء طلب | ✓ | — | — | — |
| تقديم عرض | — | ✓ (بشرط خط نشط) | — | — |
| قبول عرض | ✓ | — | — | — |
| تعيين مباشر | ✓ | — | — | — |
| إلغاء/تعديل طلب | ✓ | — | — | — |
| POST tracking | — | — | ✓ | — |
| GET tracking | ✓ | إن قدّم عرضاً أو معيّناً | ✓ | ✓ |

##### 10) كل حالات notifyHint / الإشعار

| الحالة | ماذا يحدث |
|--------|-----------|
| خط نشط + ناقلون | `notifiedTransporters` = عدد مستخدمي الناقلين |
| لا خط على المدينتين | 0 + تلميح عربي |
| مدن ناقصة على الطلب | 0 + تلميح |
| فشل Firebase/إشعار | 0 + تلميح فشل إرسال |
| `IsAvailable = false` | **يُشعَر مع ذلك** (لا يُستبعد من الإشعار) |

##### 11) سيناريوهات حسب نوع الصفقة

**مزاد (`auction`):** فوز المشتري → شات مزاد → مدن الاستلام/التسليم → إما `matches` → `assignments`، أو `requests` → عروض → `accept` → handoff: بائع المزاد = البائع في pickup.

**مناقصة (`tender`):** المشتري = منشئ المناقصة بعد المنح؛ الشات قد يكون `tender_offer`؛ التعيين/الطلب يحوّل داخلياً إلى `tender` + `tenderId`.

**بيع مباشر (`direct`):** المشتري = من له `Order` على `ListingId`؛ البائع = seller في pickup.

##### 12) ما لا يفعله النظام (لتجنب الالتباس)

| توقع شائع | الواقع في الكود |
|-----------|-----------------|
| الناقل يختار فقط من خطوط فرضتها الحكومة | لا — أي مدينتين؛ السقف اختياري |
| الإشعار فقط للمتاحين `IsAvailable` | لا — كل من له خط نشط |
| عرض تلقائي بسعر الخط عند الطلب | لا — عرض يدوي |
| `negotiating` عند أول عرض | لا — يبقى `open` |
| إنشاء طلب بدون JWT على كل endpoints | الافتراضي: JWT مطلوب إلا `AllowAnonymous` |
| `matches` بدون تسجيل دخول | **401** |

##### 13) مرجع سريع — أهم الـ endpoints

**أسعار وخطوط:** `POST`/`PUT`/`DELETE /api/transport/price-lines`, `GET /api/transport/matches`, `GET /api/transport`

**طلبات وعروض:** `POST /api/transport/requests`, `POST …/notify`, `POST /api/transport/offers`, `POST …/accept|reject`, `PUT|POST cancel /api/transport/requests/{id}`

**تعيين:** `POST /api/transport/assignments`

**تتبع:** `GET|POST /api/transport/requests/{id}/tracking`

**أسعار مرجعية:** `/api/transport-prices/official|cheapest|negotiation`

**شات:** `/api/Chat/.../transport-deliver|transport-received`

##### 14) تسلسل زمني موحّد (مناقصة نقل كاملة)

1. حكومة → `TransportPrices` (سقف محافظات).
2. ناقل → `POST price-lines` (مدن + سعر ≤ سقف إن وُجد).
3. مشتري → `GET matches` (اختياري).
4. مشتري → `POST requests` → إشعارات.
5. كل ناقل مطابق → `POST offers`.
6. مشتري → `accept` → `assigned` + 3 محادثات handoff.
7. pickup: بائع deliver → ناقل receive.
8. delivery: ناقل deliver → مشتري receive.
9. ناقل → `POST tracking` أثناء الطريق.

**بديل الخطوات 4–6:** `POST assignments` من نتيجة `matches` (تخطي العروض).

**خرائط Google (التطبيق، ليس SouqAlHal API):** مفتاح **Maps SDK** في بناء التطبيق الأصلي (`AndroidManifest` / Expo `android.config.googleMaps.apiKey`). خريطة فارغة = مفتاح ناقص أو مقيّد — ليس عيباً في API النقل.

### 6.7 Ads (marketing)

1. **Consumer:** **`GET /api/advertisement/mobile/header`**, **`/web/{position}`**, **`/app`**, **`/app/bottom`** for active creatives.
2. **Telemetry:** **`POST /api/advertisement/click`**, **`POST /api/advertisement/{id}/view`**. Optional header **`X-Platform`** (e.g. **`mobile`**, **`web`**) is documented in Swagger for attribution; mobile clients should send it consistently.
3. **Admin:** **`/api/admin/advertisements`** — requires authentication and the **`admin`** role (**`AdminOnly`** policy). CRUD and analytics counters appear on list responses when authorized.

### 6.8 Government / ministry reporting

1. **`/api/gov/dashboard`**, **`/api/gov/reports`**, **`/api/gov/alerts`**, **`/api/gov/market`** — authenticated gov roles.
2. **`/api/reports/**`** and **`/api/MarketAnalysis/**`** — statistical and analytical exports (see Swagger for parameters).

### 6.9 Support and feedback

1. **`/api/ticketing`** — tickets and messages.
2. **`/api/feedback`** — product feedback.
3. **`/api/reporting`** — structured incident reporting where configured.

### 6.10 Payments (external PSP)

1. **`/api/fatora`** — Fatora / e‑payment callbacks and initiation as deployed.

### 6.11 Mobile app housekeeping

1. **`/api/app-version`** — force upgrade / compatibility checks.
2. **`/api/notifications`** — push registration tokens and preferences (Firebase-oriented deployment).

---

## 7. Endpoint index by base path

Use Swagger for exhaustive verbs and parameters. This table maps **areas** to URLs clients typically integrate:

| Base path | Area |
|-----------|------|
| `/api/auth` | Register (simple), login, session helpers |
| `/api/auth/google` | Google OAuth redirect flow |
| `/api/registration` | Full multi-step onboarding, documents, payout |
| `/api/password-reset` | Phone OTP password reset |
| `/api/users` | Legacy/simple user registration & profile peek |
| `/api/profile` | Authenticated profile |
| `/api/marketplace` | Browse marketplace |
| `/api/direct` | Direct sales listings & flows |
| `/api/auctions` | Auctions & related payments routes |
| `/api/tenders` | Tenders |
| `/api/offers` | Tender offers |
| `/api/orders` | Orders |
| `/api/Chat` | Chat REST (see §6.5); hubs under `/hubs/*` |
| `/api/favorites` | Favorites |
| `/api/advertisement` | Public ads & tracking |
| `/api/admin/advertisements` | Admin ads (**`AdminOnly`**) |
| `/api/transport` | Transport jobs |
| `/api/transport-prices` | Transport pricing |
| `/api/inventory` | Inventory |
| `/api/farms` | Farms |
| `/api/crops` | Crops |
| `/api/images` | Image utilities |
| `/api/governorates`, `/api/cities`, `/api/areas` | Location hierarchy |
| `/api/form-fields` | Dynamic forms |
| `/api/notifications` | Push / notification APIs |
| `/api/analytics` | Client analytics ingest |
| `/api/app-version` | App version checks |
| `/api/fatora` | Payment gateway |
| `/api/feedback` | Feedback |
| `/api/ticketing` | Support tickets |
| `/api/reporting` | Reporting |
| `/api/reports`, `/api/reports/statistics`, `/api/reports/ministry` | Report bundles |
| `/api/MarketAnalysis` | Market analysis |
| `/api/gov/dashboard`, `/api/gov/reports`, `/api/gov/alerts`, `/api/gov/market` | Government |
| `/api/admin/*` | Admin (users, categories, farms, push, app versions, etc.) |

SignalR hubs (real-time): **`/hubs/auctions`**, **`/hubs/tenders`**, **`/hubs/direct`**, **`/hubs/chat`** — WebSockets; authentication per deployment.

---

## 8. Operational notes

- **Rate limits / abuse:** Depend on hosting; align OTP and login retries with product policy.
- **File uploads:** Use multipart endpoints as documented; respect server size limits (registration documents allow large payloads).
- **Trace id:** Send **`traceId`** back to support when reporting failures.
- **Swagger vs production:** Disabled or restricted in hardened environments; do not rely on Swagger availability alone for integration tests.

---

## 9. Quick registration checklist (client-side)

| # | Action | Endpoint |
|---|--------|----------|
| 1 | Create session | `POST /api/registration/start` |
| 2 | Account + OTP | `POST /api/registration/step/1` |
| 3 | Verify OTP | `POST /api/registration/verify-otp` |
| 4 | Choose role | `POST /api/registration/step/2` |
| 5 | Role profile | One of `step/3/farmer` … `step/3/agri` |
| 6 | Upload docs | `POST …/step/4/document` (multipart) |
| 7 | Complete docs | `POST …/step/4/complete` |
| 8 | Payout | `POST …/step/5/payout`, optional default PATCH |
| 9 | Complete payout | `POST …/step/5/complete` |
|10 | Submit | `POST /api/registration/submit` |
|11 | Login | `POST /api/auth/login` |

Poll **`GET /api/registration/{registrationId}`** anytime to restore wizard state.

---

*Document generated to consolidate onboarding and integration behavior. For parameter-level detail on large surfaces (reports, auctions filters), prefer the Swagger document served by your deployment.*
