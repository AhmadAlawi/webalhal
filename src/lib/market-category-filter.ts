import type { Auction, MarketplaceListing, Tender } from "@/types";
import type { MarketAnalysisProductFilter } from "@/types/market-analysis";

type MarketItem = Auction | Tender | MarketplaceListing;

const CATEGORY_ID_KEYS = [
  "categoryId",
  "CategoryId",
  "productCategoryId",
  "ProductCategoryId",
] as const;

const PRODUCT_ID_KEYS = [
  "productId",
  "ProductId",
  "cropProductId",
  "CropProductId",
] as const;

const CROP_ID_KEYS = ["cropId", "CropId"] as const;

const TEXT_KEYS = [
  "title",
  "Title",
  "auctionTitle",
  "AuctionTitle",
  "auctionDescription",
  "AuctionDescription",
  "description",
  "Description",
  "cropName",
  "CropName",
  "productName",
  "ProductName",
  "productNameAr",
  "ProductNameAr",
  "productNameEn",
  "ProductNameEn",
  "categoryNameAr",
  "CategoryNameAr",
  "categoryNameEn",
  "CategoryNameEn",
  "category",
  "Category",
] as const;

function normalizeText(value: unknown): string {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function asRecord(item: MarketItem): Record<string, unknown> {
  return item as unknown as Record<string, unknown>;
}

function pickNumber(
  row: Record<string, unknown>,
  keys: readonly string[],
): number | undefined {
  for (const key of keys) {
    const value = Number(row[key]);
    if (Number.isFinite(value) && value > 0) return value;
  }
  return undefined;
}

function buildProductIdSet(products: MarketAnalysisProductFilter[]) {
  const ids = new Set<number>();
  for (const product of products) {
    const id = Number(product.productId);
    if (Number.isFinite(id) && id > 0) ids.add(id);
  }
  return ids;
}

function buildNameTokens(
  products: MarketAnalysisProductFilter[],
  categoryKeywords: string[] = [],
) {
  const tokens = new Set<string>();
  const add = (value?: string | null) => {
    const token = normalizeText(value);
    if (token.length >= 2) tokens.add(token);
  };

  for (const product of products) {
    add(product.name);
    add(product.nameAr);
    add(product.nameEn);
    add(product.category);
    add(product.categoryNameAr);
    add(product.categoryNameEn);
  }
  for (const keyword of categoryKeywords) add(keyword);

  return Array.from(tokens);
}

function hasTextToken(row: Record<string, unknown>, nameTokens: string[]) {
  if (!nameTokens.length) return false;
  const haystacks = TEXT_KEYS.map((key) => normalizeText(row[key])).filter(Boolean);
  return nameTokens.some((token) =>
    haystacks.some((text) => text.includes(token)),
  );
}

export function filterMarketItemsByCategory<T extends MarketItem>(
  items: T[],
  categoryId?: number,
  products: MarketAnalysisProductFilter[] = [],
  categoryKeywords: string[] = [],
): T[] {
  if (!categoryId) return items;

  const productIds = buildProductIdSet(products);
  const nameTokens = buildNameTokens(products, categoryKeywords);
  const hasDirectCategoryIds = items.some((item) =>
    Boolean(pickNumber(asRecord(item), CATEGORY_ID_KEYS)),
  );
  const hasProductIds =
    productIds.size > 0 &&
    items.some((item) => Boolean(pickNumber(asRecord(item), PRODUCT_ID_KEYS)));

  if (!hasDirectCategoryIds && !hasProductIds && nameTokens.length === 0) {
    return items;
  }

  return items.filter((item) => {
    const row = asRecord(item);
    const itemCategoryId = pickNumber(row, CATEGORY_ID_KEYS);
    if (itemCategoryId === categoryId) return true;

    const productId = pickNumber(row, PRODUCT_ID_KEYS);
    if (productId && productIds.has(productId)) return true;

    const cropId = pickNumber(row, CROP_ID_KEYS);
    if (cropId && productIds.has(cropId)) return true;

    return hasTextToken(row, nameTokens);
  });
}
