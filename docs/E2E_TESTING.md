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

## ما يغطيه `scripts/e2e-workflows.mjs`

| المجال | نقاط API / DB |
|--------|----------------|
| عام | browse, auctions, tenders, direct listings, cities |
| مصادقة | login, profile, refresh token |
| تسجيل | start → (اختياري) full flow مع `E2E_OTP` |
| بيع مباشر | إنشاء طلب → تفاصيل → تحديث حالة حتى `completed` → فتح شات |
| نقل | مناطق + سعر رسمي (يتطلب token) |
| DB | اتصال **MySQL** (منفذ 3306) + عينة users/orders |

## مسار إغلاق الطلب (Direct)

حالات API: `open` → `negotiating` → `assigned` → `completed`

- **الويب:** `/orders/direct/[id]` — أزرار للبائع: تقدم الحالة + إلغاء + شات
- **API:** `POST /api/direct/orders/{id}/status` مع `{ orderId, newStatus }`

## قيود معروفة

1. **قاعدة البيانات (MySQL):** المنفذ `3306` قد يكون مغلقاً من خارج الشبكة — افتح firewall أو شغّل الاختبار من السيرفر.
2. **`/api/admin/categories?isActive=true`** و **`/api/transport-prices/regions`**: تتطلب JWT (401 بدون دخول) — التطبيق يتعامل معها بعد تسجيل الدخول.
3. **OTP التسجيل:** بدون `E2E_OTP` من SMS لا يكتمل اختبار التسجيل الكامل تلقائياً.
4. **تحديث حالة الطلب:** يجب تنفيذه بحساب **البائع** (`E2E_SELLER_*`).

## اختبار يدوي في المتصفح

```bash
npm run dev
```

ثم راجع: `/` → `/register` → `/login` → `/direct` → شراء → `/orders/direct` → إغلاق الطلب → `/chat`.
