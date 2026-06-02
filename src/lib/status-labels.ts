/** ترجمة حالات العرض الموحدة (مزاد، مناقصة، بيع مباشر، طلب، نقل) */

const STATUS_AR: Record<string, string> = {
  open: "مفتوح",
  active: "نشط",
  live: "جارٍ",
  running: "جارٍ",
  closed: "مغلق",
  completed: "مكتمل",
  cancelled: "ملغى",
  canceled: "ملغى",
  pending: "قيد المراجعة",
  negotiating: "تفاوض",
  assigned: "مُعيَّن",
  accepted: "مقبول",
  rejected: "مرفوض",
  sold: "مُباع",
  listed: "معروض",
  inauction: "في مزاد",
  inauctionactive: "في مزاد",
  directlisted: "بيع مباشر",
  unavailable: "غير متاح",
  reserved: "محجوز",
  draft: "مسودة",
  expired: "منتهي",
  awarded: "مُرسى",
  finished: "منتهٍ",
};

export function translateStatus(status?: string | null): string | null {
  if (!status?.trim()) return null;
  const key = status.toLowerCase().replace(/[\s_-]/g, "");
  return STATUS_AR[key] ?? status;
}

export function statusMetaLine(...parts: (string | null | undefined)[]): string {
  return parts
    .map((p) => (typeof p === "string" && !p.match(/^(open|active|closed|pending)$/i) ? p : translateStatus(p)))
    .filter(Boolean)
    .join(" · ");
}
