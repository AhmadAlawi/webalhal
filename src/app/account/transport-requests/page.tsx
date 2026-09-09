"use client";

import { PageHeader } from "@/components/ui/PageHeader";
import { useI18n } from "@/context/I18nContext";
import { BuyerTransportRequestsContent } from "./BuyerTransportRequestsContent";

export default function AccountTransportRequestsPage() {
  const { t } = useI18n();

  return (
    <>
      <PageHeader title={t("account.buyerTransportRequests")} backHref="/account" />
      <BuyerTransportRequestsContent />
    </>
  );
}
