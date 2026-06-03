export const CROP_UNIT_OPTIONS = [
  { value: "كغ", label: "كيلوغرام (كغ)" },
  { value: "طن", label: "طن" },
  { value: "صندوق", label: "صندوق" },
  { value: "كيس", label: "كيس" },
  { value: "لتر", label: "لتر" },
  { value: "حزمة", label: "حزمة" },
] as const;

export function cropUnitOptions(current?: string | null) {
  const trimmed = current?.trim();
  if (!trimmed) return [...CROP_UNIT_OPTIONS];
  if (CROP_UNIT_OPTIONS.some((o) => o.value === trimmed)) return [...CROP_UNIT_OPTIONS];
  return [{ value: trimmed, label: trimmed }, ...CROP_UNIT_OPTIONS];
}
