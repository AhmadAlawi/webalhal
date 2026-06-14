"use client";

import { PageHeader } from "@/components/ui/PageHeader";
import { BuyerTransportRequestsContent } from "@/app/account/transport-requests/BuyerTransportRequestsContent";
import { useI18n } from "@/context/I18nContext";

/** @deprecated استخدم /account/transport-requests — يُبقى للروابط القديمة */
export default function TransportRequestsPage() {
  const { t } = useI18n();

  return (
    <>
      <PageHeader title={t("transport.requests.title")} backHref="/account" />
      <BuyerTransportRequestsContent />
    </>
  );
}
