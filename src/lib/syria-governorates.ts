/** إحداثيات تقريبية لمراكز المحافظات السورية */
export interface GovernorateCoords {
  id?: number;
  lat: number;
  lng: number;
  nameAr: string;
  aliases: string[];
}

export const SYRIA_GOVERNORATES: GovernorateCoords[] = [
  { id: 1, lat: 33.5138, lng: 36.2765, nameAr: "دمشق", aliases: ["damascus", "دمشق"] },
  { id: 2, lat: 33.45, lng: 36.85, nameAr: "ريف دمشق", aliases: ["rif dimashq", "ريف دمشق", "الريف"] },
  { id: 3, lat: 36.2021, lng: 37.1343, nameAr: "حلب", aliases: ["aleppo", "حلب"] },
  { id: 4, lat: 34.7244, lng: 36.7138, nameAr: "حمص", aliases: ["homs", "حمص"] },
  { id: 5, lat: 35.1318, lng: 36.7577, nameAr: "حماة", aliases: ["hama", "حماة"] },
  { id: 6, lat: 35.5317, lng: 35.7918, nameAr: "اللاذقية", aliases: ["latakia", "lattakia", "اللاذقية"] },
  { id: 7, lat: 34.8833, lng: 35.8833, nameAr: "طرطوس", aliases: ["tartus", "طرطوس"] },
  { id: 8, lat: 35.9306, lng: 36.6339, nameAr: "إدلب", aliases: ["idlib", "إدلب"] },
  { id: 9, lat: 35.9594, lng: 39.0023, nameAr: "الرقة", aliases: ["raqqa", "الرقة"] },
  { id: 10, lat: 35.3359, lng: 40.1408, nameAr: "دير الزور", aliases: ["deir ez-zor", "deir al-zor", "دير الزور"] },
  { id: 11, lat: 36.5073, lng: 40.7477, nameAr: "الحسكة", aliases: ["hasakah", "al-hasakah", "الحسكة"] },
  { id: 12, lat: 32.6189, lng: 36.1021, nameAr: "درعا", aliases: ["daraa", "درعا"] },
  { id: 13, lat: 32.7094, lng: 36.5695, nameAr: "السويداء", aliases: ["suwayda", "as-suwayda", "السويداء"] },
  { id: 14, lat: 33.126, lng: 35.8245, nameAr: "القنيطرة", aliases: ["quneitra", "القنيطرة"] },
];

const SYRIA_CENTER = { lat: 34.8021, lng: 38.9968 };
const DEFAULT_ZOOM = 7;

/** حدود عرض الخريطة — الإبقاء على سوريا فقط */
export const SYRIA_MAP_BOUNDS: [[number, number], [number, number]] = [
  [32.2, 35.5],
  [37.4, 42.5],
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
    const byId = SYRIA_GOVERNORATES.find((g) => g.id === governorateId);
    if (byId) return byId;
  }
  const key = normalizeKey(name);
  if (!key) return null;
  return (
    SYRIA_GOVERNORATES.find(
      (g) =>
        normalizeKey(g.nameAr) === key ||
        g.aliases.some((a) => normalizeKey(a) === key || key.includes(normalizeKey(a))),
    ) ?? null
  );
}

export function getSyriaMapDefaults() {
  return { center: SYRIA_CENTER, zoom: DEFAULT_ZOOM };
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

    let entry = id != null ? SYRIA_GOVERNORATES.find((g) => g.id === id) : undefined;
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

/** دمج بيانات الحجم مع كل محافظات سوريا لعرض خريطة كاملة */
export function mergeGovernorateMapPoints(volumePoints: MapVolumePoint[]): MapVolumePoint[] {
  const byId = new Map<number, MapVolumePoint>();
  for (const p of volumePoints) {
    if (p.governorateId != null) byId.set(p.governorateId, p);
  }
  return SYRIA_GOVERNORATES.filter((g) => g.id != null).map((g) => {
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
