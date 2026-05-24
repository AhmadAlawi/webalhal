import { apiGet } from "@/lib/api";
import { asApiList } from "@/lib/api-list";
import type { City } from "@/types/transport";
import type { Area, Governorate } from "@/types/location";

function normalizeGovernorate(raw: unknown): Governorate | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const id = Number(r.governorateId ?? r.GovernorateId ?? r.id ?? r.Id);
  if (!Number.isFinite(id) || id <= 0) return null;
  return {
    governorateId: id,
    nameAr: (r.nameAr ?? r.NameAr) as string | undefined,
    nameEn: (r.nameEn ?? r.NameEn) as string | undefined,
    name: (r.name ?? r.Name) as string | undefined,
  };
}

function normalizeArea(raw: unknown): Area | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const id = Number(r.areaId ?? r.AreaId ?? r.id ?? r.Id);
  if (!Number.isFinite(id) || id <= 0) return null;
  return {
    areaId: id,
    cityId: Number(r.cityId ?? r.CityId) || 0,
    governorateId: Number(r.governorateId ?? r.GovernorateId) || undefined,
    nameAr: (r.nameAr ?? r.NameAr) as string | undefined,
    nameEn: (r.nameEn ?? r.NameEn) as string | undefined,
    name: (r.name ?? r.Name) as string | undefined,
  };
}

function normalizeCity(raw: unknown): City | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const id = Number(r.cityId ?? r.CityId ?? r.id ?? r.Id);
  if (!Number.isFinite(id) || id <= 0) return null;
  return {
    cityId: id,
    governorateId: Number(r.governorateId ?? r.GovernorateId) || undefined,
    nameAr: (r.nameAr ?? r.NameAr) as string | undefined,
    name: (r.name ?? r.Name) as string | undefined,
    governorateNameAr: (r.governorateNameAr ?? r.GovernorateNameAr) as string | undefined,
  };
}

export async function getGovernorates(isActive = true): Promise<Governorate[]> {
  const qs = isActive ? "?isActive=true" : "";
  const data = await apiGet<unknown>(`/api/governorates${qs}`);
  return asApiList(data)
    .map(normalizeGovernorate)
    .filter((g): g is Governorate => g != null);
}

export async function getCitiesByGovernorate(
  governorateId: number,
  isActive = true,
): Promise<City[]> {
  const qs = isActive ? "?isActive=true" : "";
  const data = await apiGet<unknown>(
    `/api/cities/by-governorate/${governorateId}${qs}`,
  );
  return asApiList(data)
    .map(normalizeCity)
    .filter((c): c is City => c != null);
}

export async function getAreasByCity(cityId: number, isActive = true): Promise<Area[]> {
  const qs = isActive ? "?isActive=true" : "";
  const data = await apiGet<unknown>(`/api/areas/by-city/${cityId}${qs}`);
  return asApiList(data)
    .map(normalizeArea)
    .filter((a): a is Area => a != null);
}

export function locationLabel(item: {
  nameAr?: string;
  nameEn?: string;
  name?: string;
}): string {
  return item.nameAr || item.name || item.nameEn || "";
}
