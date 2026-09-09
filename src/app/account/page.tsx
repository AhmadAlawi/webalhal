"use client";

import Link from "next/link";
import {
  Activity,
  FileText,
  Gavel,
  Info,
  LogOut,
  ShoppingBag,
  Ticket,
  Truck,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { PageContainer } from "@/components/layout/PageContainer";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/context/I18nContext";
import { useUserPermissions } from "@/hooks/useUserPermissions";
import { UserRole } from "@/types";

function roleLabelKey(roleId?: UserRole): string {
  switch (roleId) {
    case UserRole.Farmer:
      return "account.roles.farmer";
    case UserRole.Trader:
      return "account.roles.trader";
    case UserRole.Transport:
      return "account.roles.transporter";
    case UserRole.Government:
      return "account.roles.government";
    default:
      return "account.roles.guest";
  }
}

const MENU = [
  { href: "/account/profile", labelKey: "account.profile", icon: User, descKey: "account.profileDesc", auth: true },
  { href: "/account/activity", labelKey: "account.activity", icon: Activity, descKey: "account.activityDesc", auth: true },
  { href: "/auctions/joined", labelKey: "account.joinedAuctions", icon: Gavel, descKey: "account.joinedAuctionsDesc", auth: true },
  { href: "/tenders/joined", labelKey: "account.joinedTenders", icon: FileText, descKey: "account.joinedTendersDesc", auth: true },
  { href: "/auctions", labelKey: "navigation.auctions", icon: Gavel, descKey: "account.auctionsDesc" },
  { href: "/tenders", labelKey: "navigation.tenders", icon: FileText, descKey: "account.tendersDesc" },
  { href: "/direct", labelKey: "navigation.direct", icon: ShoppingBag, descKey: "account.directDesc" },
  { href: "/orders/direct", labelKey: "account.orders", icon: ShoppingBag, descKey: "account.ordersDesc", auth: true },
  {
    href: "/account/transport-requests",
    labelKey: "account.buyerTransportRequests",
    icon: Truck,
    descKey: "account.buyerTransportRequestsDesc",
    auth: true,
  },
  { href: "/transport/prices", labelKey: "account.transportCalculator", icon: Truck, descKey: "account.transportCalculatorDesc" },
  { href: "/transport/hub", labelKey: "account.transportHub", icon: Truck, descKey: "account.transportHubDesc", roles: [UserRole.Transport] },
  {
    href: "/transport/register",
    labelKey: "account.registerTransporter",
    icon: Truck,
    descKey: "account.registerTransporterDesc",
    roles: [UserRole.Transport],
  },
  { href: "/transport/inbox", labelKey: "account.transportInbox", icon: Truck, descKey: "account.transportInboxDesc", roles: [UserRole.Transport] },
  { href: "/farms", labelKey: "navigation.farms", icon: User, descKey: "account.myFarmsDesc", roles: [UserRole.Farmer] },
  { href: "/tickets", labelKey: "navigation.support", icon: Ticket, descKey: "account.supportDesc", auth: true },
  { href: "/about", labelKey: "account.about", icon: Info, descKey: "account.aboutDesc" },
];

export default function AccountPage() {
  const { user, isAuthenticated, logout, isLoading } = useAuth();
  const { t } = useI18n();
  const { roleName } = useUserPermissions();
  const roleLabel = t(roleLabelKey(user?.roleId));

  if (isLoading) {
    return (
      <PageContainer className="py-16 text-center text-slate-500">{t("common.loadingEllipsis")}</PageContainer>
    );
  }

  return (
    <div className="py-10 lg:py-14">
      <PageContainer>
        <div className="card overflow-hidden p-0">
          <div className="bg-gradient-to-l from-emerald-800 via-emerald-700 to-emerald-600 px-8 py-10 text-white lg:px-12">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
              <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-white/20 text-3xl font-bold">
                {user?.fullName?.[0] ?? t("account.avatarFallback")}
              </span>
              <div>
                <h1 className="text-2xl font-bold lg:text-3xl">
                  {isAuthenticated ? user?.fullName || t("account.myAccount") : t("account.welcome")}
                </h1>
                <p className="mt-1 text-emerald-100">
                  {isAuthenticated
                    ? roleName
                      ? t("account.roleWithName", "", { role: roleLabel, name: roleName })
                      : roleLabel
                    : t("account.loginForFullAccess")}
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 lg:p-10">
            {!isAuthenticated ? (
              <div className="mx-auto max-w-md space-y-4 text-center">
                <p className="text-slate-600">{t("account.guestPrompt")}</p>
                <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
                  <Link href="/login">
                    <Button fullWidth className="sm:min-w-[140px]">
                      {t("actions.loginFull")}
                    </Button>
                  </Link>
                  <Link href="/register">
                    <Button fullWidth variant="outline" className="sm:min-w-[140px]">
                      {t("actions.createAccount")}
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
                      <span className="block font-semibold text-slate-900">{t(m.labelKey)}</span>
                      <span className="mt-0.5 block text-sm text-slate-500">{t(m.descKey)}</span>
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
                    <span className="block font-semibold text-red-700">{t("actions.logout")}</span>
                    <span className="mt-0.5 block text-sm text-red-500">{t("account.endSession")}</span>
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
