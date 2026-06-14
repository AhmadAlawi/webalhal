"use client";

import Link from "next/link";
import { BarChart2 } from "lucide-react";
import { MarketAnalysisWidget } from "@/components/home/MarketAnalysisWidget";
import { PageContainer } from "@/components/layout/PageContainer";

export default function MarketAnalysisPage() {
  return (
    <>
      <MarketAnalysisWidget />
      <section className="bg-[#F7F8FB] pb-10">
        <PageContainer>
          <div className="mx-auto max-w-[680px]">
            <Link
              href="/market-analysis/overview"
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-[#D7D9E2] bg-white px-6 py-4 text-base font-bold text-[#00066D] shadow-[0_10px_26px_rgba(0,6,109,0.06)] transition hover:border-[#00066D]/30 hover:bg-[#F4F5FF]"
            >
              <BarChart2 className="h-5 w-5" />
              التحليلات التفصيلية والخرائط
            </Link>
          </div>
        </PageContainer>
      </section>
    </>
  );
}
