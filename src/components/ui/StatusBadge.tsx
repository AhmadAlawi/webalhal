import { clsx } from "clsx";
import { translateStatus } from "@/lib/status-labels";

const STATUS_STYLES: Record<string, string> = {
  open: "bg-blue-50 text-blue-700",
  active: "bg-blue-50 text-blue-700",
  live: "bg-blue-50 text-blue-700",
  running: "bg-blue-50 text-blue-700",
  closed: "bg-slate-100 text-slate-600",
  negotiating: "bg-amber-50 text-amber-800",
  assigned: "bg-emerald-50 text-emerald-700",
  completed: "bg-slate-100 text-slate-600",
  cancelled: "bg-red-50 text-red-700",
  canceled: "bg-red-50 text-red-700",
  pending: "bg-amber-50 text-amber-800",
  accepted: "bg-emerald-50 text-emerald-700",
  rejected: "bg-red-50 text-red-700",
  sold: "bg-slate-100 text-slate-600",
  listed: "bg-emerald-50 text-emerald-700",
  unavailable: "bg-slate-100 text-slate-500",
};

export function StatusBadge({ status }: { status?: string }) {
  if (!status) return null;
  const key = status.toLowerCase().replace(/[\s_-]/g, "");
  return (
    <span
      className={clsx(
        "inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold",
        STATUS_STYLES[key] ?? "bg-slate-100 text-slate-600",
      )}
    >
      {translateStatus(status) ?? status}
    </span>
  );
}
