# رزق (Rizik) — Souq Al Hal Web

نسخة ويب RTL لمنصة السوق الزراعي السوري، متصلة بـ `https://alhal.awnak.net`.

## التشغيل

```bash
npm install
cp .env.example .env.local   # أو استخدم .env.local الموجود
npm run dev
```

افتح [http://localhost:3000](http://localhost:3000)

## المتغيرات

| المتغير | الوصف |
|---------|--------|
| `NEXT_PUBLIC_API_URL` | عنوان API (افتراضي: https://alhal.awnak.net) |

## المكدس

- Next.js App Router + TypeScript + Tailwind CSS v4
- خط Cairo (RTL)
- `@microsoft/signalr` للمزادات والشات
- JWT في `localStorage`

## المسارات الرئيسية

- `/` — الرئيسية (مزادات / مناقصات / بيع مباشر)
- `/login`, `/register` — المصادقة والتسجيل متعدد الخطوات
- `/auctions`, `/auctions/[id]/join` — المزادات والمزايدة الحية
- `/tenders`, `/direct` — المناقصات والبيع المباشر
- `/transport/inbox`, `/transport/requests` — النقل
- `/chat`, `/notifications`, `/account`

## المراجع

- `docs/WEB_APP_SPEC.md`
- `docs/SOUQ_ALHAL_API_COMPLETE_GUIDE.md`
