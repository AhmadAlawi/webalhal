"use client";

import { useEffect, useState } from "react";
import {
  getAreasByCity,
  getCitiesByGovernorate,
  getGovernorates,
  locationLabel,
} from "@/services/locations";
import type { LocationSelection } from "@/types/location";
import type { City } from "@/types/transport";
import type { Area, Governorate } from "@/types/location";

const selectClass =
  "rounded-xl border border-gray-200 px-3 py-2.5 text-sm disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400";

export function LocationCascadeSelect({
  value,
  onChange,
  required = true,
}: {
  value: LocationSelection;
  onChange: (next: LocationSelection) => void;
  required?: boolean;
}) {
  const [governorates, setGovernorates] = useState<Governorate[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [loadingGov, setLoadingGov] = useState(true);
  const [loadingCity, setLoadingCity] = useState(false);
  const [loadingArea, setLoadingArea] = useState(false);

  useEffect(() => {
    getGovernorates()
      .then(setGovernorates)
      .catch(() => setGovernorates([]))
      .finally(() => setLoadingGov(false));
  }, []);

  useEffect(() => {
    if (!value.governorateId) {
      setCities([]);
      return;
    }
    setLoadingCity(true);
    getCitiesByGovernorate(Number(value.governorateId))
      .then(setCities)
      .catch(() => setCities([]))
      .finally(() => setLoadingCity(false));
  }, [value.governorateId]);

  useEffect(() => {
    if (!value.cityId) {
      setAreas([]);
      return;
    }
    setLoadingArea(true);
    getAreasByCity(Number(value.cityId))
      .then(setAreas)
      .catch(() => setAreas([]))
      .finally(() => setLoadingArea(false));
  }, [value.cityId]);

  function pickGovernorate(id: number | "") {
    const gov = governorates.find((g) => g.governorateId === id);
    onChange({
      governorateId: id,
      cityId: "",
      areaId: "",
      governorateName: gov ? locationLabel(gov) : undefined,
      cityName: undefined,
      areaName: undefined,
    });
  }

  function pickCity(id: number | "") {
    const city = cities.find((c) => c.cityId === id);
    onChange({
      ...value,
      cityId: id,
      areaId: "",
      cityName: city ? locationLabel(city) : undefined,
      areaName: undefined,
    });
  }

  function pickArea(id: number | "") {
    const area = areas.find((a) => a.areaId === id);
    onChange({
      ...value,
      areaId: id,
      areaName: area ? locationLabel(area) : undefined,
    });
  }

  return (
    <div className="space-y-3">
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-slate-700">
          المحافظة{required ? " *" : ""}
        </span>
        <select
          className={selectClass}
          value={value.governorateId}
          disabled={loadingGov}
          required={required}
          onChange={(e) =>
            pickGovernorate(e.target.value ? Number(e.target.value) : "")
          }
        >
          <option value="">اختر المحافظة</option>
          {governorates.map((g) => (
            <option key={g.governorateId} value={g.governorateId}>
              {locationLabel(g)}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-slate-700">
          المدينة{required ? " *" : ""}
        </span>
        <select
          className={selectClass}
          value={value.cityId}
          disabled={!value.governorateId || loadingCity}
          required={required}
          onChange={(e) => pickCity(e.target.value ? Number(e.target.value) : "")}
        >
          <option value="">
            {!value.governorateId
              ? "اختر المحافظة أولاً"
              : loadingCity
                ? "جاري التحميل..."
                : "اختر المدينة"}
          </option>
          {cities.map((c) => (
            <option key={c.cityId} value={c.cityId}>
              {locationLabel(c)}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-slate-700">
          المقاطعة{required ? " *" : ""}
        </span>
        <select
          className={selectClass}
          value={value.areaId}
          disabled={!value.cityId || loadingArea}
          required={required}
          onChange={(e) => pickArea(e.target.value ? Number(e.target.value) : "")}
        >
          <option value="">
            {!value.cityId
              ? "اختر المدينة أولاً"
              : loadingArea
                ? "جاري التحميل..."
                : areas.length === 0
                  ? "لا توجد مقاطعات"
                  : "اختر المقاطعة"}
          </option>
          {areas.map((a) => (
            <option key={a.areaId} value={a.areaId}>
              {locationLabel(a)}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
