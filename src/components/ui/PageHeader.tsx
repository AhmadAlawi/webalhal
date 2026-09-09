"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { PageContainer } from "@/components/layout/PageContainer";
import { useI18n } from "@/context/I18nContext";

export function PageHeader({
  title,
  subtitle,
  backHref,
  actions,
}: {
  title: string;
  subtitle?: string;
  backHref?: string;
  actions?: React.ReactNode;
}) {
  const { isRtl, t } = useI18n();
  const BackIcon = isRtl ? ChevronRight : ChevronLeft;

  return (
    <div className="border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
      <PageContainer className="flex flex-wrap items-center gap-4 py-5 sm:py-6">
        {backHref && (
          <Link
            href={backHref}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-600 transition-colors hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
            aria-label={t("common.back")}
          >
            <BackIcon className="h-5 w-5" />
          </Link>
        )}
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-xl font-bold text-slate-900 sm:text-2xl">{title}</h1>
          {subtitle && <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>}
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </PageContainer>
    </div>
  );
}
