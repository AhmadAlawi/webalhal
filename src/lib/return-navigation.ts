/** بعد إنشاء مورد، العودة للصفحة السابقة مع معرفات للاختيار التلقائي */
export function navigateAfterCreate(
  router: { push: (href: string) => void },
  returnTo: string | null | undefined,
  params: Record<string, string | number | undefined>,
  fallback: string,
) {
  if (returnTo && returnTo.startsWith("/")) {
    const q = new URLSearchParams();
    for (const [key, val] of Object.entries(params)) {
      if (val != null && val !== "") q.set(key, String(val));
    }
    const qs = q.toString();
    router.push(qs ? `${returnTo}?${qs}` : returnTo);
    return;
  }
  router.push(fallback);
}

export function parseEntityId(
  res: unknown,
  ...keys: string[]
): number | undefined {
  if (!res || typeof res !== "object") return undefined;
  const r = res as Record<string, unknown>;
  const inner = (r.data as Record<string, unknown>) ?? r;
  for (const key of keys) {
    const n = Number(inner[key]);
    if (Number.isFinite(n) && n > 0) return n;
  }
  return undefined;
}
