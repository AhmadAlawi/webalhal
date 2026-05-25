"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, MapPin, Search, Truck, CheckCircle2, AlertTriangle } from "lucide-react";
import { assignTransportWithRecovery } from "@/lib/transport-assign";
import { formatCurrency } from "@/lib/format";
import {
  createTransportRequest,
  findBuyerTransportForDeal,
  getTransportMatches,
} from "@/services/transport";
import { useCities } from "@/hooks/useCities";
import { getGovernorates } from "@/services/locations";
import { locationLabel } from "@/services/locations";
import type { Governorate } from "@/types/location";
import type { TransportPriceLineMatch, TransportRequestDetail } from "@/types/transport";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/context/AuthContext";

export interface DealContext {
  conversationId: number;
  orderType: string;
  orderId: number;
  farmCityId?: number;
  farmGovernorateId?: number;
}

export function TransportAssignPanel({ deal }: { deal: DealContext }) {
  const { user } = useAuth();
  const [mode, setMode] = useState<"assign" | "request">("assign");
  const { data: cities = [], isLoading: loadingCities } = useCities();
  const [governorates, setGovernorates] = useState<Governorate[]>([]);
  const [fromGovernorateId, setFromGovernorateId] = useState<number | "">("");
  const [toGovernorateId, setToGovernorateId] = useState<number | "">("");
  const [productType, setProductType] = useState("محاصيل");
  const [weightKg, setWeightKg] = useState("100");
  const [distanceKm, setDistanceKm] = useState("50");
  const [pickupDate, setPickupDate] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [creatingRequest, setCreatingRequest] = useState(false);
  const [fromCityId, setFromCityId] = useState<number | "">("");
  const [toCityId, setToCityId] = useState<number | "">("");
  const [matches, setMatches] = useState<TransportPriceLineMatch[]>([]);
  const [selectedLineId, setSelectedLineId] = useState<number | null>(null);
  const [existingRequest, setExistingRequest] = useState<TransportRequestDetail | null>(null);
  const [searching, setSearching] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [warningMsg, setWarningMsg] = useState<string | null>(null);

  const loadExisting = useCallback(async () => {
    try {
      const req = await findBuyerTransportForDeal(deal.orderType, deal.orderId);
      setExistingRequest(req);
      if (req?.status?.toLowerCase() === "assigned") {
        setSuccessMsg("الناقل مُعيَّن لهذه الصفقة.");
      }
    } catch {
      setExistingRequest(null);
    }
  }, [deal.orderType, deal.orderId]);

  useEffect(() => {
    getGovernorates()
      .then(setGovernorates)
      .catch(() => setGovernorates([]));
  }, []);

  useEffect(() => {
    if (deal.farmCityId) {
      setFromCityId(deal.farmCityId);
      const city = cities.find((c) => c.cityId === deal.farmCityId);
      if (city?.governorateId) setFromGovernorateId(city.governorateId);
    }
    loadExisting();
  }, [deal.farmCityId, loadExisting, cities]);

  const fromCities = fromGovernorateId
    ? cities.filter((c) => c.governorateId === fromGovernorateId)
    : [];
  const toCities = toGovernorateId
    ? cities.filter((c) => c.governorateId === toGovernorateId)
    : [];

  async function handleSearch() {
    if (!fromCityId || !toCityId) {
      setError("اختر مدينة الاستلام ومدينة التسليم");
      return;
    }
    setSearching(true);
    setError(null);
    setMatches([]);
    setSelectedLineId(null);
    try {
      const lines = await getTransportMatches(Number(fromCityId), Number(toCityId));
      setMatches(lines);
      if (lines.length === 0) {
        setError("لا توجد خطوط أسعار نشطة لهذا المسار");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "فشل البحث عن ناقلين");
    } finally {
      setSearching(false);
    }
  }

  async function handleAssign() {
    const line = matches.find((m) => m.priceLineId === selectedLineId);
    if (!line) {
      setError("اختر خط سعر من القائمة");
      return;
    }

    setAssigning(true);
    setError(null);
    setWarningMsg(null);
    setSuccessMsg(null);

    const result = await assignTransportWithRecovery({
      conversationId: deal.conversationId,
      orderType: deal.orderType,
      orderId: deal.orderId,
      transportProviderId: line.transportProviderId,
      priceLineId: line.priceLineId,
      agreedPrice: line.price,
    });

    setAssigning(false);

    if (result.success) {
      setSuccessMsg(result.message ?? "تم التعيين");
      if (result.recoveredFromServerError) {
        setWarningMsg(
          "ملاحظة: الخادم أبلغ عن خطأ بعد حفظ التعيين. لا تعِد المحاولة بخط سعر آخر.",
        );
      }
      if (result.request) setExistingRequest(result.request);
      await loadExisting();
      setMatches([]);
      setSelectedLineId(null);
      return;
    }

    setError(result.message ?? "فشل التعيين");
  }

  async function handleCreateRequest() {
    if (!user?.userId) {
      setError("سجّل الدخول لإنشاء طلب نقل");
      return;
    }
    if (!fromCityId || !toCityId) {
      setError("اختر مدينة الاستلام والتسليم");
      return;
    }
    if (!pickupDate || !deliveryDate) {
      setError("حدد تاريخ الاستلام والتسليم المتوقع");
      return;
    }

    setCreatingRequest(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = (await createTransportRequest({
        orderType: deal.orderType,
        orderId: deal.orderId,
        buyerUserId: user.userId,
        conversationId: deal.conversationId,
        fromCityId: Number(fromCityId),
        toCityId: Number(toCityId),
        distanceKm: Number(distanceKm) || 1,
        productType,
        weightKg: Number(weightKg) || 1,
        preferredPickupDate: new Date(pickupDate).toISOString(),
        preferredDeliveryDate: new Date(deliveryDate).toISOString(),
      })) as { requestId?: number; notifyHint?: string; notifiedTransporters?: number };

      setSuccessMsg(
        res.requestId
          ? `تم إنشاء طلب النقل #${res.requestId}${
              res.notifiedTransporters != null
                ? ` — تم إشعار ${res.notifiedTransporters} ناقل`
                : ""
            }`
          : "تم إنشاء طلب النقل",
      );
      if (res.notifyHint) setWarningMsg(res.notifyHint);
      await loadExisting();
    } catch (e) {
      setError(e instanceof Error ? e.message : "فشل إنشاء طلب النقل");
    } finally {
      setCreatingRequest(false);
    }
  }

  const isAssigned =
    existingRequest?.status?.toLowerCase() === "assigned" ||
    existingRequest?.status?.toLowerCase() === "completed";

  const selectedLine = matches.find((m) => m.priceLineId === selectedLineId);

  return (
    <section className="border-b border-emerald-100 bg-gradient-to-l from-emerald-50/80 to-white px-4 py-4">
      <div className="mx-auto max-w-lg">
        <div className="mb-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-sm font-semibold text-emerald-800">
            <Truck className="h-4 w-4" />
            النقل
          </div>
          {!isAssigned && (
            <div className="flex rounded-lg border border-gray-200 p-0.5 text-xs">
              <button
                type="button"
                className={`rounded-md px-2 py-1 ${mode === "assign" ? "bg-emerald-600 text-white" : "text-slate-600"}`}
                onClick={() => setMode("assign")}
              >
                تعيين مباشر
              </button>
              <button
                type="button"
                className={`rounded-md px-2 py-1 ${mode === "request" ? "bg-emerald-600 text-white" : "text-slate-600"}`}
                onClick={() => setMode("request")}
              >
                طلب نقل
              </button>
            </div>
          )}
        </div>

        {isAssigned && existingRequest && (
          <div className="mb-3 flex gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-3 text-sm text-emerald-900">
            <CheckCircle2 className="h-5 w-5 shrink-0" />
            <div>
              <p className="font-medium">{successMsg ?? "تم تعيين الناقل"}</p>
              {existingRequest.agreedPrice != null && (
                <p className="mt-1 text-emerald-700">
                  السعر المتفق: {formatCurrency(existingRequest.agreedPrice)}
                </p>
              )}
              <Link
                href={`/transport/requests/${existingRequest.requestId}`}
                className="mt-2 inline-block text-xs font-semibold text-emerald-600 hover:underline"
              >
                عرض طلب النقل #{existingRequest.requestId}
              </Link>
            </div>
          </div>
        )}

        {warningMsg && (
          <div className="mb-3 flex gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <p>{warningMsg}</p>
          </div>
        )}

        {!isAssigned && (
          <>
            <div className="space-y-4">
              <div className="rounded-xl border border-gray-100 bg-white/80 p-3">
                <p className="mb-2 text-xs font-semibold text-slate-700">
                  <MapPin className="inline h-3 w-3" /> من (استلام)
                </p>
                <div className="grid gap-2 sm:grid-cols-2">
                  <select
                    className="rounded-lg border border-gray-200 px-2 py-2 text-sm"
                    value={fromGovernorateId}
                    onChange={(e) => {
                      const id = e.target.value ? Number(e.target.value) : "";
                      setFromGovernorateId(id);
                      setFromCityId("");
                    }}
                  >
                    <option value="">المحافظة</option>
                    {governorates.map((g) => (
                      <option key={g.governorateId} value={g.governorateId}>
                        {locationLabel(g)}
                      </option>
                    ))}
                  </select>
                  <select
                    className="rounded-lg border border-gray-200 px-2 py-2 text-sm"
                    value={fromCityId}
                    disabled={!fromGovernorateId || loadingCities}
                    onChange={(e) =>
                      setFromCityId(e.target.value ? Number(e.target.value) : "")
                    }
                  >
                    <option value="">
                      {!fromGovernorateId ? "اختر المحافظة أولاً" : "المدينة"}
                    </option>
                    {fromCities.map((c) => (
                      <option key={c.cityId} value={c.cityId}>
                        {c.nameAr || c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="rounded-xl border border-gray-100 bg-white/80 p-3">
                <p className="mb-2 text-xs font-semibold text-slate-700">
                  <MapPin className="inline h-3 w-3" /> إلى (تسليم)
                </p>
                <div className="grid gap-2 sm:grid-cols-2">
                  <select
                    className="rounded-lg border border-gray-200 px-2 py-2 text-sm"
                    value={toGovernorateId}
                    onChange={(e) => {
                      const id = e.target.value ? Number(e.target.value) : "";
                      setToGovernorateId(id);
                      setToCityId("");
                    }}
                  >
                    <option value="">المحافظة</option>
                    {governorates.map((g) => (
                      <option key={g.governorateId} value={g.governorateId}>
                        {locationLabel(g)}
                      </option>
                    ))}
                  </select>
                  <select
                    className="rounded-lg border border-gray-200 px-2 py-2 text-sm"
                    value={toCityId}
                    disabled={!toGovernorateId || loadingCities}
                    onChange={(e) =>
                      setToCityId(e.target.value ? Number(e.target.value) : "")
                    }
                  >
                    <option value="">
                      {!toGovernorateId ? "اختر المحافظة أولاً" : "المدينة"}
                    </option>
                    {toCities.map((c) => (
                      <option key={c.cityId} value={c.cityId}>
                        {c.nameAr || c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {mode === "request" && (
              <div className="mt-3 space-y-3 rounded-xl border border-gray-100 bg-white p-3">
                <Input
                  label="نوع المنتج"
                  value={productType}
                  onChange={(e) => setProductType(e.target.value)}
                />
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    label="الوزن (كغ)"
                    type="number"
                    value={weightKg}
                    onChange={(e) => setWeightKg(e.target.value)}
                  />
                  <Input
                    label="المسافة (كم)"
                    type="number"
                    value={distanceKm}
                    onChange={(e) => setDistanceKm(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    label="استلام متوقع"
                    type="datetime-local"
                    value={pickupDate}
                    onChange={(e) => setPickupDate(e.target.value)}
                  />
                  <Input
                    label="تسليم متوقع"
                    type="datetime-local"
                    value={deliveryDate}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                  />
                </div>
                <Button
                  type="button"
                  className="w-full"
                  disabled={creatingRequest}
                  onClick={handleCreateRequest}
                >
                  {creatingRequest ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Truck className="h-4 w-4" />
                  )}
                  إنشاء طلب وإشعار الناقلين
                </Button>
              </div>
            )}

            {mode === "assign" && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-3 w-full"
                disabled={searching || !fromCityId || !toCityId}
                onClick={handleSearch}
              >
                {searching ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
                بحث عن ناقلين ({fromCityId && toCityId ? "جاهز" : "اختر المدن"})
              </Button>
            )}

            {mode === "assign" && matches.length > 0 && (
              <ul className="mt-3 max-h-48 space-y-2 overflow-y-auto">
                {matches.map((m) => (
                  <li key={m.priceLineId}>
                    <button
                      type="button"
                      onClick={() => setSelectedLineId(m.priceLineId)}
                      className={`w-full rounded-xl border px-3 py-2.5 text-start text-sm transition-colors ${
                        selectedLineId === m.priceLineId
                          ? "border-emerald-500 bg-emerald-50 ring-2 ring-emerald-500/20"
                          : "border-gray-200 bg-white hover:border-emerald-200"
                      }`}
                    >
                      <div className="flex justify-between gap-2">
                        <span className="font-medium text-slate-800">
                          {m.transporterName || m.providerName || `ناقل #${m.transportProviderId}`}
                        </span>
                        <span className="font-bold text-emerald-600">
                          {formatCurrency(m.price)}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {m.fromRegion} → {m.toRegion}
                        {m.isAvailable === false && " · غير متاح حالياً"}
                      </p>
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {mode === "assign" && selectedLine && !isAssigned && (
              <Button
                type="button"
                className="mt-3 w-full"
                disabled={assigning}
                onClick={handleAssign}
              >
                {assigning ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Truck className="h-4 w-4" />
                )}
                تعيين — {formatCurrency(selectedLine.price)}
              </Button>
            )}
          </>
        )}

        {error && (
          <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        )}

        {!isAssigned && (
          <button
            type="button"
            className="mt-2 w-full text-center text-xs text-slate-500 hover:text-emerald-600"
            onClick={() => loadExisting()}
          >
            تحديث حالة التعيين
          </button>
        )}
      </div>
    </section>
  );
}
