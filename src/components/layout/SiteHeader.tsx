"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { clsx } from "clsx";
import {
  Bell,
  ChevronDown,
  FileText,
  Gavel,
  Menu,
  MessageCircle,
  ShoppingBag,
  Truck,
  User,
  X,
} from "lucide-react";
import { RizqLogo } from "@/components/brand/RizqLogo";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/context/I18nContext";
import { useHeaderBadges } from "@/hooks/useHeaderBadges";
import { useUserPermissions } from "@/hooks/useUserPermissions";

const MAIN_LINKS = [
  { href: "/", labelKey: "navigation.home", match: (p: string) => p === "/" },
  { href: "/auctions", labelKey: "navigation.auctions", match: (p: string) => p.startsWith("/auctions") },
  { href: "/tenders", labelKey: "navigation.tenders", match: (p: string) => p.startsWith("/tenders") },
  { href: "/direct", labelKey: "navigation.direct", match: (p: string) => p.startsWith("/direct") },
  {
    href: "/market-analysis",
    labelKey: "navigation.marketAnalysis",
    match: (p: string) => p.startsWith("/market-analysis"),
  },
];

export function SiteHeader() {
  const pathname = usePathname();
  const { t } = useI18n();
  const { user, isAuthenticated, logout, requireAuth } = useAuth();
  const {
    roleId,
    canCreateAuction,
    canCreateTender,
    canCreateDirectListing,
    showFab: showCreateFab,
    showTransportTab: showTransportNav,
  } = useUserPermissions();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const { notifCount, chatCount, transportCount } = useHeaderBadges(
    isAuthenticated,
    roleId,
    user?.userId,
  );

  const createItems = [
    canCreateAuction && { href: "/auctions/create", labelKey: "actions.createAuction", icon: Gavel },
    canCreateTender && { href: "/tenders/create", labelKey: "actions.createTender", icon: FileText },
    canCreateDirectListing && { href: "/direct/new", labelKey: "actions.createDirect", icon: ShoppingBag },
  ].filter(Boolean) as { href: string; labelKey: string; icon: typeof Gavel }[];

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/90 shadow-sm backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <RizqLogo size="md" className="hidden shrink-0 sm:flex" />
        <RizqLogo size="sm" showText={false} className="shrink-0 sm:hidden" />

        <nav className="hidden items-center gap-1 lg:flex">
          {MAIN_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={clsx(
                "rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                link.match(pathname)
                  ? "bg-emerald-50 text-emerald-700"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
              )}
            >
              {t(link.labelKey)}
            </Link>
          ))}
          {showTransportNav && (
            <Link
              href="/transport/inbox"
              className={clsx(
                "rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                pathname.startsWith("/transport")
                  ? "bg-emerald-50 text-emerald-700"
                  : "text-slate-600 hover:bg-slate-50",
              )}
            >
              {t("navigation.transportRequests")}
              {transportCount > 0 && (
                <span className="ms-1.5 rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] text-white">
                  {transportCount}
                </span>
              )}
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <ThemeToggle />
          <LanguageSwitcher className="hidden sm:inline-flex" />

          {showCreateFab && createItems.length > 0 && (
            <div className="relative hidden sm:block">
              <button
                type="button"
                onClick={() => setCreateOpen((o) => !o)}
                className="flex items-center gap-1.5 rounded-xl bg-gradient-to-l from-emerald-600 to-emerald-700 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:from-emerald-700 hover:to-emerald-800"
              >
                {t("actions.create")}
                <ChevronDown className={clsx("h-4 w-4 transition", createOpen && "rotate-180")} />
              </button>
              {createOpen && (
                <>
                  <button
                    type="button"
                    className="fixed inset-0 z-40"
                    onClick={() => setCreateOpen(false)}
                    aria-label={t("common.close")}
                  />
                  <div className="absolute start-0 top-full z-50 mt-2 min-w-[200px] rounded-xl border border-gray-100 bg-white py-2 shadow-xl">
                    {createItems.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={(e) => {
                          if (!isAuthenticated) {
                            e.preventDefault();
                            requireAuth();
                            return;
                          }
                          setCreateOpen(false);
                        }}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-emerald-50"
                      >
                        <item.icon className="h-4 w-4 text-emerald-600" />
                        {t(item.labelKey)}
                      </Link>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {isAuthenticated ? (
            <>
              <Link
                href="/chat"
                className="relative hidden rounded-lg p-2 text-slate-600 hover:bg-slate-100 sm:flex"
                title={t("navigation.chat")}
              >
                <MessageCircle className="h-5 w-5" />
                {chatCount > 0 && (
                  <span className="absolute start-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                    {chatCount > 99 ? "99+" : chatCount}
                  </span>
                )}
              </Link>
              <Link
                href="/notifications"
                className="relative rounded-lg p-2 text-slate-600 hover:bg-slate-100"
                title={t("navigation.notifications")}
              >
                <Bell className="h-5 w-5" />
                {notifCount > 0 && (
                  <span className="absolute start-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                    {notifCount > 99 ? "99+" : notifCount}
                  </span>
                )}
              </Link>
              <Link
                href="/account"
                className="hidden items-center gap-2 rounded-xl border border-gray-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:border-emerald-200 hover:bg-emerald-50 sm:flex"
              >
                <User className="h-4 w-4 text-emerald-600" />
                {user?.fullName?.split(" ")[0] || t("navigation.account")}
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="hidden rounded-xl px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 sm:block"
              >
                {t("actions.login")}
              </Link>
              <Link
                href="/register"
                className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
              >
                {t("actions.createAccount")}
              </Link>
            </>
          )}

          <button
            type="button"
            onClick={() => setMobileOpen((o) => !o)}
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
            aria-label={t("navigation.overview")}
          >
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <nav className="border-t border-gray-100 bg-white px-4 py-4 lg:hidden">
          <ul className="space-y-1">
            {MAIN_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={clsx(
                    "block rounded-lg px-4 py-3 text-sm font-medium",
                    link.match(pathname) ? "bg-emerald-50 text-emerald-700" : "text-slate-700",
                  )}
                >
                  {t(link.labelKey)}
                </Link>
              </li>
            ))}
            {showTransportNav && (
              <li>
                <Link
                  href="/transport/inbox"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium text-slate-700"
                >
                  <Truck className="h-4 w-4" />
                  {t("navigation.transportRequests")}
                </Link>
              </li>
            )}
            <li>
              <Link
                href="/chat"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium text-slate-700"
              >
                {t("navigation.chat")}
                {chatCount > 0 && (
                  <span className="rounded-full bg-red-500 px-2 py-0.5 text-[10px] text-white">
                    {chatCount > 99 ? "99+" : chatCount}
                  </span>
                )}
              </Link>
            </li>
            {isAuthenticated ? (
              <>
                <li>
                  <Link
                    href="/account"
                    onClick={() => setMobileOpen(false)}
                    className="block rounded-lg px-4 py-3 text-sm font-medium text-slate-700"
                  >
                    {t("navigation.account")}
                  </Link>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      setMobileOpen(false);
                      logout();
                    }}
                    className="w-full rounded-lg px-4 py-3 text-start text-sm font-medium text-red-600"
                  >
                    {t("actions.logout")}
                  </button>
                </li>
              </>
            ) : (
              <li>
                <Link
                  href="/login"
                  onClick={() => setMobileOpen(false)}
                  className="block rounded-lg px-4 py-3 text-sm font-medium text-emerald-600"
                >
                  {t("actions.loginFull")}
                </Link>
              </li>
            )}
            <li className="pt-2 sm:hidden">
              <LanguageSwitcher />
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}
