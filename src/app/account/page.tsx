"use client";

import Link from "next/link";
import {
  User,
  Gavel,
  FileText,
  ShoppingBag,
  Truck,
  Ticket,
  LogOut,
  Activity,
  Info,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { roleLabel } from "@/lib/permissions";
import { UserRole } from "@/types";
import { Button } from "@/components/ui/Button";
import { PageContainer } from "@/components/layout/PageContainer";

const MENU = [
  { href: "/account/profile", label: "الملف الشخصي", icon: User, desc: "تعديل بياناتك", auth: true },
  { href: "/account/activity", label: "نشاطاتي", icon: Activity, desc: "مزاداتي ومناقصاتي وعروضي", auth: true },
  { href: "/auctions/joined", label: "مزادات شاركت بها", icon: Gavel, desc: "مزاداتك النشطة", auth: true },
  { href: "/tenders/joined", label: "مناقصات شاركت بها", icon: FileText, desc: "عروضك على المناقصات", auth: true },
  { href: "/auctions", label: "المزادات", icon: Gavel, desc: "تصفح ومزايدة" },
  { href: "/tenders", label: "المناقصات", icon: FileText, desc: "عروض وتوريد" },
  { href: "/direct", label: "البيع المباشر", icon: ShoppingBag, desc: "شراء وبيع فوري" },
  { href: "/orders/direct", label: "طلباتي", icon: ShoppingBag, desc: "متابعة الطلبات", auth: true },
  { href: "/transport/requests", label: "طلبات النقل", icon: Truck, desc: "شحن المحاصيل", auth: true },
  { href: "/transport/prices", label: "حاسبة أسعار النقل", icon: Truck, desc: "تقدير تكلفة الشحن" },
  { href: "/transport/hub", label: "مركز النقل", icon: Truck, desc: "إدارة حساب الناقل", roles: [UserRole.Transport] },
  { href: "/transport/register", label: "تسجيل كناقل", icon: Truck, desc: "إنشاء حساب مزود نقل", roles: [UserRole.Transport] },
  { href: "/transport/inbox", label: "وارد النقل", icon: Truck, desc: "طلبات وعروض", roles: [UserRole.Transport] },
  { href: "/farms", label: "مزارعي", icon: User, desc: "إدارة المزارع", roles: [UserRole.Farmer] },
  { href: "/tickets", label: "الدعم", icon: Ticket, desc: "مساعدة فنية", auth: true },
  { href: "/about", label: "عن التطبيق", icon: Info, desc: "رزق — سوق الحال" },
];

export default function AccountPage() {
  const { user, isAuthenticated, logout, isLoading } = useAuth();

  if (isLoading) {
    return (
      <PageContainer className="py-16 text-center text-slate-500">جاري التحميل...</PageContainer>
    );
  }

  return (
    <div className="py-10 lg:py-14">
      <PageContainer>
        <div className="card overflow-hidden p-0">
          <div className="bg-gradient-to-l from-emerald-800 via-emerald-700 to-emerald-600 px-8 py-10 text-white lg:px-12">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
              <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-white/20 text-3xl font-bold">
                {user?.fullName?.[0] ?? "؟"}
              </span>
              <div>
                <h1 className="text-2xl font-bold lg:text-3xl">
                  {isAuthenticated ? user?.fullName || "حسابي" : "مرحباً بك"}
                </h1>
                <p className="mt-1 text-emerald-100">
                  {isAuthenticated ? roleLabel(user?.roleId) : "سجّل الدخول للوصول الكامل"}
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 lg:p-10">
            {!isAuthenticated ? (
              <div className="mx-auto max-w-md space-y-4 text-center">
                <p className="text-slate-600">
                  أنشئ حساباً أو سجّل الدخول للمشاركة في المزادات والمناقصات
                </p>
                <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
                  <Link href="/login">
                    <Button fullWidth className="sm:min-w-[140px]">
                      تسجيل الدخول
                    </Button>
                  </Link>
                  <Link href="/register">
                    <Button fullWidth variant="outline" className="sm:min-w-[140px]">
                      إنشاء حساب
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {MENU.filter(
                  (m) =>
                    (!m.auth || isAuthenticated) &&
                    (!m.roles || (user?.roleId && m.roles.includes(user.roleId))),
                ).map((m) => (
                  <Link
                    key={m.href}
                    href={m.href}
                    className="card card-hover flex items-start gap-4 p-5"
                  >
                    <m.icon className="mt-0.5 h-6 w-6 shrink-0 text-emerald-600" />
                    <span>
                      <span className="block font-semibold text-slate-900">{m.label}</span>
                      <span className="mt-0.5 block text-sm text-slate-500">{m.desc}</span>
                    </span>
                  </Link>
                ))}
                <button
                  type="button"
                  onClick={logout}
                  className="flex items-start gap-4 rounded-xl border border-red-100 bg-red-50/50 p-5 text-start transition-colors hover:bg-red-50 sm:col-span-2 lg:col-span-1"
                >
                  <LogOut className="mt-0.5 h-6 w-6 shrink-0 text-red-600" />
                  <span>
                    <span className="block font-semibold text-red-700">تسجيل الخروج</span>
                    <span className="mt-0.5 block text-sm text-red-500">إنهاء الجلسة</span>
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>
      </PageContainer>
    </div>
  );
}
