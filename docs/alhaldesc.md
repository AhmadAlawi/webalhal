ملخص تطبيق Rizik — رزق (Souq Al Hal)
وثيقة جاهزة للنسخ إلى AI agent مع تصميمك (Figma/صور) لبناء نسخة Web. التطبيق الحالي: React Native + Expo يتصل بباكند Souq Al Hal.

1. ما هو التطبيق؟
رزق (Rizik) منصة سوق زراعي سوري (B2B/B2C) تربط:

الدور	بالعربي	الوظيفة الأساسية
Farmer (1)
مزارع
يبيع عبر مزادات وبيع مباشر، يشارك في مناقصات كمورّد
Trader (2)
تاجر
يزايد على مزادات، ينشئ مناقصات، يشتري بيع مباشر
Transport (3)
ناقل
يدير أسطوله وخطوط أسعاره، يستقبل طلبات نقل ويقدّم عروضاً
Government (4)
موظف حكومي
صلاحيات موسّعة (مزاد + مناقصة)
المنصة تغطي دورة: اكتشاف → تفاوض/مزايدة → طلب/طلبية → نقل → شات → إشعارات.

API Base URL (افتراضي): https://alhal.awnak.net
مرجع API كامل في المشروع: SOUQ_ALHAL_API_COMPLETE_GUIDE.md

2. البنية التقنية (Mobile — مرجع للـ Web)
الطبقة	التقنية
Framework
Expo ~54, React Native 0.81, expo-router (file-based routing)
Styling
NativeWind (Tailwind) + خط Cairo
Forms
react-hook-form + zod
i18n
i18next (عربي RTL أساساً)
Auth
JWT Authorization: Bearer <token> في AsyncStorage
Real-time
SignalR (@microsoft/signalr) — hubs للمزادات والشات
Maps
react-native-maps + Google Maps API key
Push
Firebase FCM + expo-notifications
State محلي
Context (مثل Favorites), hooks
للـ Web المطلوب: نفس الـ API، RTL عربي، ألوان العلامة الخضراء #059669 / emerald-600، خط Cairo أو بديل ويب عربي.

