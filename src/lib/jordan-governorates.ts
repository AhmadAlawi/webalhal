/** إحداثيات تقريبية لمراكز المحافظات الأردنية */
export interface GovernorateCoords {
  id?: number;
  lat: number;
  lng: number;
  nameAr: string;
  aliases: string[];
}

export const JORDAN_GOVERNORATES: GovernorateCoords[] = [
  { id: 1, lat: 31.9539, lng: 35.9106, nameAr: "عمّان", aliases: ["amman", "عمان", "عمّان"] },
  { id: 2, lat: 32.5556, lng: 35.85, nameAr: "إربد", aliases: ["irbid", "اربد", "إربد"] },
  { id: 3, lat: 32.0833, lng: 36.1, nameAr: "الزرقاء", aliases: ["zarqa", "الزرقاء"] },
  { id: 4, lat: 32.0392, lng: 35.7272, nameAr: "البلقاء", aliases: ["balqa", "salt", "السلط", "البلقاء"] },
  { id: 5, lat: 31.716, lng: 35.793, nameAr: "مادبا", aliases: ["madaba", "مادبا"] },
  { id: 6, lat: 31.185, lng: 35.704, nameAr: "الكرك", aliases: ["karak", "الكرك"] },
  { id: 7, lat: 30.8375, lng: 35.6044, nameAr: "الطفيلة", aliases: ["tafilah", "tafila", "الطفيلة"] },
  { id: 8, lat: 30.196, lng: 35.734, nameAr: "معان", aliases: ["maan", "ma'an", "معان"] },
  { id: 9, lat: 29.532, lng: 35.006, nameAr: "العقبة", aliases: ["aqaba", "العقبة"] },
  { id: 10, lat: 32.276, lng: 35.899, nameAr: "جرش", aliases: ["jerash", "جرش"] },
  { id: 11, lat: 32.333, lng: 35.752, nameAr: "عجلون", aliases: ["ajloun", "ajlun", "عجلون"] },
  { id: 12, lat: 32.3429, lng: 36.208, nameAr: "المفرق", aliases: ["mafraq", "المفرق"] },
];

const JORDAN_CENTER = { lat: 31.2458, lng: 36.5852 };
const DEFAULT_ZOOM = 7;

/** حدود عرض الخريطة حول الأردن */
export const JORDAN_MAP_BOUNDS: [[number, number], [number, number]] = [
  [29.0, 34.7],
  [33.7, 39.5],
];

function normalizeKey(s?: string): string {
  return (s ?? "")
    .trim()
    .toLowerCase()
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/\s+/g, " ");
}

export function resolveGovernorateCoords(
  governorateId?: number,
  name?: string,
): GovernorateCoords | null {
  if (governorateId != null) {
    const byId = JORDAN_GOVERNORATES.find((g) => g.id === governorateId);
    if (byId) return byId;
  }
  const key = normalizeKey(name);
  if (!key) return null;
  return (
    JORDAN_GOVERNORATES.find(
      (g) =>
        normalizeKey(g.nameAr) === key ||
        g.aliases.some((a) => normalizeKey(a) === key || key.includes(normalizeKey(a))),
    ) ?? null
  );
}

export function getJordanMapDefaults() {
  return { center: JORDAN_CENTER, zoom: DEFAULT_ZOOM };
}

export interface MapVolumePoint {
  governorateId?: number;
  name: string;
  lat: number;
  lng: number;
  volume: number;
}

export function registerApiGovernorateNames(
  governorates: { governorateId?: number; id?: number; nameAr?: string; name?: string }[],
): void {
  for (const gov of governorates) {
    const id = gov.governorateId ?? gov.id;
    const name = gov.nameAr ?? gov.name;
    if (!name?.trim()) continue;

    let entry = id != null ? JORDAN_GOVERNORATES.find((g) => g.id === id) : undefined;
    if (!entry) entry = resolveGovernorateCoords(undefined, name) ?? undefined;
    if (!entry) continue;

    if (id != null && entry.id == null) entry.id = id;
    if (!entry.aliases.includes(name)) entry.aliases.push(name);
  }
}

export function toMapVolumePoints(
  items: { governorateId?: number; governorateName?: string; name?: string; totalVolume?: number; value?: number }[],
  apiGovernorates?: { governorateId?: number; id?: number; nameAr?: string; name?: string }[],
): MapVolumePoint[] {
  if (apiGovernorates?.length) registerApiGovernorateNames(apiGovernorates);
  const points: MapVolumePoint[] = [];
  for (const item of items) {
    const name = item.governorateName ?? item.name ?? "";
    const coords = resolveGovernorateCoords(item.governorateId, name);
    if (!coords) continue;
    const volume = item.totalVolume ?? item.value ?? 0;
    if (volume <= 0) continue;
    points.push({
      governorateId: item.governorateId ?? coords.id,
      name: coords.nameAr,
      lat: coords.lat,
      lng: coords.lng,
      volume,
    });
  }
  return points;
}

/** دمج بيانات الحجم مع كل محافظات الأردن لعرض خريطة كاملة */
export function mergeGovernorateMapPoints(volumePoints: MapVolumePoint[]): MapVolumePoint[] {
  const byId = new Map<number, MapVolumePoint>();
  for (const p of volumePoints) {
    if (p.governorateId != null) byId.set(p.governorateId, p);
  }
  return JORDAN_GOVERNORATES.filter((g) => g.id != null).map((g) => {
    const existing = byId.get(g.id!);
    return (
      existing ?? {
        governorateId: g.id,
        name: g.nameAr,
        lat: g.lat,
        lng: g.lng,
        volume: 0,
      }
    );
  });
}
