"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { getMyFarms, getCropsByFarm } from "@/services/farms";
import { isCropSelectable, cropStatusLabel, normalizeCropStatusKey } from "@/lib/crop-status";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/context/I18nContext";
import type { LocalizableRecord } from "@/lib/localized-value";
import { useLocalizedLabel } from "@/hooks/useLocalizedLabel";
import type { Crop, Farm } from "@/types/farm";

export function FarmCropSelect({
  cropId,
  farmId: controlledFarmId,
  onCropChange,
  onFarmChange,
  returnTo,
  label,
  onlyAvailable = true,
  reloadKey,
}: {
  cropId: number | "";
  farmId?: number | "";
  onCropChange: (cropId: number, crop?: Crop) => void;
  onFarmChange?: (farmId: number, farm?: Farm) => void;
  returnTo?: string;
  label?: string;
  onlyAvailable?: boolean;
  reloadKey?: string | number;
}) {
  const { t } = useI18n();
  const { localized } = useLocalizedLabel();
  const cropLabel = label ?? t("farms.cropSelect.crop");
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

  function getCropStatus(status?: string | null): string | null {
    const key = normalizeCropStatusKey(status);
    if (!key || key === "available" || key === "active") return null;
    return t(`farms.cropStatus.${key}`, cropStatusLabel(status) ?? status ?? "");
  }

  const loadFarms = useCallback(() => {
    if (!user?.userId) return Promise.resolve([]);
    return getMyFarms(user.userId);
  }, [user?.userId]);

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
  }, [farmId, reloadKey]);

  const visibleCrops = onlyAvailable ? crops.filter(isCropSelectable) : crops;

  useEffect(() => {
    if (!cropId || !visibleCrops.length) return;
    const crop = visibleCrops.find((c) => c.cropId === cropId);
    if (crop) onCropChangeRef.current(cropId, crop);
  }, [cropId, visibleCrops]);

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
        <span className="text-sm font-medium text-slate-700">{t("farms.cropSelect.farm")}</span>
        <Link
          href={farmNewHref}
          className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:underline"
        >
          <Plus className="h-3.5 w-3.5" />
          {t("farms.cropSelect.newFarm")}
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
        <option value="">
          {loadingFarms ? t("common.loadingEllipsis") : t("farms.cropSelect.selectFarm")}
        </option>
        {farms.map((f) => (
          <option key={f.farmId} value={f.farmId}>
            {localized(f as unknown as LocalizableRecord) || t("farms.farmFallback", undefined, { id: f.farmId })}
            {f.governorateName || f.cityName
              ? ` — ${[f.governorateName, f.cityName].filter(Boolean).join("، ")}`
              : ""}
          </option>
        ))}
      </select>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm font-medium text-slate-700">{cropLabel}</span>
        {cropNewHref && (
          <Link
            href={cropNewHref}
            className={`inline-flex items-center gap-1 text-xs font-semibold hover:underline ${
              farmId ? "text-emerald-700" : "pointer-events-none text-slate-400"
            }`}
          >
            <Plus className="h-3.5 w-3.5" />
            {t("farms.cropSelect.newCrop")}
          </Link>
        )}
      </div>
      <select
        className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm disabled:bg-slate-100"
        value={cropId || ""}
        disabled={!farmId || loadingCrops}
        onChange={(e) => {
          const id = Number(e.target.value);
          const crop = visibleCrops.find((c) => c.cropId === id);
          onCropChangeRef.current(id, crop);
        }}
      >
        <option value="">
          {!farmId
            ? t("farms.cropSelect.selectFarmFirst")
            : loadingCrops
              ? t("farms.cropSelect.loadingCrops")
              : visibleCrops.length === 0
                ? onlyAvailable && crops.length > 0
                  ? t("farms.cropSelect.noAvailable")
                  : t("farms.cropSelect.noCrops")
                : t("farms.cropSelect.selectCrop")}
        </option>
        {visibleCrops.map((c) => {
          const status = getCropStatus(c.status);
          const optionLabel =
            (localized(c as unknown as LocalizableRecord) || `#${c.cropId}`) +
            (c.quantity != null ? ` — ${c.quantity} ${c.unit || ""}` : "") +
            (status ? ` (${status})` : "");
          return (
            <option key={c.cropId} value={c.cropId}>
              {optionLabel}
            </option>
          );
        })}
      </select>
      {onlyAvailable && crops.length > visibleCrops.length && (
        <p className="text-xs text-amber-700">
          {t("farms.cropSelect.hiddenCrops", undefined, {
            count: crops.length - visibleCrops.length,
          })}
        </p>
      )}
    </div>
  );
}
