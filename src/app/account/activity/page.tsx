"use client";

import { Suspense } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageContainer } from "@/components/layout/PageContainer";
import { useI18n } from "@/context/I18nContext";
import { MyActivityContent } from "./MyActivityContent";

export default function MyActivityPage() {
  const { t } = useI18n();

  return (
    <>
      <PageHeader title={t("account.activity")} backHref="/account" />
      <PageContainer className="py-8">
        <Suspense
          fallback={
            <div className="flex justify-center py-16">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
            </div>
          }
        >
          <MyActivityContent />
        </Suspense>
      </PageContainer>
    </>
  );
}
