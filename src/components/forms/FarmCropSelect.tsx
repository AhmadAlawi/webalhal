"use client";

import { useEffect, useState } from "react";
import { getMyFarms, getCropsByFarm } from "@/services/farms";
import type { Crop, Farm } from "@/types/farm";

export function FarmCropSelect({
  cropId,
  onCropChange,
  label = "المحصول",
}: {
  cropId: number | "";
  onCropChange: (cropId: number, crop?: Crop) => void;
  label?: string;
}) {
  const [farms, setFarms] = useState<Farm[]>([]);
  const [farmId, setFarmId] = useState<number | "">("");
  const [crops, setCrops] = useState<Crop[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyFarms()
      .then((f) => {
        setFarms(f);
        if (f.length === 1) setFarmId(f[0].farmId);
      })
      .catch(() => setFarms([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!farmId) {
      setCrops([]);
      return;
    }
    getCropsByFarm(Number(farmId))
      .then(setCrops)
      .catch(() => setCrops([]));
  }, [farmId]);

  return (
    <div className="space-y-3">
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-slate-700">المزرعة</span>
        <select
          className="rounded-xl border border-gray-200 px-3 py-2.5"
          value={farmId}
          disabled={loading}
          onChange={(e) => {
            setFarmId(e.target.value ? Number(e.target.value) : "");
            onCropChange(0);
          }}
        >
          <option value="">اختر المزرعة</option>
          {farms.map((f) => (
            <option key={f.farmId} value={f.farmId}>
              {f.nameAr || f.name || `مزرعة #${f.farmId}`}
              {f.cityName ? ` — ${f.cityName}` : ""}
            </option>
          ))}
        </select>
      </label>
      {farms.length === 0 && !loading && (
        <p className="text-xs text-amber-700">
          لا توجد مزارع.{" "}
          <a href="/farms/new" className="font-semibold underline">
            أضف مزرعة
          </a>
        </p>
      )}
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-slate-700">{label}</span>
        <select
          className="rounded-xl border border-gray-200 px-3 py-2.5"
          value={cropId}
          disabled={!farmId || crops.length === 0}
          onChange={(e) => {
            const id = Number(e.target.value);
            const crop = crops.find((c) => c.cropId === id);
            onCropChange(id, crop);
          }}
        >
          <option value="">اختر المحصول</option>
          {crops.map((c) => (
            <option key={c.cropId} value={c.cropId}>
              {c.nameAr || c.cropName || c.name || `#${c.cropId}`}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
