"use client";

import { PageHeader } from "@/components/ui/PageHeader";
import { BuyerTransportRequestsContent } from "./BuyerTransportRequestsContent";

export default function AccountTransportRequestsPage() {
  return (
    <>
      <PageHeader title="طلبات النقل — مشتري" backHref="/account" />
      <BuyerTransportRequestsContent />
    </>
  );
}
