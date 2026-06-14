"use client";

import { Languages } from "lucide-react";
import { useI18n } from "@/context/I18nContext";

export function LanguageSwitcher({ className = "" }: { className?: string }) {
  const { language, toggleLanguage, t } = useI18n();
  const nextLabel = language === "ar" ? t("language.switchToEnglish") : t("language.switchToArabic");

  return (
    <button
      type="button"
      onClick={toggleLanguage}
      className={`inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-600 transition-colors hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 ${className}`}
      aria-label={nextLabel}
      title={nextLabel}
    >
      <Languages className="h-4 w-4" />
      <span>{language === "ar" ? t("language.shortEn") : t("language.shortAr")}</span>
    </button>
  );
}
