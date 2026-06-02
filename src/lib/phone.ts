/** تنسيق رقم الهاتف لـ API التسجيل والدخول (سوريا) */
export function normalizePhoneForApi(phone: string): string {
  let p = phone.trim().replace(/[\s-]/g, "");
  if (!p) return p;
  if (p.startsWith("00")) p = `+${p.slice(2)}`;
  if (/^09\d{8}$/.test(p)) p = `+963${p.slice(1)}`;
  if (/^9\d{8}$/.test(p)) p = `+963${p}`;
  if (/^963\d{8,9}$/.test(p) && !p.startsWith("+")) p = `+${p}`;
  return p;
}
