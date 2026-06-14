"use client";

import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageContainer } from "@/components/layout/PageContainer";
import { RizqLogo } from "@/components/brand/RizqLogo";
import { useI18n } from "@/context/I18nContext";

export default function AboutPage() {
  const { t } = useI18n();

  return (
    <>
      <PageHeader title={t("about.title")} backHref="/account" />
      <PageContainer narrow className="py-8">
        <article className="prose prose-slate max-w-none rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
          <div className="not-prose mb-8 flex flex-col items-center text-center">
            <RizqLogo size="xl" href={null} className="flex-col gap-4" />
          </div>
          <h2 className="text-xl font-bold text-emerald-800">{t("about.heading")}</h2>
          <p className="mt-4 text-slate-600 leading-relaxed">{t("about.description")}</p>
          <ul className="mt-6 list-disc space-y-2 ps-6 text-slate-600">
            <li>{t("about.featureLiveAuctions")}</li>
            <li>{t("about.featureTenders")}</li>
            <li>{t("about.featureDirect")}</li>
            <li>{t("about.featureTransport")}</li>
            <li>{t("about.featureChat")}</li>
          </ul>
          <p className="mt-8 text-sm text-slate-500">
            {t("about.supportPrefix")}{" "}
            <Link href="/tickets" className="text-emerald-600 hover:underline">
              {t("about.supportLink")}
            </Link>
          </p>
        </article>
      </PageContainer>
    </>
  );
}
