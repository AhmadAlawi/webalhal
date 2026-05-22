import Link from "next/link";

const FOOTER_LINKS = [
  { href: "/auctions", label: "المزادات" },
  { href: "/tenders", label: "المناقصات" },
  { href: "/direct", label: "البيع المباشر" },
  { href: "/market-analysis", label: "تحليلات السوق" },
  { href: "/overview", label: "نظرة عامة" },
];

const ACCOUNT_LINKS = [
  { href: "/account", label: "حسابي" },
  { href: "/chat", label: "المحادثات" },
  { href: "/notifications", label: "الإشعارات" },
  { href: "/farms", label: "مزارعي" },
];

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-slate-800 bg-gradient-to-b from-slate-900 to-slate-950 text-slate-300">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
          <section className="lg:col-span-1">
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 text-lg font-bold text-white">
                رز
              </span>
              <div>
                <p className="text-xl font-bold text-white">رزق</p>
                <p className="text-xs text-emerald-400">سوق الحال الزراعي</p>
              </div>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-slate-400">
              منصة سوق زراعي سوري تربط المزارعين والتجار وناقلي المحاصيل عبر مزادات ومناقصات وبيع مباشر.
            </p>
          </section>
          <section>
            <p className="mb-4 font-semibold text-white">السوق</p>
            <ul className="space-y-2.5 text-sm">
              {FOOTER_LINKS.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="transition-colors hover:text-emerald-400">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
          <section>
            <p className="mb-4 font-semibold text-white">حسابك</p>
            <ul className="space-y-2.5 text-sm">
              {ACCOUNT_LINKS.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="transition-colors hover:text-emerald-400">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
          <section>
            <p className="mb-4 font-semibold text-white">الدعم</p>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/tickets" className="transition-colors hover:text-emerald-400">
                  الدعم الفني
                </Link>
              </li>
              <li>
                <Link href="/about" className="transition-colors hover:text-emerald-400">
                  عن المنصة
                </Link>
              </li>
              <li>
                <Link href="/transport/register" className="transition-colors hover:text-emerald-400">
                  التسجيل كناقل
                </Link>
              </li>
              <li>
                <Link href="/transport/prices" className="transition-colors hover:text-emerald-400">
                  حاسبة أسعار النقل
                </Link>
              </li>
            </ul>
          </section>
        </div>
        <p
          suppressHydrationWarning
          className="mt-12 border-t border-slate-800 pt-8 text-center text-xs text-slate-500"
        >
          © {new Date().getFullYear()} رزق — جميع الحقوق محفوظة
        </p>
      </div>
    </footer>
  );
}
