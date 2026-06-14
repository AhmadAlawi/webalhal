import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { PageContainer } from "@/components/layout/PageContainer";

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
  return (
    <div className="border-b border-[#D7D9E2] bg-white/95 backdrop-blur-md">
      <PageContainer className="flex flex-wrap items-center gap-4 py-6 md:py-8">
        {backHref && (
          <Link
            href={backHref}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-[#D7D9E2] bg-[#F7F8FB] text-[#00066D] transition-colors hover:border-[#00066D]/20 hover:bg-[#F4F5FF]"
            aria-label="رجوع"
          >
            <ChevronRight className="h-5 w-5" />
          </Link>
        )}
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-extrabold text-[#00066D] md:text-4xl">{title}</h1>
          {subtitle && <p className="mt-2 text-sm font-semibold text-[#777B8F] md:text-base">{subtitle}</p>}
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </PageContainer>
    </div>
  );
}