3. هيكل التنقل (شاشات رئيسية)
3.1 تدفق البداية
/ → فحص intro → /intro (أول مرة) أو /(tabs) (الرئيسية)
3.2 التبويبات السفلية (tabs)
التبويب	المسار	من يراه
الرئيسية
/(tabs)/index
الجميع
طلبات النقل
/(tabs)/transport-requests
الناقل فقط (roleId=3)
المحادثات
/(tabs)/messages
مسجّل
الإشعارات
/(tabs)/notifications
مسجّل
الحسابات
/(tabs)/account
الجميع (محتوى يختلف حسب الدخول)
3.3 شاشات خارج التبويبات (أهمها)
هوية: login, forgot-password, registration/* (خطوات متعددة + OTP + دور + مستندات + payout)

الرئيسية / السوق:

auctions/index, auctions/[id], auctions/create, auctions/join/[id], auctions/joined, auctions/edit/[id]
tenders/index, tenders/[id], tenders/create, tenders/joined
direct/index, direct/new, direct/buy, direct/orders, direct/orders/[id]
النقل:

transport/index, transport/create, transport/[id]/* (مركبات، خطوط أسعار)
new-transport-flow/*, transport-requests/[id], transport-buyer-request/[id]
transport-prices/* (رسمي، أرخص، تفاوض)
أخرى: chat/[conversationId], chat/details/[...], farms/*, crops/create, offers/*, tickets/*, wallet, edit-profile, my-activity, market-analysis, prices/regions, about-app

4. الشاشة الرئيسية — كيف تعمل
الصفحة /(tabs)/index هي مركز السوق:

┌─────────────────────────────────────┐
│  إعلانات علوية (Banner Carousel)     │  GET /api/advertisement/app
├─────────────────────────────────────┤
│  بحث + فلتر متقدم                    │
├─────────────────────────────────────┤
│  أقسام (Categories) + أصناف فرعية   │  GET /api/categories
├─────────────────────────────────────┤
│  بطاقات خدمات (توصيل، تخزين، …)     │  معلومات ثابتة/تسويقية
├─────────────────────────────────────┤
│  تبويبات: مزادات | مناقصات | بيع مباشر │
│    ├─ AuctionsTab                   │
│    ├─ TendersTab                    │
│    └─ LiveSellTab (marketplace)     │
├─────────────────────────────────────┤
│  مفضلات + تحليل سوق (widget)        │
├─────────────────────────────────────┤
│  إعلانات سفلية (BottomAdStrip)      │  GET /api/advertisement/app/bottom
└─────────────────────────────────────┘
         [FAB] إنشاء مناقصة/مزاد/بيع مباشر (حسب الدور)
الفلترة: حسب القسم، نص البحث، وفلاتر منفصلة لكل تبويب (سعر، محافظة، تاريخ، حالة…).

المفضلات: تخزين محلي حسب النوع (auction, tender, livesell).

5. الوحدات الأساسية (Business Modules)
5.1 المزادات (Auctions)
من ينشئ: مزارع (1) أو حكومي (4)
من يزايد: تاجر (2) أو حكومي (4)
قائمة: GET /api/auctions (مفتوحة، فلاتر، صور: productMainImage, images)
تفاصيل + مزايدة حية: SignalR hub /hubs/auctions
تسعير المزايدة: كائن pricing — إما إجمالي (total) أو لكل وحدة (perUnit) مع quantity, minIncrement, maxPrice — منطق موحّد في utils/auctionPricing.ts
انضمام للمزاد: صفحة auctions/join/[id] — قد يتطلب كود دعوة (inviteCode)
المزارع يراقب مزادَه بدون مزايدة (watch mode + polling احتياطي)
حالات نموذجية: open → active → closed / cancelled (راجع Swagger للتفاصيل الدقيقة).

5.2 المناقصات (Tenders)
من ينشئ: تاجر (2) أو حكومي (4)
من يشارك/يقدّم عرض: مزارع (1) أو حكومي (4)
API: /api/tenders, /api/offers
شاشات: قائمة، تفاصيل [id], إنشاء، مناقصات منضم إليها
5.3 البيع المباشر (Direct / Live Sell)
عرض في الرئيسية: تبويب "البيع المباشر" ← GET /api/marketplace (listings مباشرة)
قائمة كاملة: direct/index مع فلاتر (محافظة، مدينة، سعر، تاريخ، حالة active)
إنشاء عرض: direct/new — مخفي للتاجر (Trader لا ينشئ بيع مباشر)
شراء: direct/buy → طلب POST على /api/direct / orders
طلباتي: direct/orders
كيان Listing: listingId, sellerUserId, cropName, unitPrice, availableQty, minOrderQty, farmCity, images, status

5.4 النقل (Transport)
مسار معقّد — مرجع §6.6 في دليل API.

ملخص التدفق:

بعد صفقة (مزاد/مباشر/مناقصة) يُنشأ طلب نقل POST /api/transport/requests مع fromCityId / toCityId من GET /api/cities
النظام يُشعر الناقلين الذين لديهم خط سعر نشط على المسار
الناقل يقدّم عرض POST /api/transport/offers
المشتري يقبل/يرفض العرض
بعد التعيين: تتبع GET/POST .../tracking
شات النقل: contextType = transport_pickup / transport_delivery مع أزرار transport-deliver / transport-received
شاشات التطبيق:

المستخدم	الشاشة	API
ناقل
تبويب طلبات النقل → وارد / معيّن لي
me/notified-requests, me/requests
مشتري
طلباتي / تفاصيل طلب
me/buyer-requests
ناقل
إدارة المزود
transport/[id], مركبات، خطوط أسعار
الجميع
أسعار مرجعية
transport-prices/official, cheapest
حالات الطلب: open → negotiating → assigned → completed / cancelled

5.5 المحادثات (Chat)
REST: /api/Chat
Real-time: /hubs/chat
كل محادثة مربوطة بـ contextType + contextId:
auction, tender, direct, transport_pickup, transport_delivery
تفاصيل المحادثة: chat/details/[conversationId] — معلومات الصفقة، أزرار تسليم للنقل
قائمة المحادثات في تبويب المحادثات
5.6 الإشعارات
GET /api/notifications + عداد غير مقروء
FCM push مع clickAction يُحوَّل لمسار — أمثلة في services/notificationDeepLinks.ts:
/auctions/{id}, /tenders/{id}, /chat/{conversationId}, /transport-requests/{id}, /direct/orders, …
5.7 التسجيل متعدد الخطوات
start → step1 (حساب + OTP) → verify-otp → step2 (دور)
→ step3 (ملف حسب الدور) → step4 (مستندات multipart)
→ step5 (payout) → submit
أدوار التسجيل: farmer, trader, transporter, agri_service, gov_employee

تسجيل الدخول: POST /api/auth/login — قد يرجع 409 registration_incomplete مع registrationId لمتابعة التسجيل.

5.8 ميزات مساعدة
المزارع: مزارع farms/*, محاصيل crops/create
تذاكر دعم: tickets/*
محفظة: wallet
تحليل السوق: widget في الرئيسية + market-analysis
إعلانات: علوية وسفلية مع تتبع views/clicks
تقييمات، تقارير، إصدار التطبيق (فحص إجباري/اختياري عند الفتح)
6. قواعد الصلاحيات (مهمة للـ Web)
// من hooks/useUserPermissions.ts
canCreateAuction  → Farmer | Government
canJoinAuction    → Trader | Government  
canCreateTender   → Trader | Government
canJoinTender     → Farmer | Government
// بيع مباشر: إنشاء listing — ليس للتاجر
// FAB كامل: مخفي للناقل (Transport)
// تبويب طلبات النقل: للناقل فقط
بوابة المصادقة: useAuthGate — إجراءات حساسة تتطلب تسجيل دخول مع redirect لـ /login.

7. عقد API الموحّد
معظم الردود:

{
  "success": true,
  "data": { ... },
  "message": "...",
  "traceId": "...",
  "error": { "code", "title", "detail", "status", "errors" }
}
استثناء: POST /api/auth/login قد يعيد شكلاً مخصصاً (accessToken, refreshToken, userId).

Headers:

Authorization: Bearer ... للمسارات المحمية
إعلانات التطبيق: X-Platform (راجع الدليل)
CORS: مسموح لأصول ويب معتمدة؛ GET /api/advertisement/app له معاملة خاصة للمتصفح.

8. Real-time (يجب تكراره في Web)
Hub	الاستخدام
/hubs/auctions
مزايدة حية، PriceTick، BidPlaced
/hubs/chat
رسائل فورية
/hubs/tenders
(حسب الباكند)
/hubs/direct
(حسب الباكند)
المزادات تستخدم @microsoft/signalr مع JWT في الاتصال.

9. UI/UX — ما يجب أن يطابق التصميم
العنصر	القيمة
الاتجاه
RTL افتراضي
اللغة
عربي أولاً (i18n جاهز)
اللون الأساسي
#059669, #16a34a, #047857
الخط
Cairo (Bold, SemiBold, …)
التبويب السفلي
أيقونات + badges للإشعارات/الشات/طلبات النقل
البطاقات
زوايا دائرية كبيرة (rounded-2xl/3xl), ظل خفيف
الصور
productMainImage / resolveMediaUrl — URLs كاملة أو نسبية من الـ API
الخرائط
اختيار موقع → reverse geocode لمحافظة/مدينة (resolveGovernorateCityFromCoords)
10. خريطة مقترحة لنسخة Web (للـ Agent)
/                          → home (نفس tabs content بدون native tab bar)
/login, /register/*        → auth
/auctions, /auctions/:id   → list + detail + live bid UI
/auctions/:id/join         → join with code
/tenders, /tenders/:id
/direct, /direct/new, /direct/:id/buy
/orders/direct
/transport/requests        → buyer
/transport/inbox            → transporter (وارد + معيّن)
/transport/provider/:id     → إدارة الناقل
/chat, /chat/:conversationId
/notifications
/account, /profile/edit
/farms, /tickets, /wallet
Deep links: طبّق نفس أنماط notificationDeepLinks.ts.

11. ملفات مرجعية في المستودع (للـ Agent)
الموضوع	الملف
API كامل
SOUQ_ALHAL_API_COMPLETE_GUIDE.md
تسعير المزاد
utils/auctionPricing.ts
صلاحيات
hooks/useUserPermissions.ts
خدمات API
services/*.ts (auction, tender, direct, transport, chat, marketplace, auth)
الرئيسية
app/(tabs)/index.tsx, components/ui/home/*
تبويبات السوق
components/ui/home/HomeTabs.tsx, tabs/*
إعداد API
utils/config.ts
12. Prompt جاهز للصق (مع التصميم)
انسخ التالي وأرفق صور/رابط Figma:

TASK: Build a responsive RTL Arabic web app for Rizik (رزق) — Souq Al Hal, an agricultural marketplace in Syria. Match the attached UI design pixel-close where possible.

Stack suggestion: Next.js or React + TypeScript + Tailwind + Cairo font + SignalR client for auctions/chat.

Backend: REST API at https://alhal.awnak.net (or env NEXT_PUBLIC_API_URL). JWT in localStorage / httpOnly cookie. Standard envelope { success, data, message, error }. Full API spec: see attached SOUQ_ALHAL_API_COMPLETE_GUIDE.md.

User roles: Farmer(1), Trader(2), Transport(3), Government(4). Enforce permissions as in mobile useUserPermissions.

Core pages:

Home — top ads carousel, search, category filter, three tabs (Auctions / Tenders / Direct listings), bottom ads, market widget, favorites.
Auctions — list, detail, live bidding via SignalR /hubs/auctions, join with invite code for traders.
Tenders — list, detail, create (trader), join/offers (farmer).
Direct sales — marketplace listings, create listing (not trader), buy flow, orders list.
Transport — create request after deal, transporter inbox (notified + assigned), offer accept/reject, tracking, transport-specific chat handoff.
Chat — context-linked threads, real-time /hubs/chat.
Notifications — list + deep links.
Account — profile, my activity, farms (farmer), transport provider hub (transporter), tickets, logout.
Auth — multi-step registration + login + password reset.
UX: RTL, primary green #059669, rounded cards, Arabic copy from mobile screens.

Do NOT implement in v1 unless in design: native-only features (FCM, haptics, expo-location) — use browser geolocation/maps instead.

Reference implementation: Expo app rizaq-app (file routes under app/, services under services/).