import type { ApiError } from "@/types";

/** رسالة عربية من خطأ API (تحقق، تفاصيل، حقول) */
export function formatApiErrorMessage(
  detail?: string,
  errors?: ApiError["errors"],
): string {
  if (errors && typeof errors === "object") {
    const parts: string[] = [];
    for (const [field, msgs] of Object.entries(errors)) {
      const list = Array.isArray(msgs) ? msgs : [String(msgs)];
      const label = fieldLabelsAr[field] ?? field;
      for (const m of list) {
        if (m) parts.push(`${label}: ${m}`);
      }
    }
    if (parts.length) return parts.join(" — ");
  }

  const d = (detail ?? "").trim();
  if (!d || d === "One or more validation errors occurred") {
    return "بيانات غير صالحة — راجع الحقول المطلوبة";
  }
  if (d.includes("validation")) {
    return "بيانات غير صالحة — راجع الحقول المطلوبة";
  }
  return d;
}

const fieldLabelsAr: Record<string, string> = {
  title: "العنوان",
  cropName: "اسم المحصول",
  deliveryLocation: "موقع التسليم",
  deliveryFrom: "التسليم من",
  deliveryTo: "التسليم إلى",
  startTime: "بداية المناقصة",
  endTime: "نهاية المناقصة",
  productId: "المنتج",
  quantity: "الكمية",
  area: "المقاطعة",
  areaId: "المقاطعة",
  dto: "البيانات",
};
