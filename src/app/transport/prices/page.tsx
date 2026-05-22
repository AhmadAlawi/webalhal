"use client";

import { useEffect, useState } from "react";
import { Calculator, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageContainer } from "@/components/layout/PageContainer";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  fetchTransportRegions,
  getCheapestTransportPrice,
  getOfficialTransportPrice,
  type TransportPriceResult,
} from "@/services/transport-prices";
import { formatCurrency } from "@/lib/format";

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

export default function TransportPricesPage() {
  const [regions, setRegions] = useState<string[]>([]);
  const [fromRegion, setFromRegion] = useState("");
  const [toRegion, setToRegion] = useState("");
  const [distanceKm, setDistanceKm] = useState("");
  const [official, setOfficial] = useState<TransportPriceResult | null>(null);
  const [cheapest, setCheapest] = useState<TransportPriceResult | null>(null);
  const [loadingOfficial, setLoadingOfficial] = useState(false);
  const [loadingCheapest, setLoadingCheapest] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchTransportRegions()
      .then(setRegions)
      .catch(() => setRegions([]));
  }, []);

  function buildDto() {
    const km = distanceKm.trim() ? Number(distanceKm) : undefined;
    return {
      fromRegion: fromRegion || undefined,
      toRegion: toRegion || undefined,
      distanceKm: km != null && !Number.isNaN(km) ? km : undefined,
    };
  }

  function validate(): boolean {
    if (!fromRegion || !toRegion) {
      setError("اختر منطقة الانطلاق والوصول");
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
        subtitle="تقدير السعر الرسمي وأرخص عرض بين المناطق"
        backHref="/account"
      />
      <PageContainer className="py-8">
        <Card padding="lg" className="mb-8">
          <div className="mb-6 flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
              <Calculator className="h-6 w-6" />
            </span>
            <p className="text-sm text-slate-600">
              اختر المناطق أو أدخل المسافة بالكيلومتر — كما في تطبيق الموبايل
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-medium text-slate-700">
              من
              <select
                value={fromRegion}
                onChange={(e) => setFromRegion(e.target.value)}
                className="input-field mt-1"
              >
                <option value="">— اختر —</option>
                {regions.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-medium text-slate-700">
              إلى
              <select
                value={toRegion}
                onChange={(e) => setToRegion(e.target.value)}
                className="input-field mt-1"
              >
                <option value="">— اختر —</option>
                {regions.map((r) => (
                  <option key={r} value={r}>
                    {r}
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
