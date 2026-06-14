export const CROP_UNIT_OPTIONS = [
  { value: "كغ", key: "forms.units.kg" },
  { value: "طن", key: "forms.units.ton" },
  { value: "صندوق", key: "forms.units.box" },
  { value: "كيس", key: "forms.units.bag" },
  { value: "لتر", key: "forms.units.liter" },
  { value: "حزمة", key: "forms.units.bundle" },
] as const;

type TranslateFn = (key: string, fallback?: string) => string;

export function getCropUnitOptions(t: TranslateFn, current?: string | null) {
  const options = CROP_UNIT_OPTIONS.map(({ value, key }) => ({
    value,
    label: t(key),
  }));

  const trimmed = current?.trim();
  if (!trimmed) return options;
  if (CROP_UNIT_OPTIONS.some((o) => o.value === trimmed)) return options;
  return [{ value: trimmed, label: trimmed }, ...options];
}
