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
  if (/an error occurred while processing your request/i.test(d)) {
    return "حدث خطأ في الخادم — تحقق من البيانات وحاول مجدداً";
  }
  if (/invalid credentials|wrong password|incorrect password/i.test(d)) {
    return "كلمة المرور غير صحيحة";
  }
  if (/user not found|email not found/i.test(d)) {
    return "البريد أو الهاتف غير مسجّل";
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
  governorateId: "المحافظة",
  cityId: "المدينة",
  areaId: "المقاطعة",
  phone: "الهاتف",
  password: "كلمة المرور",
  email: "البريد",
  fullName: "الاسم",
  dto: "البيانات",
};
