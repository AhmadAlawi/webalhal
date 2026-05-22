import { apiGet } from "@/lib/api";
import type { Advertisement, Category } from "@/types";
import type { Product } from "@/types/farm";

function asArray<T>(data: T[] | { items?: T[] } | null | undefined): T[] {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  return data.items ?? [];
}

export async function getCategories() {
  const data = await apiGet<Category[]>("/api/categories");
  return Array.isArray(data) ? data : [];
}

export async function getAppAds() {
  const data = await apiGet<Advertisement[]>("/api/advertisement/app?enabledOnly=true", {
    headers: { "X-Platform": "web" },
  } as never);
  return Array.isArray(data) ? data : [];
}

export async function getBottomAds() {
  const data = await apiGet<Advertisement[]>(
    "/api/advertisement/app/bottom?enabledOnly=true",
    { headers: { "X-Platform": "web" } } as never,
  );
  return Array.isArray(data) ? data : [];
}

export async function getProducts() {
  const data = await apiGet<Product[] | { items?: Product[] }>("/api/products");
  return asArray(data);
}

export async function trackAdView(id: number) {
  return apiGet(`/api/advertisement/${id}/view`, { method: "POST" } as never).catch(
    () => null,
  );
}
