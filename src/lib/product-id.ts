export const OLD_TO_CURRENT_PRODUCT_ID: Record<number, number> = {
  1: 304, 2: 370, 3: 366, 4: 384, 5: 382, 6: 285, 7: 284, 8: 299,
  9: 385, 10: 381, 11: 288, 12: 301, 13: 376, 14: 295, 15: 368,
  16: 357, 17: 417, 18: 334, 19: 378, 20: 363, 21: 374, 22: 291,
  23: 390, 24: 413, 25: 415, 26: 327, 27: 286, 28: 395, 29: 351,
  30: 332, 31: 334, 32: 305, 33: 322, 34: 317, 35: 315, 36: 327,
  37: 319, 38: 312, 39: 324, 40: 309, 41: 335, 42: 412, 43: 340,
  44: 314, 45: 416, 46: 340, 47: 396, 48: 420, 49: 395, 50: 324,
  51: 341, 52: 319, 53: 322, 54: 337, 55: 335, 56: 339,
};

export type ProductSelectValue = number | "";

export function normalizeProductId(productId: number): number;
export function normalizeProductId(productId: ""): "";
export function normalizeProductId(productId: ProductSelectValue): ProductSelectValue;
export function normalizeProductId(productId: ProductSelectValue): ProductSelectValue {
  if (productId === "") return "";
  return OLD_TO_CURRENT_PRODUCT_ID[productId] ?? productId;
}

export function dedupeProductsByProductId<T extends { productId: number }>(products: T[]): T[] {
  const seen = new Set<number>();
  return products.filter((product) => {
    if (seen.has(product.productId)) return false;
    seen.add(product.productId);
    return true;
  });
}
