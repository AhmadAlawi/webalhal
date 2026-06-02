"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Gavel, Plus, ShoppingBag, Sprout } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageContainer } from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { LocationCascadeSelect } from "@/components/forms/LocationCascadeSelect";
import { cropStatusLabel, isCropSelectable } from "@/lib/crop-status";
import { getFarm, getCropsByFarm, updateFarm } from "@/services/farms";
import { useAuth } from "@/context/AuthContext";
import type { Crop, Farm } from "@/types/farm";
import type { LocationSelection } from "@/types/location";

function farmToLocation(farm: Farm): LocationSelection {
  return {
    governorateId: farm.governorateId ?? "",
    cityId: farm.cityId ?? "",
    areaId: farm.areaId ?? "",
    governorateName: farm.governorateName,
    cityName: farm.cityName,
    areaName: typeof farm.area === "string" ? farm.area : undefined,
  };
}

export default function FarmDetailPage() {
  const { id } = useParams();
  const farmId = Number(id);
  const { user } = useAuth();
  const [farm, setFarm] = useState<Farm | null>(null);
  const [crops, setCrops] = useState<Crop[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingLocation, setEditingLocation] = useState(false);
  const [location, setLocation] = useState<LocationSelection>({
    governorateId: "",
    cityId: "",
    areaId: "",
  });
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [savingLoc, setSavingLoc] = useState(false);
  const [locError, setLocError] = useState("");

  function reload() {
    if (!farmId) return;
    Promise.all([
      getFarm(farmId).catch(() => null),
      getCropsByFarm(farmId).catch(() => [] as Crop[]),
    ]).then(([f, c]) => {
      setFarm(f);
      setCrops(c);
      if (f) {
        setLocation(farmToLocation(f));
        setLat(f.latitude != null ? String(f.latitude) : "");
        setLng(f.longitude != null ? String(f.longitude) : "");
      }
    });
  }

  useEffect(() => {
    if (!farmId) return;
    reload();
    setLoading(false);
  }, [farmId]);

  async function saveLocation() {
    if (!user?.userId || !farm) return;
    if (!location.governorateId || !location.cityId || !location.areaId) {
      setLocError("اختر المحافظة والمدينة والمقاطعة");
      return;
    }
    const farmName = farm.name?.trim() || farm.nameAr?.trim();
    if (!farmName) {
      setLocError("اسم المزرعة مطلوب");
      return;
    }
    setSavingLoc(true);
    setLocError("");
    try {
      await updateFarm(farm.farmId, user.userId, {
        name: farmName,
        governorateId: Number(location.governorateId),
        cityId: Number(location.cityId),
        areaId: Number(location.areaId),
        governorate: location.governorateName,
        city: location.cityName,
        village: farm.village,
        latitude: lat.trim() ? Number(lat) : undefined,
        longitude: lng.trim() ? Number(lng) : undefined,
        canStoreAfterHarvest: false,
      });
      setEditingLocation(false);
      reload();
    } catch (e) {
      setLocError(e instanceof Error ? e.message : "فشل حفظ الموقع");
    } finally {
      setSavingLoc(false);
    }
  }

  const availableCrops = crops.filter(isCropSelectable);

  if (loading) {
    return (
      <>
        <PageHeader title="المزرعة" backHref="/farms" />
        <PageContainer className="py-16 text-center text-slate-500">جاري التحميل...</PageContainer>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title={farm?.nameAr || farm?.name || `مزرعة #${farmId}`}
        backHref="/farms"
      />
      <PageContainer className="py-8">
        {farm && (
          <div className="mb-8 space-y-4 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm text-slate-500">الموقع</p>
                <p className="font-medium text-slate-800">
                  {[farm.governorateName, farm.cityName, farm.area, farm.village, farm.location]
                    .filter(Boolean)
                    .join(" — ") || "غير محدد — أضف الموقع"}
                </p>
                {(farm.latitude != null || farm.longitude != null) && (
                  <p className="mt-1 text-xs text-slate-500">
                    إحداثيات: {farm.latitude ?? "—"} ، {farm.longitude ?? "—"}
                  </p>
                )}
              </div>
              <Button size="sm" variant="outline" onClick={() => setEditingLocation((v) => !v)}>
                {editingLocation ? "إلغاء" : "تعديل الموقع"}
              </Button>
            </div>

            {editingLocation && (
              <div className="space-y-3 border-t border-gray-100 pt-4">
                <LocationCascadeSelect value={location} onChange={setLocation} />
                <div className="grid grid-cols-2 gap-3">
                  <label className="text-sm">
                    <span className="text-slate-600">خط العرض</span>
                    <input
                      className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                      type="number"
                      step="any"
                      value={lat}
                      onChange={(e) => setLat(e.target.value)}
                    />
                  </label>
                  <label className="text-sm">
                    <span className="text-slate-600">خط الطول</span>
                    <input
                      className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                      type="number"
                      step="any"
                      value={lng}
                      onChange={(e) => setLng(e.target.value)}
                    />
                  </label>
                </div>
                {locError && <p className="text-sm text-red-600">{locError}</p>}
                <Button size="sm" onClick={saveLocation} disabled={savingLoc}>
                  {savingLoc ? "جاري الحفظ..." : "حفظ الموقع"}
                </Button>
              </div>
            )}
          </div>
        )}

        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-slate-900">المحاصيل</h2>
          <Link href={`/farms/${farmId}/crops/new`}>
            <Button size="sm">
              <Plus className="h-4 w-4" />
              إضافة محصول
            </Button>
          </Link>
        </div>

        {crops.length === 0 ? (
          <EmptyState
            icon={Sprout}
            title="لا توجد محاصيل"
            description="أضف محصولاً لهذه المزرعة لاستخدامه في المزادات والبيع المباشر"
            action={
              <Link href={`/farms/${farmId}/crops/new`}>
                <Button size="sm">إضافة محصول</Button>
              </Link>
            }
          />
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {crops.map((c) => {
              const status = cropStatusLabel(c.status);
              const selectable = isCropSelectable(c);
              return (
                <li
                  key={c.cropId}
                  className={`rounded-xl border bg-white px-4 py-3 shadow-sm ${
                    selectable ? "border-gray-100" : "border-slate-200 bg-slate-50 opacity-80"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-slate-900">
                        {c.nameAr || c.cropName || c.name || `#${c.cropId}`}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {c.quantity != null ? `${c.quantity} ` : ""}
                        {c.unit || ""}
                      </p>
                      {status && (
                        <span className="mt-2 inline-block rounded-full bg-slate-200 px-2 py-0.5 text-xs text-slate-700">
                          {status}
                        </span>
                      )}
                    </div>
                    {selectable && (
                      <div className="flex flex-col items-end gap-1">
                        <Link
                          href={`/auctions/create?farmId=${farmId}&cropId=${c.cropId}`}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:underline"
                        >
                          <Gavel className="h-3.5 w-3.5" />
                          مزاد
                        </Link>
                        <Link
                          href={`/direct/new?cropId=${c.cropId}`}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 hover:underline"
                        >
                          <ShoppingBag className="h-3.5 w-3.5" />
                          بيع مباشر
                        </Link>
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {availableCrops.length > 0 && (
          <p className="mt-4 text-center text-sm text-slate-500">
            {availableCrops.length} محصول متاح من أصل {crops.length}
          </p>
        )}
      </PageContainer>
    </>
  );
}
