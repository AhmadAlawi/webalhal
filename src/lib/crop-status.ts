import type { Crop } from "@/types/farm";

const BLOCKED_KEYS = new Set([
  "sold",
  "listed",
  "inauction",
  "inauctionactive",
  "auctioned",
  "directlisted",
  "unavailable",
  "consumed",
  "reserved",
  "closed",
]);

export function normalizeCropStatusKey(status?: string | null): string {
  return (status ?? "").toLowerCase().replace(/[\s_-]/g, "");
}

/** محصول متاح للمزاد أو البيع المباشر */
export function isCropSelectable(crop: Pick<Crop, "status">): boolean {
  const key = normalizeCropStatusKey(crop.status);
  if (!key || key === "available" || key === "active") return true;
  if (BLOCKED_KEYS.has(key)) return false;
  for (const blocked of BLOCKED_KEYS) {
    if (key.includes(blocked)) return false;
  }
  return true;
}

export function cropStatusLabel(status?: string | null): string | null {
  const key = normalizeCropStatusKey(status);
  if (!key || key === "available" || key === "active") return null;
  const labels: Record<string, string> = {
    sold: "مُباع",
    listed: "معروض للبيع",
    inauction: "في مزاد",
    inauctionactive: "في مزاد",
    auctioned: "في مزاد",
    directlisted: "بيع مباشر",
    unavailable: "غير متاح",
    reserved: "محجوز",
    closed: "مغلق",
  };
  return labels[key] ?? status ?? null;
}
