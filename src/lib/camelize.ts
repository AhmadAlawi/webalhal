/**
 * Deep camel-case object keys returned by the API.
 *
 * The .NET backend serializes every response in PascalCase (AuctionId,
 * TenderId, NameAr, IsActive, Items, ...) while this frontend is written
 * against camelCase. Running each response through this once, in the API
 * client, keeps the two in sync so pages/components don't each need their
 * own dual-casing normalizer.
 *
 * Only the first character of a PascalCase key is lowered (AuctionId ->
 * auctionId). camelCase / lowercase keys pass through untouched, and if both
 * casings are present on one object the original key is kept so nothing is
 * lost. Values (enum strings, dates, numbers) are never modified.
 */
export function camelizeKeysDeep<T = unknown>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((v) => camelizeKeysDeep(v)) as unknown as T;
  }
  if (value && typeof value === "object") {
    // Leave class instances (Date, etc.) alone.
    const proto = Object.getPrototypeOf(value);
    if (proto !== null && proto !== Object.prototype) return value;

    const out: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      const camel = /^[A-Z]/.test(key)
        ? key.charAt(0).toLowerCase() + key.slice(1)
        : key;
      const target =
        camel !== key && camel in (value as Record<string, unknown>) ? key : camel;
      out[target] = camelizeKeysDeep(val);
    }
    return out as T;
  }
  return value;
}

export default camelizeKeysDeep;
