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
import { useI18n } from "@/context/I18nContext";
import { UserRole } from "@/types";
import { Route, Truck, Car, Inbox, Calculator } from "lucide-react";

export default function TransportHubPage() {
  const { t } = useI18n();
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
      <PageContainer className="py-16 text-center text-red-600">
        {t("transport.transportersOnly")}
      </PageContainer>
    );
  }

  if (loading) {
    return (
      <>
        <PageHeader title={t("transport.hub.title")} backHref="/account" />
        <PageContainer className="py-16 text-center text-slate-500">
          {t("common.loadingEllipsis")}
        </PageContainer>
      </>
    );
  }

  if (!provider) {
    return (
      <>
        <PageHeader title={t("transport.hub.title")} backHref="/account" />
        <PageContainer narrow className="py-8 text-center">
          <p className="mb-6 text-slate-600">{t("transport.hub.notRegistered")}</p>
          <Link href="/transport/register">
            <Button>{t("transport.hub.register")}</Button>
          </Link>
        </PageContainer>
      </>
    );
  }

  const pid = provider.transportProviderId;

  return (
    <>
      <PageHeader title={t("transport.hub.title")} backHref="/account" />
      <PageContainer className="py-8">
        <article className="mb-8 rounded-2xl border border-emerald-100 bg-emerald-50/40 p-6">
          <h2 className="text-xl font-bold text-slate-900">
            {provider.companyName ||
              provider.name ||
              t("transport.hub.providerFallback", undefined, { id: pid })}
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            {t("transport.hub.status")}:{" "}
            {provider.isAvailable
              ? t("transport.hub.available")
              : t("transport.hub.unavailable")}
          </p>
          <Button type="button" variant="outline" className="mt-4" onClick={toggleAvailability}>
            {provider.isAvailable
              ? t("transport.hub.stopAvailability")
              : t("transport.hub.enableAvailability")}
          </Button>
        </article>

        <div className="grid gap-4 sm:grid-cols-2">
          <HubLink
            href="/transport/manage"
            icon={Route}
            title={t("transport.hub.priceLines")}
            desc={t("transport.hub.priceLinesDesc")}
          />
          <HubLink
            href="/transport/vehicles"
            icon={Car}
            title={t("transport.hub.vehicles")}
            desc={t("transport.hub.vehiclesDesc")}
          />
          <HubLink
            href="/transport/inbox"
            icon={Inbox}
            title={t("transport.hub.inbox")}
            desc={t("transport.hub.inboxDesc")}
          />
          <HubLink
            href="/account/transport-requests"
            icon={Truck}
            title={t("transport.hub.buyerRequests")}
            desc={t("transport.hub.buyerRequestsDesc")}
          />
          <HubLink
            href="/transport/prices"
            icon={Calculator}
            title={t("transport.hub.calculator")}
            desc={t("transport.hub.calculatorDesc")}
          />
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
