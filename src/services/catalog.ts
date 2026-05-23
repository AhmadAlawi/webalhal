import { apiGet, apiPost } from "@/lib/api";
import { API } from "@/lib/api-endpoints";
import {
  extractAdvertisements,
  normalizeAdvertisement,
  sortAdvertisements,
} from "@/lib/advertisement";
import { unwrapEnvelopeData } from "@/lib/api-envelope";
import type { Advertisement, Category } from "@/types";
import type { Product } from "@/types/farm";

const AD_HEADERS = { "X-Platform": "web" } as const;

function asArray<T>(data: T[] | { items?: T[] } | null | undefined): T[] {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  return data.items ?? [];
}

interface AdminCategory {
  categoryId: number;
  nameAr?: string;
  nameEn?: string;
  isActive?: boolean;
}

async function fetchAdvertisementList(path: string): Promise<Advertisement[]> {
  const raw = await apiGet<unknown>(path, { headers: AD_HEADERS });
  const payload = unwrapEnvelopeData(raw) ?? raw;
  const list = extractAdvertisements(payload)
    .map(normalizeAdvertisement)
    .filter((a) => a.imageUrl);
  return sortAdvertisements(list);
}

/** GET /api/advertisement/app — سلايدر الرئيسية */
export async function getAppAds(): Promise<Advertisement[]> {
  try {
    return await fetchAdvertisementList(`${API.ads.app}?enabledOnly=true`);
  } catch {
    return [];
  }
}

/** GET /api/advertisement/app/bottom — شريط الشركاء */
export async function getBottomAds(): Promise<Advertisement[]> {
  try {
    return await fetchAdvertisementList(`${API.ads.appBottom}?enabledOnly=true`);
  } catch {
    return [];
  }
}

/** GET /api/admin/categories — مطابق Swagger والموبايل */
export async function getCategories() {
  try {
    const data = await apiGet<AdminCategory[] | { items?: AdminCategory[] }>(
      API.categories.list(true),
    );
    const list = asArray(data);
    return list.map(
      (c): Category => ({
        categoryId: c.categoryId,
        nameAr: c.nameAr,
        name: c.nameAr ?? c.nameEn,
      }),
    );
  } catch {
    return [];
  }
}

/** GET /api/admin/products */
export async function getProducts() {
  try {
    const data = await apiGet<Product[] | { items?: Product[] }>(API.products.list);
    return asArray(data);
  } catch {
    return [];
  }
}

export async function trackAdView(id: number) {
  if (!id) return;
  return apiPost(API.ads.view(id), undefined, { headers: AD_HEADERS }).catch(
    () => null,
  );
}

export async function trackAdClick(advertisementId: number, userId?: number) {
  if (!advertisementId) return;
  return apiPost(
    API.ads.click,
    { advertisementId, userId: userId ?? null },
    { headers: AD_HEADERS },
  ).catch(() => null);
}
