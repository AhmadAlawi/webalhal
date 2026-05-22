"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageContainer } from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/Button";
import {
  getMyTransportProvider,
  setProviderAvailability,
  type TransportProvider,
} from "@/services/transport";
import { useAuth } from "@/context/AuthContext";
import { UserRole } from "@/types";
import { Route, Truck, Car, Inbox } from "lucide-react";

export default function TransportHubPage() {
  const { user, requireAuth } = useAuth();
  const [provider, setProvider] = useState<TransportProvider | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!requireAuth() || !user?.userId) return;
    getMyTransportProvider(user.userId)
      .then(setProvider)
      .finally(() => setLoading(false));
  }, [requireAuth, user?.userId]);

  async function toggleAvailability() {
    if (!provider) return;
    const next = !provider.isAvailable;
    await setProviderAvailability(provider.transportProviderId, next);
    setProvider({ ...provider, isAvailable: next });
  }

  if (user?.roleId !== UserRole.Transport) {
    return (
      <PageContainer className="py-16 text-center text-red-600">للناقلين فقط</PageContainer>
    );
  }

  if (loading) {
    return (
      <>
        <PageHeader title="مركز النقل" backHref="/account" />
        <PageContainer className="py-16 text-center text-slate-500">جاري التحميل...</PageContainer>
      </>
    );
  }

  if (!provider) {
    return (
      <>
        <PageHeader title="مركز النقل" backHref="/account" />
        <PageContainer narrow className="py-8 text-center">
          <p className="mb-6 text-slate-600">لم تُسجَّل بعد كمزود نقل على المنصة</p>
          <Link href="/transport/register">
            <Button>تسجيل كناقل</Button>
          </Link>
        </PageContainer>
      </>
    );
  }

  const pid = provider.transportProviderId;

  return (
    <>
      <PageHeader title="مركز النقل" backHref="/account" />
      <PageContainer className="py-8">
        <article className="mb-8 rounded-2xl border border-emerald-100 bg-emerald-50/40 p-6">
          <h2 className="text-xl font-bold text-slate-900">
            {provider.companyName || provider.name || `مزود #${pid}`}
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            الحالة: {provider.isAvailable ? "متاح للطلبات" : "غير متاح"}
          </p>
          <Button type="button" variant="outline" className="mt-4" onClick={toggleAvailability}>
            {provider.isAvailable ? "إيقاف التوفر" : "تفعيل التوفر"}
          </Button>
        </article>

        <div className="grid gap-4 sm:grid-cols-2">
          <HubLink href="/transport/manage" icon={Route} title="خطوط الأسعار" desc="مسارات وأسعار النقل" />
          <HubLink href="/transport/vehicles" icon={Car} title="المركبات" desc="إدارة أسطولك" />
          <HubLink href="/transport/inbox" icon={Inbox} title="وارد الطلبات" desc="طلبات وعروض" />
          <HubLink href="/transport/requests" icon={Truck} title="طلباتي كمشتري" desc="شحن مشترياتك" />
        </div>
      </PageContainer>
    </>
  );
}

function HubLink({
  href,
  icon: Icon,
  title,
  desc,
}: {
  href: string;
  icon: typeof Route;
  title: string;
  desc: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-start gap-4 rounded-xl border border-gray-100 bg-white p-5 shadow-sm transition-colors hover:border-emerald-200"
    >
      <Icon className="h-6 w-6 shrink-0 text-emerald-600" />
      <span>
        <span className="block font-semibold text-slate-900">{title}</span>
        <span className="mt-0.5 block text-sm text-slate-500">{desc}</span>
      </span>
    </Link>
  );
}
