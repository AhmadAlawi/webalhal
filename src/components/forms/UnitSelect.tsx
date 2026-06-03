"use client";

import { clsx } from "clsx";
import { cropUnitOptions } from "@/lib/crop-units";

export function UnitSelect({
  label = "الوحدة",
  value,
  onChange,
  disabled,
  required,
}: {
  label?: string;
  value: string;
  onChange?: (unit: string) => void;
  disabled?: boolean;
  required?: boolean;
}) {
  const options = cropUnitOptions(value);

  return (
    <div className="w-full">
      {label && (
        <label className="mb-1.5 block text-sm font-medium text-slate-700">{label}</label>
      )}
      <select
        className={clsx(
          "w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-base",
          "focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20",
          disabled && "cursor-not-allowed bg-slate-100 text-slate-600",
        )}
        value={value}
        disabled={disabled}
        required={required}
        onChange={(e) => onChange?.(e.target.value)}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
