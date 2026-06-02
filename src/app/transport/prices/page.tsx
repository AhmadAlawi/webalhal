"use client";

import { useEffect, useMemo, useState } from "react";
import { Calculator, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageContainer } from "@/components/layout/PageContainer";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  getCheapestTransportPrice,
  getOfficialTransportPrice,
  type TransportPriceResult,
} from "@/services/transport-prices";
import { getGovernorates } from "@/services/locations";
import { useCities } from "@/hooks/useCities";
import { formatCurrency } from "@/lib/format";
import type { Governorate } from "@/types/location";

function PriceResultCard({
  title,
  result,
  loading,
}: {
  title: string;
  result: TransportPriceResult | null;
  loading: boolean;
}) {
  return (
    <Card padding="md" className="min-h-[120px]">
      <h3 className="font-semibold text-slate-800">{title}</h3>
      {loading ? (
        <div className="mt-4 flex items-center gap-2 text-slate-500">
          <Loader2 className="h-5 w-5 animate-spin" />
          جاري الحساب...
        </div>
      ) : result ? (
        <div className="mt-3">
          {result.price != null ? (
            <p className="text-2xl font-bold text-emerald-600">{formatCurrency(result.price)}</p>
          ) : (
            <p className="text-slate-600">{result.message || "لا يوجد سعر متاح"}</p>
          )}
          {(result.fromRegion || result.toRegion) && (
            <p className="mt-2 text-sm text-slate-500">
              {result.fromRegion} → {result.toRegion}
              {result.distanceKm != null && ` · ${result.distanceKm} كم`}
            </p>
          )}
        </div>
      ) : (
        <p className="mt-3 text-sm text-slate-400">اضغط «احسب» لعرض النتيجة</p>
      )}
    </Card>
  );
}

function governorateLabel(g: Governorate): string {
  return g.nameAr || g.name || `#${g.governorateId}`;
}

