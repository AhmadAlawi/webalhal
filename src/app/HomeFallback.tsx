"use client";

import { BannerCarousel } from "@/components/home/BannerCarousel";
import { useI18n } from "@/context/I18nContext";

export function HomeFallback() {
  const { t } = useI18n();

  return (
    <>
      <BannerCarousel ads={[]} loading />
      <div className="mx-auto max-w-7xl px-4 py-16 text-center text-slate-500">
        {t("home.loading")}
      </div>
    </>
  );
}
