/** استخراج مصفوفة من استجابات API المتنوعة */
export function asApiList<T = unknown>(payload: unknown): T[] {
  if (payload == null) return [];
  if (Array.isArray(payload)) return payload as T[];

  if (typeof payload !== "object") return [];

  const p = payload as Record<string, unknown>;

  const keys = [
    "items",
    "data",
    "notifications",
    "conversations",
    "summaries",
    "records",
    "results",
    "orders",
  ] as const;

  for (const key of keys) {
    const v = p[key];
    if (Array.isArray(v)) return v as T[];
    if (v && typeof v === "object" && !Array.isArray(v)) {
      const inner = v as Record<string, unknown>;
      if (Array.isArray(inner.items)) return inner.items as T[];
      if (Array.isArray(inner.data)) return inner.data as T[];
    }
  }

  return [];
}
