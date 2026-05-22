/** حالة فلاتر قوائم السوق (مزادات / مناقصات / بيع مباشر) */
export interface MarketListFilterState {
  categoryId?: number;
  minPrice?: string;
  maxPrice?: string;
  startTimeFrom?: string;
  endTimeTo?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  page?: number;
  pageSize?: number;
}

export const DEFAULT_PAGE_SIZE = 24;

export function filtersToQueryParams(
  filters: MarketListFilterState,
  kind: "auctions" | "tenders" | "direct",
): Record<string, string> {
  const extra: Record<string, string> = {};

  if (filters.categoryId != null) {
    extra.categoryId = String(filters.categoryId);
  }
  if (filters.minPrice?.trim()) {
    const key = kind === "auctions" ? "minStartingPrice" : "minPrice";
    extra[key] = filters.minPrice.trim();
  }
  if (filters.maxPrice?.trim()) {
    const key = kind === "auctions" ? "maxStartingPrice" : "maxPrice";
    extra[key] = filters.maxPrice.trim();
  }
  if (filters.startTimeFrom) extra.startTimeFrom = filters.startTimeFrom;
  if (filters.endTimeTo) extra.endTimeTo = filters.endTimeTo;
  if (filters.sortBy) extra.sortBy = filters.sortBy;
  if (filters.sortOrder) extra.sortOrder = filters.sortOrder;
  if (filters.page != null && filters.page > 0) extra.page = String(filters.page);
  if (filters.pageSize != null && filters.pageSize > 0) {
    extra.pageSize = String(filters.pageSize);
  }

  return extra;
}
