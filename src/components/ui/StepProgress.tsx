const LABELS = ["البداية", "الحساب", "التحقق", "الدور", "الملف", "الدفع"];

export function StepProgress({ step }: { step: number }) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between gap-1">
        {LABELS.map((label, i) => (
          <div key={label} className="flex flex-1 flex-col items-center gap-1">
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
              {label}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-gradient-to-l from-emerald-500 to-emerald-600 transition-all duration-300"
          style={{ width: `${((step + 1) / LABELS.length) * 100}%` }}
        />
      </div>
    </div>
  );
}
