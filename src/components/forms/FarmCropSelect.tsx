"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { getMyFarms, getCropsByFarm } from "@/services/farms";
import { useAuth } from "@/context/AuthContext";
import type { Crop, Farm } from "@/types/farm";

export function FarmCropSelect({
  cropId,
  farmId: controlledFarmId,
  onCropChange,
  onFarmChange,
  returnTo,
  label = "المحصول",
}: {
  cropId: number | "";
  farmId?: number | "";
  onCropChange: (cropId: number, crop?: Crop) => void;
  onFarmChange?: (farmId: number, farm?: Farm) => void;
  /** عند التعيين: روابط إنشاء مزرعة/محصول والعودة لهذه الصفحة */
  returnTo?: string;
  label?: string;
}) {
  const [farms, setFarms] = useState<Farm[]>([]);
  const [farmId, setFarmId] = useState<number | "">(controlledFarmId ?? "");
  const [crops, setCrops] = useState<Crop[]>([]);
  const [loadingFarms, setLoadingFarms] = useState(true);
  const [loadingCrops, setLoadingCrops] = useState(false);
  const { user, isAuthenticated } = useAuth();

  const onFarmChangeRef = useRef(onFarmChange);
  const onCropChangeRef = useRef(onCropChange);
  useEffect(() => {
    onFarmChangeRef.current = onFarmChange;
  }, [onFarmChange]);
  useEffect(() => {
    onCropChangeRef.current = onCropChange;
  }, [onCropChange]);

  const loadFarms = useCallback(() => {
    if (!user?.userId) return Promise.resolve([]);
    return getMyFarms(user.userId);
  }, [user?.userId]);

  const loadCrops = useCallback((fid: number) => {
    setLoadingCrops(true);
    return getCropsByFarm(fid)
      .then(setCrops)
      .catch(() => setCrops([]))
      .finally(() => setLoadingCrops(false));
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !user?.userId) {
      setFarms([]);
      setLoadingFarms(false);
      return;
    }

    let cancelled = false;
    setLoadingFarms(true);
    loadFarms()
      .then((f) => {
        if (!cancelled) setFarms(f);
      })
      .catch(() => {
        if (!cancelled) setFarms([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingFarms(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, user?.userId, loadFarms]);

  useEffect(() => {
    if (!farms.length) return;

    const targetFarm =
      controlledFarmId && farms.some((x) => x.farmId === controlledFarmId)
        ? controlledFarmId
        : farms.length === 1
          ? farms[0].farmId
          : "";

    if (!targetFarm) return;

    setFarmId(targetFarm);
    if (targetFarm !== controlledFarmId) {
      const farm = farms.find((x) => x.farmId === targetFarm);
      onFarmChangeRef.current?.(Number(targetFarm), farm);
    }
  }, [farms, controlledFarmId]);

  useEffect(() => {
    if (!farmId) {
      setCrops([]);
      return;
    }
    let cancelled = false;
    setLoadingCrops(true);
    getCropsByFarm(Number(farmId))
      .then((list) => {
        if (!cancelled) setCrops(list);
      })
      .catch(() => {
        if (!cancelled) setCrops([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingCrops(false);
      });
    return () => {
      cancelled = true;
    };
  }, [farmId]);

  const farmNewHref = returnTo
    ? `/farms/new?returnTo=${encodeURIComponent(returnTo)}`
    : "/farms/new";
  const cropNewHref =
    returnTo && farmId
      ? `/farms/${farmId}/crops/new?returnTo=${encodeURIComponent(returnTo)}`
      : farmId
        ? `/farms/${farmId}/crops/new`
        : null;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm font-medium text-slate-700">المزرعة</span>
        <Link
          href={farmNewHref}
          className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:underline"
        >
          <Plus className="h-3.5 w-3.5" />
          مزرعة جديدة
        </Link>
      </div>
      <select
        className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm"
        value={farmId}
        disabled={loadingFarms}
        onChange={(e) => {
          const id = e.target.value ? Number(e.target.value) : "";
          setFarmId(id);
          const farm = id ? farms.find((f) => f.farmId === id) : undefined;
          onFarmChangeRef.current?.(id ? Number(id) : 0, farm);
          onCropChangeRef.current(0);
        }}
      >
        <option value="">{loadingFarms ? "جاري التحميل..." : "اختر المزرعة"}</option>
        {farms.map((f) => (
          <option key={f.farmId} value={f.farmId}>
            {f.nameAr || f.name || `مزرعة #${f.farmId}`}
            {f.cityName ? ` — ${f.cityName}` : ""}
          </option>
        ))}
      </select>

      {farms.length === 0 && !loadingFarms && !returnTo && (
        <p className="text-xs text-amber-700">
          لا توجد مزارع.{" "}
          <Link href="/farms/new" className="font-semibold underline">
            أضف مزرعة
          </Link>
        </p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm font-medium text-slate-700">{label}</span>
        {cropNewHref && (
          <Link
            href={cropNewHref}
            className={`inline-flex items-center gap-1 text-xs font-semibold hover:underline ${
              farmId ? "text-emerald-700" : "pointer-events-none text-slate-400"
            }`}
            aria-disabled={!farmId}
            tabIndex={farmId ? 0 : -1}
          >
            <Plus className="h-3.5 w-3.5" />
            محصول جديد
          </Link>
        )}
      </div>
      <select
        className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm disabled:bg-slate-100"
        value={cropId || ""}
        disabled={!farmId || loadingCrops}
        onChange={(e) => {
          const id = Number(e.target.value);
          const crop = crops.find((c) => c.cropId === id);
          onCropChangeRef.current(id, crop);
        }}
      >
        <option value="">
          {!farmId
            ? "اختر المزرعة أولاً"
            : loadingCrops
              ? "جاري تحميل المحاصيل..."
              : crops.length === 0
                ? "لا محاصيل — أضف محصولاً"
                : "اختر المحصول"}
        </option>
        {crops.map((c) => (
          <option key={c.cropId} value={c.cropId}>
            {c.nameAr || c.cropName || c.name || `#${c.cropId}`}
          </option>
        ))}
      </select>
    </div>
  );
}
