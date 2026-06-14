"use client";

import Link from "next/link";
import { RizqLogo } from "@/components/brand/RizqLogo";
import { useI18n } from "@/context/I18nContext";

const FOOTER_LINKS = [
  { href: "/auctions", labelKey: "navigation.auctions" },
  { href: "/tenders", labelKey: "navigation.tenders" },
  { href: "/direct", labelKey: "navigation.direct" },
  { href: "/market-analysis", labelKey: "navigation.marketAnalysis" },
  { href: "/overview", labelKey: "navigation.overview" },
];

const ACCOUNT_LINKS = [
  { href: "/account", labelKey: "navigation.account" },
  { href: "/chat", labelKey: "navigation.chat" },
  { href: "/notifications", labelKey: "navigation.notifications" },
  { href: "/farms", labelKey: "navigation.farms" },
];

export function SiteFooter() {
  const { t } = useI18n();

  return (
    <footer className="mt-auto border-t border-slate-800 bg-gradient-to-b from-slate-900 to-slate-950 text-slate-300">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
          <section className="lg:col-span-1">
            <RizqLogo size="md" variant="onDark" href={null} />
            <p className="mt-4 text-sm leading-relaxed text-slate-400">
              {t("footer.description")}
            </p>
          </section>
          <section>
            <p className="mb-4 font-semibold text-white">{t("footer.market")}</p>
            <ul className="space-y-2.5 text-sm">
              {FOOTER_LINKS.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="transition-colors hover:text-emerald-400">
                    {t(l.labelKey)}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
          <section>
            <p className="mb-4 font-semibold text-white">{t("footer.yourAccount")}</p>
            <ul className="space-y-2.5 text-sm">
              {ACCOUNT_LINKS.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="transition-colors hover:text-emerald-400">
                    {t(l.labelKey)}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
          <section>
            <p className="mb-4 font-semibold text-white">{t("footer.support")}</p>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/tickets" className="transition-colors hover:text-emerald-400">
                  {t("footer.technicalSupport")}
                </Link>
              </li>
              <li>
                <Link href="/about" className="transition-colors hover:text-emerald-400">
                  {t("footer.aboutPlatform")}
                </Link>
              </li>
              <li>
                <Link href="/transport/register" className="transition-colors hover:text-emerald-400">
                  {t("footer.transportRegister")}
                </Link>
              </li>
              <li>
                <Link href="/transport/prices" className="transition-colors hover:text-emerald-400">
                  {t("footer.transportCalculator")}
                </Link>
              </li>
            </ul>
          </section>
        </div>
        <p
          suppressHydrationWarning
          className="mt-12 border-t border-slate-800 pt-8 text-center text-xs text-slate-500"
        >
          © {new Date().getFullYear()} {t("brand.name")} - {t("footer.rights")}
        </p>
      </div>
    </footer>
  );
}
