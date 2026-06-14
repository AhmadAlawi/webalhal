"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/context/I18nContext";
import { useLocalizedLabel } from "@/hooks/useLocalizedLabel";
import {
  getAreasByCity,
  getCitiesByGovernorate,
  getGovernorates,
} from "@/services/locations";
import type { City } from "@/types/transport";
import type { Area, Governorate, LocationSelection } from "@/types/location";

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
  const { t } = useI18n();
  const { locationLabel } = useLocalizedLabel();
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
    let cancelled = false;
    if (!value.governorateId) {
      const timeout = window.setTimeout(() => setCities([]), 0);
      return () => window.clearTimeout(timeout);
    }

    const timeout = window.setTimeout(() => {
      setLoadingCity(true);
      getCitiesByGovernorate(Number(value.governorateId))
        .then((next) => {
          if (!cancelled) setCities(next);
        })
        .catch(() => {
          if (!cancelled) setCities([]);
        })
        .finally(() => {
          if (!cancelled) setLoadingCity(false);
        });
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [value.governorateId]);

  useEffect(() => {
    let cancelled = false;
    if (!value.cityId) {
      const timeout = window.setTimeout(() => setAreas([]), 0);
      return () => window.clearTimeout(timeout);
    }

    const timeout = window.setTimeout(() => {
      setLoadingArea(true);
      getAreasByCity(Number(value.cityId))
        .then((next) => {
          if (!cancelled) setAreas(next);
        })
        .catch(() => {
          if (!cancelled) setAreas([]);
        })
        .finally(() => {
          if (!cancelled) setLoadingArea(false);
        });
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
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
          {t("forms.location.governorate")}
          {required ? " *" : ""}
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
          <option value="">{t("forms.location.selectGovernorate")}</option>
          {governorates.map((g) => (
            <option key={g.governorateId} value={g.governorateId}>
              {locationLabel(g)}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-slate-700">
          {t("forms.location.city")}
          {required ? " *" : ""}
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
              ? t("forms.location.selectGovernorateFirst")
              : loadingCity
                ? t("forms.location.loading")
                : t("forms.location.selectCity")}
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
          {t("forms.location.area")}
          {required ? " *" : ""}
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
              ? t("forms.location.selectCityFirst")
              : loadingArea
                ? t("forms.location.loading")
                : areas.length === 0
                  ? t("forms.location.noAreas")
                  : t("forms.location.selectArea")}
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
