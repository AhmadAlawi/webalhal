"use client";

import { Truck, Warehouse, Sprout, Shield } from "lucide-react";
import { PageContainer } from "@/components/layout/PageContainer";

const SERVICES = [
  { icon: Truck, title: "توصيل سريع", desc: "نقل آمن للمحاصيل عبر شبكة ناقلين معتمدين" },
  { icon: Warehouse, title: "تخزين", desc: "مستودعات وسلاسل تبريد للحفاظ على الجودة" },
  { icon: Sprout, title: "بذور ومدخلات", desc: "توريد موثوق للمدخلات الزراعية" },
  { icon: Shield, title: "ضمان الجودة", desc: "معايير فحص وشفافية في كل صفقة" },
];

export function ServicesSection() {
  return (
    <section className="border-y border-[#D7D9E2] bg-white py-14 lg:py-16">
      <PageContainer>
        <p className="section-eyebrow mb-2 text-center lg:text-start">لماذا بركة؟</p>
        <h2 className="mb-10 text-center text-2xl font-bold text-[#00066D] lg:text-start">
          منصة متكاملة للسوق الزراعي
        </h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {SERVICES.map((s) => (
            <article
              key={s.title}
              className="card card-hover group p-6"
            >
              <span className="mb-4 inline-flex rounded-xl bg-[#FFF3DC] p-3 transition-colors group-hover:bg-[#FFE2AD]">
                <s.icon className="h-7 w-7 text-[#FF9900]" />
              </span>
              <h3 className="font-semibold text-[#00066D]">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[#777B8F]">{s.desc}</p>
            </article>
          ))}
        </div>
      </PageContainer>
    </section>
  );
}
