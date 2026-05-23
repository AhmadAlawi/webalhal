import { apiGet } from "@/lib/api";
import { API } from "@/lib/api-endpoints";
import type { Advertisement, Category } from "@/types";
import type { Product } from "@/types/farm";

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

export async function getAppAds() {
  const data = await apiGet<Advertisement[]>(`${API.ads.app}?enabledOnly=true`, {
    headers: { "X-Platform": "web" },
  } as never);
  return Array.isArray(data) ? data : [];
}

export async function getBottomAds() {
  const data = await apiGet<Advertisement[]>(
    `${API.ads.appBottom}?enabledOnly=true`,
    { headers: { "X-Platform": "web" } } as never,
  );
  return Array.isArray(data) ? data : [];
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
  return apiGet(API.ads.view(id), { method: "POST" } as never).catch(() => null);
}
