"use client";

import { Moon, Sun } from "lucide-react";
import { useI18n } from "@/context/I18nContext";
import { useTheme } from "@/context/ThemeContext";

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { isDark, toggleTheme } = useTheme();
  const { t } = useI18n();
  const Icon = isDark ? Sun : Moon;
  const label = isDark ? t("theme.enableLight") : t("theme.enableDark");
  const title = isDark ? t("theme.light") : t("theme.dark");

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition-colors hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 ${className}`}
      aria-label={label}
      title={title}
    >
      <Icon className="h-5 w-5" />
    </button>
  );
}
