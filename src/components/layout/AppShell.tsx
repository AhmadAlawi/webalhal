"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SiteHeader } from "./SiteHeader";
import { SiteFooter } from "./SiteFooter";
import { RizqLogo } from "@/components/brand/RizqLogo";

const AUTH_LAYOUT = ["/login", "/register", "/forgot-password"];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = AUTH_LAYOUT.some((p) => pathname.startsWith(p));

  if (isAuthPage) {
    return (
      <div className="flex min-h-screen flex-col page-bg-auth">
        <header className="border-b border-white/60 bg-white/80 py-4 backdrop-blur-md">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
            <RizqLogo size="md" />
            <Link
              href="/"
              className="text-sm font-medium text-slate-600 hover:text-emerald-600"
            >
              الرئيسية
            </Link>
          </div>
        </header>
        <main className="flex flex-1 items-center justify-center px-4 py-10">{children}</main>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="page-bg flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}
