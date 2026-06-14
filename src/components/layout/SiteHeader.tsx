"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useHeaderBadges } from "@/hooks/useHeaderBadges";
import {
  Menu,
  X,
  Bell,
  MessageCircle,
  User,
  Truck,
  ChevronDown,
  Gavel,
  FileText,
  ShoppingBag,
  Search,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useUserPermissions } from "@/hooks/useUserPermissions";
import { clsx } from "clsx";
import { RizqLogo } from "@/components/brand/RizqLogo";

const MAIN_LINKS = [
  { href: "/", label: "الرئيسية", match: (p: string) => p === "/" },
  { href: "/auctions", label: "المزادات", match: (p: string) => p.startsWith("/auctions") },
  { href: "/tenders", label: "المناقصات", match: (p: string) => p.startsWith("/tenders") },
  { href: "/direct", label: "البيع المباشر", match: (p: string) => p.startsWith("/direct") },
  { href: "/market-analysis", label: "تحليلات السوق", match: (p: string) => p.startsWith("/market-analysis") },
];

export function SiteHeader() {
  const pathname = usePathname();
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
    canCreateAuction && { href: "/auctions/create", label: "إنشاء مزاد", icon: Gavel },
    canCreateTender && { href: "/tenders/create", label: "إنشاء مناقصة", icon: FileText },
    canCreateDirectListing && { href: "/direct/new", label: "بيع مباشر", icon: ShoppingBag },
  ].filter(Boolean) as { href: string; label: string; icon: typeof Gavel }[];

  if (pathname === "/") {
    const accountHref = isAuthenticated ? "/account" : "/login";
    const initial = user?.fullName?.trim()?.charAt(0) || "S";
    return (
      <header className="sticky top-0 z-50 border-b border-[#D7D9E2] bg-white/95 shadow-sm backdrop-blur-md">
        <div
          dir="ltr"
          className="mx-auto grid h-[74px] max-w-[680px] grid-cols-[56px_1fr_56px] items-center px-5 md:hidden"
        >
          <a
            href="#home-search"
            className="flex h-12 w-12 items-center justify-center rounded-full text-[#00066D] transition hover:bg-[#F4F5FF]"
            aria-label="البحث"
          >
            <Search className="h-8 w-8" strokeWidth={3} />
          </a>
          <RizqLogo
            size="md"
            showText={false}
            className="justify-self-center"
          />
          <Link
            href={accountHref}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-[#E7E4FF] text-lg font-extrabold text-[#00066D]"
            aria-label="الحساب"
          >
            {initial}
          </Link>
        </div>
        <div className="mx-auto hidden max-w-7xl items-center justify-between gap-5 px-6 py-3 lg:px-8 md:flex">
          <RizqLogo size="md" className="shrink-0" />
          <nav className="flex items-center gap-1">
            {MAIN_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={clsx(
                  "rounded-xl px-4 py-2 text-sm font-bold transition-colors",
                  link.match(pathname)
                    ? "bg-[#F4F5FF] text-[#00066D]"
                    : "text-[#777B8F] hover:bg-[#F7F8FB] hover:text-[#00066D]",
                )}
              >
                {link.label}
              </Link>
            ))}
            {showTransportNav && (
              <Link
                href="/transport/inbox"
                className="rounded-xl px-4 py-2 text-sm font-bold text-[#777B8F] hover:bg-[#F7F8FB] hover:text-[#00066D]"
              >
                طلبات النقل
                {transportCount > 0 && (
                  <span className="ms-1.5 rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] text-white">
                    {transportCount}
                  </span>
                )}
              </Link>
            )}
          </nav>
          <div className="flex items-center gap-2">
            <a
              href="#home-search"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#D7D9E2] text-[#00066D] hover:bg-[#F4F5FF]"
              aria-label="البحث"
            >
              <Search className="h-5 w-5" />
            </a>
            {showCreateFab && createItems.length > 0 && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setCreateOpen((o) => !o)}
                  className="flex items-center gap-1.5 rounded-xl bg-[#FF9900] px-4 py-2 text-sm font-bold text-[#00066D] shadow-[0_10px_22px_rgba(255,153,0,0.18)] hover:bg-[#D77E00] hover:text-white"
                >
                  إنشاء
                  <ChevronDown className={clsx("h-4 w-4 transition", createOpen && "rotate-180")} />
                </button>
                {createOpen && (
                  <>
                    <button
                      type="button"
                      className="fixed inset-0 z-40"
                      onClick={() => setCreateOpen(false)}
                      aria-label="إغلاق"
                    />
                    <div className="absolute start-0 top-full z-50 mt-2 min-w-[210px] rounded-2xl border border-[#D7D9E2] bg-white py-2 shadow-xl">
                      {createItems.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={(e) => {
                            if (!isAuthenticated) {
                              e.preventDefault();
                              requireAuth();
                            }
                          }}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-[#F4F5FF]"
                        >
                          <item.icon className="h-4 w-4 text-[#FF9900]" />
                          {item.label}
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
                  className="relative rounded-xl border border-[#D7D9E2] p-2 text-[#777B8F] hover:bg-[#F4F5FF] hover:text-[#00066D]"
                  title="المحادثات"
                >
                  <MessageCircle className="h-5 w-5" />
                  {chatCount > 0 && (
                    <span className="absolute -start-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                      {chatCount > 99 ? "99+" : chatCount}
                    </span>
                  )}
                </Link>
                <Link
                  href="/notifications"
                  className="relative rounded-xl border border-[#D7D9E2] p-2 text-[#777B8F] hover:bg-[#F4F5FF] hover:text-[#00066D]"
                  title="الإشعارات"
                >
                  <Bell className="h-5 w-5" />
                  {notifCount > 0 && (
                    <span className="absolute -start-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                      {notifCount > 99 ? "99+" : notifCount}
                    </span>
                  )}
                </Link>
                <Link
                  href="/account"
                  className="flex h-10 min-w-10 items-center justify-center rounded-full bg-[#E7E4FF] px-3 text-sm font-extrabold text-[#00066D]"
                >
                  {user?.fullName?.split(" ")[0] || "حسابي"}
                </Link>
              </>
            ) : (
              <>
                <Link href="/login" className="rounded-xl px-4 py-2 text-sm font-bold text-[#00066D] hover:bg-[#F4F5FF]">
                  دخول
                </Link>
                <Link href="/register" className="rounded-xl bg-[#00066D] px-4 py-2 text-sm font-bold text-white hover:bg-[#00044F]">
                  إنشاء حساب
                </Link>
              </>
            )}
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-50 border-b border-[#D7D9E2] bg-white/95 shadow-sm backdrop-blur-md">
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
                  ? "bg-[#F4F5FF] text-[#00066D]"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
              )}
            >
              {link.label}
            </Link>
          ))}
          {showTransportNav && (
            <Link
              href="/transport/inbox"
              className={clsx(
                "rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                pathname.startsWith("/transport")
                  ? "bg-[#F4F5FF] text-[#00066D]"
                  : "text-slate-600 hover:bg-slate-50",
              )}
            >
              طلبات النقل
              {transportCount > 0 && (
                <span className="ms-1.5 rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] text-white">
                  {transportCount}
                </span>
              )}
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          {showCreateFab && createItems.length > 0 && (
            <div className="relative hidden sm:block">
              <button
                type="button"
                onClick={() => setCreateOpen((o) => !o)}
                className="flex items-center gap-1.5 rounded-xl bg-[#FF9900] px-4 py-2 text-sm font-semibold text-[#00066D] shadow-sm hover:bg-[#D77E00] hover:text-white"
              >
                إنشاء
                <ChevronDown className={clsx("h-4 w-4 transition", createOpen && "rotate-180")} />
              </button>
              {createOpen && (
                <>
                  <button
                    type="button"
                    className="fixed inset-0 z-40"
                    onClick={() => setCreateOpen(false)}
                    aria-label="إغلاق"
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
                          }
                        }}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-[#F4F5FF]"
                      >
                        <item.icon className="h-4 w-4 text-[#FF9900]" />
                        {item.label}
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
                title="المحادثات"
              >
                <MessageCircle className="h-5 w-5" />
                {chatCount > 0 && (
                  <span className="absolute top-0.5 start-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                    {chatCount > 99 ? "99+" : chatCount}
                  </span>
                )}
              </Link>
              <Link
                href="/notifications"
                className="relative rounded-lg p-2 text-slate-600 hover:bg-slate-100"
                title="الإشعارات"
              >
                <Bell className="h-5 w-5" />
                {notifCount > 0 && (
                  <span className="absolute top-0.5 start-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                    {notifCount > 99 ? "99+" : notifCount}
                  </span>
                )}
              </Link>
              <Link
                href="/account"
                className="hidden items-center gap-2 rounded-xl border border-gray-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:border-[#D7D9E2] hover:bg-[#F4F5FF] sm:flex"
              >
                <User className="h-4 w-4 text-[#00066D]" />
                {user?.fullName?.split(" ")[0] || "حسابي"}
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="hidden rounded-xl px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 sm:block"
              >
                دخول
              </Link>
              <Link
                href="/register"
                className="rounded-xl bg-[#FF9900] px-4 py-2 text-sm font-semibold text-[#00066D] hover:bg-[#D77E00] hover:text-white"
              >
                إنشاء حساب
              </Link>
            </>
          )}

          <button
            type="button"
            onClick={() => setMobileOpen((o) => !o)}
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
            aria-label="القائمة"
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
                  className={clsx(
                    "block rounded-lg px-4 py-3 text-sm font-medium",
                    link.match(pathname) ? "bg-[#F4F5FF] text-[#00066D]" : "text-slate-700",
                  )}
                >
                  {link.label}
                </Link>
              </li>
            ))}
            {showTransportNav && (
              <li>
                <Link href="/transport/inbox" className="flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium text-slate-700">
                  <Truck className="h-4 w-4" />
                  طلبات النقل
                </Link>
              </li>
            )}
            <li>
              <Link href="/chat" className="flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium text-slate-700">
                المحادثات
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
                  <Link href="/account" className="block rounded-lg px-4 py-3 text-sm font-medium text-slate-700">
                    حسابي
                  </Link>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={logout}
                    className="w-full rounded-lg px-4 py-3 text-start text-sm font-medium text-red-600"
                  >
                    تسجيل الخروج
                  </button>
                </li>
              </>
            ) : (
              <li>
                <Link href="/login" className="block rounded-lg px-4 py-3 text-sm font-medium text-[#00066D]">
                  تسجيل الدخول
                </Link>
              </li>
            )}
          </ul>
        </nav>
      )}
    </header>
  );
}
