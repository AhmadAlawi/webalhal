# E2E Testing — رزق Web

## تشغيل الاختبارات

```powershell
# من جذر المشروع — لا ترفع كلمات المرور إلى Git
$env:API_URL = "https://alhal.awnak.net"
$env:E2E_DB_HOST = "157.173.100.19"
$env:E2E_DB_PORT = "3306"
$env:E2E_DB_NAME = "SouqAlHal"
$env:E2E_DB_USER = "remoteuser"
$env:E2E_DB_PASSWORD = "<your-password>"

# مستخدم الاختبار الافتراضي (يُعاد دوره إلى 10 بعد التشغيل)
$env:E2E_USER_ID = "5"
$env:E2E_BUYER_EMAIL = "string@string.com"
$env:E2E_BUYER_PASSWORD = "string"
$env:E2E_ORIGINAL_ROLE = "10"
$env:E2E_TEST_ROLE = "2"

# OTP يُقرأ تلقائياً من جدول registrationsessions بعد step/1
# أو عيّنه يدوياً: $env:E2E_OTP = "123456"

npm run test:e2e
```

يقرأ السكربت تلقائياً `NEXT_PUBLIC_API_URL` من `.env.local` إن وُجد.  
بعد التشغيل يُكتَب ملخص في `scripts/e2e-results.json` (مُستبعد من Git).

## ما يغطيه `scripts/e2e-workflows.mjs`

| المجال | نقاط API / DB |
|--------|----------------|
| عام | browse, auctions, tenders, direct listings, cities |
| مصادقة | login, `/api/profile/me`, refresh, `/api/auth/me?token=` |
| كتالوج | `/api/admin/categories`, products, notifications unread |
| تسجيل كامل | start → step1 → OTP من DB → verify → step2/3 → مستند step4 → payout → submit → login |
| بيع مباشر | مزرعة + محصول جديد → listing → شراء **كامل الكمية** من بائع آخر → حالات → شات |
| نقل | مناطق + سعر رسمي (زوج دمشق→حلب أو fallback) |
| DB | اتصال **MySQL** (منفذ 3306) + عينة users/orders + تحقق صف الطلب |
| إضافي | marketplace، إعلانات (علوي/سفلي + تتبع مشاهدة)، شات، تذاكر، تحليل سوق، محاصيل، قوائم مفلترة، طلب استعادة كلمة المرور |

لتخطي التسجيل الكامل: `$env:E2E_RUN_REGISTRATION = "0"`

**Refresh token:** إن أعاد الخادم 401 يُسجَّل كـ skipped (قد يكون معطّلاً على السيرفر).

## مسار إغلاق الطلب (Direct)

حالات API: `open` → `negotiating` → `assigned` → `completed`

- **الويب:** `/orders/direct/[id]` — أزرار للبائع: تقدم الحالة + إلغاء + شات
- **API:** `POST /api/direct/orders/{id}/status` مع `{ orderId, newStatus }`

## قيود معروفة

1. **قاعدة البيانات (MySQL):** المنفذ `3306` قد يكون مغلقاً من خارج الشبكة — افتح firewall أو شغّل الاختبار من السيرفر.
2. **`/api/admin/categories?isActive=true`** و **`/api/transport-prices/regions`**: تتطلب JWT (401 بدون دخول) — التطبيق يتعامل معها بعد تسجيل الدخول.
3. **OTP التسجيل:** يُقرأ من `registrationsessions` بعد step/1 (أو `E2E_OTP` يدوياً).
4. **شراء مباشر:** يجب شراء **الكمية كاملة**؛ لا يمكن للمشتري شراء عرضه هو (نفس `userId`).
5. **سعر النقل الرسمي:** 404 مع «لا يوجد سعر» يعني لا صف في المصفوفة — الاختبار يجرّب عدة أزواج مناطق.

## اختبار يدوي في المتصفح

```bash
npm run dev
```

ثم راجع: `/` → `/register` → `/login` → `/direct` → شراء → `/orders/direct` → إغلاق الطلب → `/chat`.