export default function TransportPricesPage() {
  const { data: cities = [] } = useCities();
  const [governorates, setGovernorates] = useState<Governorate[]>([]);
  const [fromGovernorateId, setFromGovernorateId] = useState<number | "">("");
  const [toGovernorateId, setToGovernorateId] = useState<number | "">("");
  const [fromCityId, setFromCityId] = useState<number | "">("");
  const [toCityId, setToCityId] = useState<number | "">("");
  const [distanceKm, setDistanceKm] = useState("");
  const [official, setOfficial] = useState<TransportPriceResult | null>(null);
  const [cheapest, setCheapest] = useState<TransportPriceResult | null>(null);
  const [loadingOfficial, setLoadingOfficial] = useState(false);
  const [loadingCheapest, setLoadingCheapest] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getGovernorates()
      .then(setGovernorates)
      .catch(() => setGovernorates([]));
  }, []);

  const fromCities = useMemo(
    () =>
      fromGovernorateId
        ? cities.filter((c) => c.governorateId === fromGovernorateId)
        : [],
    [cities, fromGovernorateId],
  );
  const toCities = useMemo(
    () =>
      toGovernorateId ? cities.filter((c) => c.governorateId === toGovernorateId) : [],
    [cities, toGovernorateId],
  );

  function regionName(govId: number | "", cityId: number | ""): string | undefined {
    if (cityId) {
      const city = cities.find((c) => c.cityId === cityId);
      if (city?.nameAr || city?.name) return city.nameAr || city.name;
    }
    if (govId) {
      const gov = governorates.find((g) => g.governorateId === govId);
      if (gov) return governorateLabel(gov);
    }
    return undefined;
  }

  function buildDto() {
    const km = distanceKm.trim() ? Number(distanceKm) : undefined;
    return {
      fromRegion: regionName(fromGovernorateId, fromCityId),
      toRegion: regionName(toGovernorateId, toCityId),
      distanceKm: km != null && !Number.isNaN(km) ? km : undefined,
    };
  }

  function validate(): boolean {
    if (!fromGovernorateId || !toGovernorateId) {
      setError("اختر محافظة الانطلاق والوصول");
      return false;
    }
    setError("");
    return true;
  }

  async function calcOfficial() {
    if (!validate()) return;
    setLoadingOfficial(true);
    setOfficial(null);
    try {
      setOfficial(await getOfficialTransportPrice(buildDto()));
    } catch (e) {
      setError(e instanceof Error ? e.message : "فشل حساب السعر الرسمي");
    } finally {
      setLoadingOfficial(false);
    }
  }

  async function calcCheapest() {
    if (!validate()) return;
    setLoadingCheapest(true);
    setCheapest(null);
    try {
      setCheapest(await getCheapestTransportPrice(buildDto()));
    } catch (e) {
      setError(e instanceof Error ? e.message : "فشل حساب أرخص سعر");
    } finally {
      setLoadingCheapest(false);
    }
  }

  return (
    <>
      <PageHeader
        title="حاسبة أسعار النقل"
        subtitle="تقدير السعر الرسمي وأرخص عرض بين المحافظات والمدن"
        backHref="/account"
      />
      <PageContainer className="py-8">
        <Card padding="lg" className="mb-8">
          <div className="mb-6 flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
              <Calculator className="h-6 w-6" />
            </span>
            <p className="text-sm text-slate-600">
              اختر المحافظة والمدينة أو أدخل المسافة بالكيلومتر — كما في تطبيق الموبايل
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-medium text-slate-700">
              من — المحافظة
              <select
                value={fromGovernorateId === "" ? "" : String(fromGovernorateId)}
                onChange={(e) => {
                  setFromGovernorateId(e.target.value ? Number(e.target.value) : "");
                  setFromCityId("");
                }}
                className="input-field mt-1"
              >
                <option value="">— اختر —</option>
                {governorates.map((g) => (
                  <option key={g.governorateId} value={g.governorateId}>
                    {governorateLabel(g)}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-medium text-slate-700">
              إلى — المحافظة
              <select
                value={toGovernorateId === "" ? "" : String(toGovernorateId)}
                onChange={(e) => {
                  setToGovernorateId(e.target.value ? Number(e.target.value) : "");
                  setToCityId("");
                }}
                className="input-field mt-1"
              >
                <option value="">— اختر —</option>
                {governorates.map((g) => (
                  <option key={g.governorateId} value={g.governorateId}>
                    {governorateLabel(g)}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-medium text-slate-700">
              من — المدينة (اختياري)
              <select
                value={fromCityId === "" ? "" : String(fromCityId)}
                onChange={(e) => setFromCityId(e.target.value ? Number(e.target.value) : "")}
                className="input-field mt-1"
                disabled={!fromGovernorateId}
              >
                <option value="">— الكل —</option>
                {fromCities.map((c) => (
                  <option key={c.cityId} value={c.cityId}>
                    {c.nameAr || c.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-medium text-slate-700">
              إلى — المدينة (اختياري)
              <select
                value={toCityId === "" ? "" : String(toCityId)}
                onChange={(e) => setToCityId(e.target.value ? Number(e.target.value) : "")}
                className="input-field mt-1"
                disabled={!toGovernorateId}
              >
                <option value="">— الكل —</option>
                {toCities.map((c) => (
                  <option key={c.cityId} value={c.cityId}>
                    {c.nameAr || c.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="mt-4">
            <Input
              label="المسافة (كم) — اختياري"
              type="number"
              min={0}
              value={distanceKm}
              onChange={(e) => setDistanceKm(e.target.value)}
              placeholder="مثال: 120"
            />
          </div>

          {error && (
            <p className="mt-4 rounded-xl bg-red-50 px-4 py-2 text-sm text-red-600">{error}</p>
          )}

          <div className="mt-6 flex flex-wrap gap-3">
            <Button type="button" onClick={calcOfficial} disabled={loadingOfficial}>
              السعر الرسمي
            </Button>
            <Button type="button" variant="outline" onClick={calcCheapest} disabled={loadingCheapest}>
              أرخص سعر
            </Button>
          </div>
        </Card>

        <div className="grid gap-6 sm:grid-cols-2">
          <PriceResultCard title="السعر الرسمي" result={official} loading={loadingOfficial} />
          <PriceResultCard title="أرخص عرض" result={cheapest} loading={loadingCheapest} />
        </div>
      </PageContainer>
    </>
  );
}
