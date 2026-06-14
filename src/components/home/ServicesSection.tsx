"use client";

import { Truck, Warehouse, Sprout, Shield } from "lucide-react";
import { PageContainer } from "@/components/layout/PageContainer";
import { useI18n } from "@/context/I18nContext";

const SERVICES = [
  { icon: Truck, titleKey: "home.services.delivery.title", descKey: "home.services.delivery.desc" },
  { icon: Warehouse, titleKey: "home.services.storage.title", descKey: "home.services.storage.desc" },
  { icon: Sprout, titleKey: "home.services.seeds.title", descKey: "home.services.seeds.desc" },
  { icon: Shield, titleKey: "home.services.quality.title", descKey: "home.services.quality.desc" },
] as const;

export function ServicesSection() {
  const { t } = useI18n();

  return (
    <section className="border-y border-slate-200/60 bg-white/60 py-14 lg:py-16">
      <PageContainer>
        <p className="section-eyebrow mb-2 text-center lg:text-start">{t("home.services.eyebrow")}</p>
        <h2 className="mb-10 text-center text-2xl font-bold text-slate-900 lg:text-start">
          {t("home.services.title")}
        </h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {SERVICES.map((s) => (
            <article
              key={s.titleKey}
              className="card card-hover group p-6"
            >
              <span className="mb-4 inline-flex rounded-xl bg-emerald-50 p-3 transition-colors group-hover:bg-emerald-100">
                <s.icon className="h-7 w-7 text-emerald-600" />
              </span>
              <h3 className="font-semibold text-slate-900">{t(s.titleKey)}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-500">{t(s.descKey)}</p>
            </article>
          ))}
        </div>
      </PageContainer>
    </section>
  );
}
