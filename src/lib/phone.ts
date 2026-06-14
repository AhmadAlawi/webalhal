/** تنسيق رقم الهاتف لـ API التسجيل والدخول (الأردن) */
export function normalizePhoneForApi(phone: string): string {
  let p = phone.trim().replace(/[\s-]/g, "");
  if (!p) return p;
  if (p.startsWith("00")) p = `+${p.slice(2)}`;
  if (/^07\d{8}$/.test(p)) p = `+962${p.slice(1)}`;
  if (/^7\d{8}$/.test(p)) p = `+962${p}`;
  if (/^962\d{8,9}$/.test(p) && !p.startsWith("+")) p = `+${p}`;
  return p;
}
