/** معاملات مشتركة لقوائم المزادات / المناقصات / البيع المباشر */
export function buildMarketListParams(
  searchQuery?: string,
  categoryId?: number,
  extra?: Record<string, string | number | undefined>,
): Record<string, string> {
  const params: Record<string, string> = {};

  if (searchQuery?.trim()) params.searchTerm = searchQuery.trim();
  if (categoryId != null) params.categoryId = String(categoryId);

  for (const [k, v] of Object.entries(extra ?? {})) {
    if (v != null && v !== "") params[k] = String(v);
  }

  return params;
}
