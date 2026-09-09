"use client";

import { useI18n } from "@/context/I18nContext";

const LABEL_KEYS = [
  "stepProgress.start",
  "stepProgress.account",
  "stepProgress.verification",
  "stepProgress.role",
  "stepProgress.profile",
  "stepProgress.payout",
];

export function StepProgress({ step }: { step: number }) {
  const { t } = useI18n();

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between gap-1">
        {LABEL_KEYS.map((labelKey, i) => (
          <div key={labelKey} className="flex flex-1 flex-col items-center gap-1">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                i <= step
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "bg-slate-100 text-slate-400"
              }`}
            >
              {i + 1}
            </div>
            <span
              className={`hidden text-[10px] font-medium sm:block ${
                i <= step ? "text-emerald-700" : "text-slate-400"
              }`}
            >
              {t(labelKey)}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-gradient-to-l from-emerald-500 to-emerald-600 transition-all duration-300"
          style={{ width: `${((step + 1) / LABEL_KEYS.length) * 100}%` }}
        />
      </div>
    </div>
  );
}
