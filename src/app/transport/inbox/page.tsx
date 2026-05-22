"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import { Settings } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageContainer } from "@/components/layout/PageContainer";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { getNotifiedRequests, getAssignedRequests } from "@/services/transport";
import { useAuth } from "@/context/AuthContext";

export default function TransportInboxPage() {
  const { isAuthenticated, requireAuth } = useAuth();
  const [tab, setTab] = useState<"notified" | "assigned">("notified");

  useEffect(() => {
    requireAuth();
  }, [requireAuth]);

  const { data: items = [], isLoading } = useSWR(
    isAuthenticated ? `transport:inbox:${tab}` : null,
    () => (tab === "notified" ? getNotifiedRequests() : getAssignedRequests()),
    { refreshInterval: 45_000, revalidateOnFocus: true },
  );

  return (
    <>
      <PageHeader title="طلبات النقل" backHref="/" />
      <PageContainer className="py-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <nav className="flex gap-2">
            <button
              type="button"
              onClick={() => setTab("notified")}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                tab === "notified" ? "bg-emerald-600 text-white" : "border bg-white"
              }`}
            >
              الوارد
            </button>
            <button
              type="button"
              onClick={() => setTab("assigned")}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                tab === "assigned" ? "bg-emerald-600 text-white" : "border bg-white"
              }`}
            >
              المعيّن لي
            </button>
          </nav>
          <Link
            href="/transport/manage"
            className="inline-flex items-center gap-1 text-sm font-medium text-emerald-600 hover:underline"
          >
            <Settings className="h-4 w-4" />
            خطوط الأسعار
          </Link>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
          </div>
        ) : (
          <ul className="divide-y divide-gray-100 overflow-hidden rounded-2xl border border-gray-200 bg-white">
            {items.map((r) => (
              <li key={r.requestId}>
                <Link
                  href={`/transport/inbox/${r.requestId}`}
                  className="flex items-center justify-between px-6 py-4 hover:bg-slate-50"
                >
                  <span>
                    <p className="font-medium text-slate-900">
                      طلب #{r.requestId} — {r.productType || r.orderType}
                    </p>
                    <p className="text-sm text-slate-500">
                      {r.fromRegion} → {r.toRegion}
                    </p>
                  </span>
                  <StatusBadge status={r.status} />
                </Link>
              </li>
            ))}
            {items.length === 0 && (
              <li className="py-16 text-center text-slate-500">لا توجد طلبات</li>
            )}
          </ul>
        )}
      </PageContainer>
    </>
  );
}
