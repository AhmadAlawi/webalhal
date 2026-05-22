"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageContainer } from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatCurrency } from "@/lib/format";
import {
  createPriceLine,
  getCities,
  getProviderPriceLines,
  getTransportProviders,
} from "@/services/transport";
import type { TransportPriceLine, TransportProvider } from "@/services/transport";
import type { City } from "@/types/transport";
import { useAuth } from "@/context/AuthContext";
import { UserRole } from "@/types";
import { Route, Plus } from "lucide-react";

export default function TransportManagePage() {
  const { user, requireAuth } = useAuth();
  const [provider, setProvider] = useState<TransportProvider | null>(null);
  const [lines, setLines] = useState<TransportPriceLine[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [fromCityId, setFromCityId] = useState<number | "">("");
  const [toCityId, setToCityId] = useState<number | "">("");
  const [price, setPrice] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    const providers = await getTransportProviders().catch(() => []);
    const mine =
      providers.find((p) => p.userId === user?.userId) ?? providers[0] ?? null;
    setProvider(mine);
    if (mine) {
      const pl = await getProviderPriceLines(mine.transportProviderId).catch(() => []);
      setLines(pl);
    }
  };

  useEffect(() => {
    if (!requireAuth()) return;
    if (user?.roleId !== UserRole.Transport) return;
    Promise.all([load(), getCities().then(setCities).catch(() => [])]).finally(() =>
      setLoading(false),
    );
  }, [requireAuth, user?.userId, user?.roleId]);

  async function addLine() {
    if (!provider || !fromCityId || !toCityId || !price) {
      setError("أكمل جميع الحقول");
      return;
    }
    setError("");
    try {
      await createPriceLine({
        transportProviderId: provider.transportProviderId,
        fromCityId: Number(fromCityId),
        toCityId: Number(toCityId),
        price: Number(price),
      });
      setFromCityId("");
      setToCityId("");
      setPrice("");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "فشل إضافة الخط");
    }
  }

  if (user?.roleId !== UserRole.Transport) {
    return (
      <>
        <PageHeader title="إدارة النقل" backHref="/account" />
        <PageContainer className="py-16 text-center text-red-600">
          هذه الصفحة للناقلين فقط
        </PageContainer>
      </>
    );
  }

  if (!loading && !provider) {
    return (
      <>
        <PageHeader title="خطوط الأسعار" backHref="/transport/hub" />
        <PageContainer className="py-8 text-center">
          <p className="mb-4 text-slate-600">لا يوجد حساب ناقل — سجّل أولاً</p>
          <Link href="/transport/register">
            <Button>تسجيل كناقل</Button>
          </Link>
        </PageContainer>
      </>
    );
  }

  return (
    <>
      <PageHeader title="خطوط الأسعار" backHref="/transport/inbox" />
      <PageContainer className="py-8">
        {loading ? (
          <p className="text-center text-slate-500">جاري التحميل...</p>
        ) : !provider ? (
          <EmptyState
            icon={Route}
            title="لم يُعثر على ملف ناقل"
            description="أكمل تسجيلك كمزود نقل عبر POST /api/transport"
          />
        ) : (
          <>
            <p className="mb-6 text-sm text-slate-600">
              المزود: {provider.companyName || provider.name || `#${provider.transportProviderId}`}
            </p>

            <section className="mb-8 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <h2 className="mb-4 flex items-center gap-2 font-semibold text-slate-900">
                <Plus className="h-4 w-4" />
                خط سعر جديد
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="text-sm">
                  <span className="font-medium text-slate-600">من</span>
                  <select
                    className="mt-1 w-full rounded-lg border px-3 py-2"
                    value={fromCityId}
                    onChange={(e) => setFromCityId(e.target.value ? Number(e.target.value) : "")}
                  >
                    <option value="">مدينة</option>
                    {cities.map((c) => (
                      <option key={c.cityId} value={c.cityId}>
                        {c.nameAr || c.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-sm">
                  <span className="font-medium text-slate-600">إلى</span>
                  <select
                    className="mt-1 w-full rounded-lg border px-3 py-2"
                    value={toCityId}
                    onChange={(e) => setToCityId(e.target.value ? Number(e.target.value) : "")}
                  >
                    <option value="">مدينة</option>
                    {cities.map((c) => (
                      <option key={c.cityId} value={c.cityId}>
                        {c.nameAr || c.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <Input
                className="mt-3"
                label="السعر (ل.س)"
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
              {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
              <Button className="mt-4" onClick={addLine}>
                إضافة الخط
              </Button>
            </section>

            <h2 className="mb-3 font-semibold text-slate-900">خطوطي النشطة</h2>
            {lines.length === 0 ? (
              <EmptyState icon={Route} title="لا خطوط أسعار" description="أضف خطاً ليظهر في البحث" />
            ) : (
              <ul className="space-y-2">
                {lines.map((l) => (
                  <li
                    key={l.priceLineId}
                    className="flex justify-between rounded-xl border border-gray-100 bg-white px-4 py-3"
                  >
                    <span className="text-sm text-slate-700">
                      {l.fromRegion || l.fromCityId} → {l.toRegion || l.toCityId}
                    </span>
                    <span className="font-bold text-emerald-600">{formatCurrency(l.price)}</span>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </PageContainer>
    </>
  );
}
