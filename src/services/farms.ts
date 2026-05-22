import { apiGet, apiPost } from "@/lib/api";
import type { Crop, Farm } from "@/types/farm";

function asArray<T>(data: T[] | { items?: T[]; data?: T[] } | null | undefined): T[] {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  return data.items ?? data.data ?? [];
}

export async function getMyFarms() {
  const data = await apiGet<Farm[] | { items?: Farm[] }>("/api/farms");
  return asArray(data);
}

export async function getFarm(farmId: number) {
  return apiGet<Farm>(`/api/farms/${farmId}`);
}

export async function createFarm(body: Record<string, unknown>) {
  return apiPost<Farm>("/api/farms", body);
}

export async function getCropsByFarm(farmId: number) {
  const data = await apiGet<Crop[] | { items?: Crop[] }>(
    `/api/crops?farmId=${farmId}`,
  );
  return asArray(data);
}

export async function getAllMyCrops() {
  const farms = await getMyFarms();
  const batches = await Promise.all(
    farms.map((f) => getCropsByFarm(f.farmId).catch(() => [] as Crop[])),
  );
  return farms.flatMap((farm, i) =>
    batches[i].map((c) => ({ ...c, farmId: c.farmId ?? farm.farmId, farmName: farm.nameAr || farm.name })),
  );
}
