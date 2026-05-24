import { clsx } from "clsx";

const STATUS_STYLES: Record<string, string> = {
  open: "bg-blue-50 text-blue-700",
  closed: "bg-slate-100 text-slate-600",
  negotiating: "bg-amber-50 text-amber-800",
  assigned: "bg-emerald-50 text-emerald-700",
  completed: "bg-slate-100 text-slate-600",
  cancelled: "bg-red-50 text-red-700",
  pending: "bg-amber-50 text-amber-800",
  accepted: "bg-emerald-50 text-emerald-700",
  rejected: "bg-red-50 text-red-700",
};

const STATUS_AR: Record<string, string> = {
  open: "مفتوح",
  closed: "مغلق",
  negotiating: "تفاوض",
  assigned: "مُعيَّن",
  completed: "مكتمل",
  cancelled: "ملغى",
  pending: "قيد المراجعة",
  accepted: "مقبول",
  rejected: "مرفوض",
};

export function StatusBadge({ status }: { status?: string }) {
  if (!status) return null;
  const key = status.toLowerCase();
  return (
    <span
      className={clsx(
        "inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold",
        STATUS_STYLES[key] ?? "bg-slate-100 text-slate-600",
      )}
    >
      {STATUS_AR[key] ?? status}
    </span>
  );
}
