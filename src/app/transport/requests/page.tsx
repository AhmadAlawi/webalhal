"use client";

import { PageHeader } from "@/components/ui/PageHeader";
import { BuyerTransportRequestsContent } from "@/app/account/transport-requests/BuyerTransportRequestsContent";

/** @deprecated استخدم /account/transport-requests — يُبقى للروابط القديمة */
export default function TransportRequestsPage() {
  return (
    <>
      <PageHeader title="طلبات النقل" backHref="/account" />
      <BuyerTransportRequestsContent />
    </>
  );
}
