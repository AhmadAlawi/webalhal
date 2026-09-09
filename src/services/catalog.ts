import { apiGet, apiPost } from "@/lib/api";
import { API } from "@/lib/api-endpoints";
import {
  extractAdvertisements,
  normalizeAdvertisement,
  sortAdvertisements,
} from "@/lib/advertisement";
import { unwrapEnvelopeData } from "@/lib/api-envelope";
import { dedupeProductsByProductId, normalizeProductId } from "@/lib/product-id";
import type { Advertisement, Category } from "@/types";
import type { Product } from "@/types/farm";

const AD_HEADERS = { "X-Platform": "web" } as const;

function asArray<T>(data: T[] | { items?: T[] } | null | undefined): T[] {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  return data.items ?? [];
}

interface AdminCategory {
  categoryId?: number;
  CategoryId?: number;
  nameAr?: string;
  nameEn?: string;
  NameAr?: string;
  NameEn?: string;
  isActive?: boolean;
  IsActive?: boolean;
  subCategories?: AdminSubCategory[];
  SubCategories?: AdminSubCategory[];
}

export interface CatalogSubCategory {
  subCategoryId: number;
  nameAr?: string;
  nameEn?: string;
}

export type CatalogCategoryDetail = Category & {
  subCategories: CatalogSubCategory[];
};

interface AdminSubCategory {
  subCategoryId?: number;
  SubCategoryId?: number;
  nameAr?: string;
  NameAr?: string;
  nameEn?: string;
  NameEn?: string;
}

type ProductPayload = Product & {
  ProductId?: number;
  Name?: string;
  NameAr?: string;
  CategoryId?: number;
  Unit?: string;
};

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
    return list
      .map((c): Category | null => {
        const categoryId = c.categoryId ?? c.CategoryId;
        if (!categoryId) return null;
        const nameAr = c.nameAr ?? c.NameAr;
        const nameEn = c.nameEn ?? c.NameEn;
        return {
          categoryId,
          nameAr,
          nameEn,
          name: nameEn ?? nameAr,
        };
      })
      .filter((c): c is Category => c != null);
  } catch {
    return [];
  }
}

function normalizeSubCategory(row: AdminSubCategory): CatalogSubCategory | null {
  const subCategoryId = Number(row.subCategoryId ?? row.SubCategoryId);
  if (!Number.isFinite(subCategoryId) || subCategoryId <= 0) return null;
  return {
    subCategoryId,
    nameAr: row.nameAr ?? row.NameAr,
    nameEn: row.nameEn ?? row.NameEn,
  };
}

function normalizeCategoryDetail(row: AdminCategory): CatalogCategoryDetail | null {
  const categoryId = Number(row.categoryId ?? row.CategoryId);
  if (!Number.isFinite(categoryId) || categoryId <= 0) return null;
  const subCategories = (row.subCategories ?? row.SubCategories ?? [])
    .map(normalizeSubCategory)
    .filter((sub): sub is CatalogSubCategory => sub != null);

  return {
    categoryId,
    nameAr: row.nameAr ?? row.NameAr,
    nameEn: row.nameEn ?? row.NameEn,
    name: row.nameEn ?? row.NameEn ?? row.nameAr ?? row.NameAr,
    subCategories,
  };
}

export async function getCategoryById(categoryId: number) {
  try {
    const data = await apiGet<AdminCategory>(API.categories.byId(categoryId));
    return normalizeCategoryDetail(data);
  } catch {
    return null;
  }
}

/** GET /api/admin/products */
export async function getProducts() {
  try {
    const data = await apiGet<ProductPayload[] | { items?: ProductPayload[] }>(
      API.products.list,
    );
    const products = asArray(data)
      .map((p): Product | null => {
        const rawProductId = Number(p.productId ?? p.ProductId);
        if (!Number.isFinite(rawProductId) || rawProductId <= 0) return null;
        return {
          ...p,
          productId: normalizeProductId(rawProductId),
          name: p.name ?? p.Name,
          nameAr: p.nameAr ?? p.NameAr,
          categoryId: p.categoryId ?? p.CategoryId,
          unit: p.unit ?? p.Unit,
        };
      })
      .filter((p): p is Product => p != null);
    return dedupeProductsByProductId(products);
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
