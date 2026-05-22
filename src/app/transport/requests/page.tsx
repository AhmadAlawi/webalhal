"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageContainer } from "@/components/layout/PageContainer";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { getBuyerRequests } from "@/services/transport";
import { useAuth } from "@/context/AuthContext";
import type { TransportRequest } from "@/types";
import { Truck } from "lucide-react";

export default function TransportRequestsPage() {
  const { requireAuth } = useAuth();
  const [requests, setRequests] = useState<TransportRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!requireAuth()) return;
    getBuyerRequests()
      .then(setRequests)
      .catch(() => setRequests([]))
      .finally(() => setLoading(false));
  }, [requireAuth]);

  return (
    <>
      <PageHeader title="طلبات النقل" backHref="/account" />
      <PageContainer className="py-8">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-24 skeleton-shimmer rounded-2xl" />
            ))}
          </div>
        ) : requests.length === 0 ? (
          <EmptyState
            icon={Truck}
            title="لا توجد طلبات نقل"
            description="بعد إتمام صفقة، عيّن ناقلاً من محادثة الصفقة"
          />
        ) : (
          <ul className="space-y-3">
            {requests.map((r) => (
              <li key={r.requestId}>
                <Link
                  href={`/transport/requests/${r.requestId}`}
                  className="block rounded-2xl border border-gray-100 bg-white p-4 shadow-sm hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-slate-900">
                        {r.productType || "طلب نقل"}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        {r.fromRegion} → {r.toRegion}
                      </p>
                    </div>
                    <StatusBadge status={r.status} />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </PageContainer>
    </>
  );
}
