import { apiGet, apiPost, apiPut } from "@/lib/api";
import { asApiList } from "@/lib/api-list";
import type { Crop, Farm } from "@/types/farm";

function asArray<T>(data: T[] | { items?: T[]; data?: T[] } | null | undefined): T[] {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  return data.items ?? data.data ?? [];
}

function normalizeFarm(raw: unknown): Farm | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const farmId = Number(r.farmId ?? r.FarmId ?? r.id);
  if (!Number.isFinite(farmId) || farmId <= 0) return null;
  return {
    farmId,
    name: (r.name ?? r.Name) as string | undefined,
    nameAr: (r.nameAr ?? r.NameAr) as string | undefined,
    governorateId: Number(r.governorateId ?? r.GovernorateId) || undefined,
    cityId: Number(r.cityId ?? r.CityId) || undefined,
    areaId: Number(r.areaId ?? r.AreaId) || undefined,
    governorateName: (r.governorate ?? r.GovernorateName ?? r.governorateName) as
      | string
      | undefined,
    cityName: (r.city ?? r.CityName ?? r.cityName) as string | undefined,
    area: (r.area ?? r.AreaName ?? r.areaName) as string | undefined,
    location: (r.village ?? r.location ?? r.Location) as string | undefined,
    village: (r.village ?? r.Village) as string | undefined,
    latitude: Number(r.latitude ?? r.Latitude) || undefined,
    longitude: Number(r.longitude ?? r.Longitude) || undefined,
  };
}

/** GET /api/farms/by-user/{userId} — لا يوجد GET على /api/farms */
export async function getMyFarms(userId: number) {
  const data = await apiGet<unknown>(
    `/api/farms/by-user/${encodeURIComponent(String(userId))}`,
  );
  return asApiList(data)
    .map(normalizeFarm)
    .filter((f): f is Farm => f != null);
}

export async function getFarm(farmId: number) {
  return apiGet<Farm>(`/api/farms/${farmId}`);
}

export async function createFarm(userId: number, body: Record<string, unknown>) {
  return apiPost<Farm>(`/api/farms?userId=${encodeURIComponent(String(userId))}`, body);
}

function normalizeCrop(raw: unknown): Crop | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const cropId = Number(r.cropId ?? r.CropId ?? r.id);
  if (!Number.isFinite(cropId) || cropId <= 0) return null;
  return {
    cropId,
    farmId: Number(r.farmId ?? r.FarmId) || undefined,
    name: (r.name ?? r.Name) as string | undefined,
    nameAr: (r.nameAr ?? r.NameAr ?? r.cropName) as string | undefined,
    cropName: (r.cropName ?? r.CropName) as string | undefined,
    unit: (r.unit ?? r.Unit) as string | undefined,
    quantity: Number(r.quantity ?? r.Quantity) || undefined,
    productId: Number(r.productId ?? r.ProductId) || undefined,
    status: (r.status ?? r.Status) as string | undefined,
    harvestDate: (r.harvestDate ?? r.HarvestDate) as string | undefined,
    imageUrls: Array.isArray(r.imageUrls)
      ? (r.imageUrls as string[])
      : Array.isArray(r.images)
        ? (r.images as { url?: string; imageUrl?: string }[])
            .map((img) => img.url ?? img.imageUrl)
            .filter((u): u is string => Boolean(u))
        : undefined,
  };
}

export async function updateCrop(cropId: number, body: Record<string, unknown>) {
  return apiPut<Crop>(`/api/crops/${cropId}`, body);
}

export async function createCrop(body: {
  farmId: number;
  productId: number;
  name: string;
  quantity: number;
  unit: string;
  harvestDate: string;
  expiryDate?: string;
  variety?: string;
  imageUrls?: string[];
}) {
  return apiPost<Crop>("/api/crops", body);
}

export async function updateFarm(
  farmId: number,
  userId: number,
  body: Record<string, unknown>,
) {
  return apiPut<Farm>(
    `/api/farms/${farmId}?userId=${encodeURIComponent(String(userId))}`,
    body,
  );
}

export async function getCropsByFarm(farmId: number) {
  const data = await apiGet<unknown>(`/api/crops/by-farmland/${farmId}`);
  return asApiList(data)
    .map(normalizeCrop)
    .filter((c): c is Crop => c != null);
}

export async function getAllMyCrops(userId: number) {
  const farms = await getMyFarms(userId);
  const batches = await Promise.all(
    farms.map((f) => getCropsByFarm(f.farmId).catch(() => [] as Crop[])),
  );
  return farms.flatMap((farm, i) =>
    batches[i].map((c) => ({ ...c, farmId: c.farmId ?? farm.farmId, farmName: farm.nameAr || farm.name })),
  );
}
