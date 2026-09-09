"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PageContainer } from "@/components/layout/PageContainer";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatCurrency, formatDateAr } from "@/lib/format";
import { getBuyerRequests } from "@/services/transport";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/context/I18nContext";
import { useLocalizedLabel } from "@/hooks/useLocalizedLabel";
import type { LocalizableRecord } from "@/lib/localized-value";
import type { TransportRequest } from "@/types";
import { Truck } from "lucide-react";

const FILTERS: { key: string; labelKey: string }[] = [
  { key: "", labelKey: "common.all" },
  { key: "open", labelKey: "status.open" },
  { key: "negotiating", labelKey: "status.negotiating" },
  { key: "assigned", labelKey: "status.assigned" },
  { key: "completed", labelKey: "status.completed" },
];

export function BuyerTransportRequestsContent() {
  const { requireAuth, isAuthenticated, isLoading: authLoading } = useAuth();
  const { t, language } = useI18n();
  const { localized } = useLocalizedLabel();
  const [requests, setRequests] = useState<TransportRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      requireAuth();
      return;
    }

    setLoading(true);
    setError("");
    getBuyerRequests(1, 50, statusFilter || undefined)
      .then(setRequests)
      .catch((e) => {
        setRequests([]);
        setError(e instanceof Error ? e.message : t("account.transportLoadFailed"));
      })
      .finally(() => setLoading(false));
  }, [authLoading, isAuthenticated, requireAuth, statusFilter, t]);

  return (
    <PageContainer className="py-8">
      <div className="mb-6 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key || "all"}
            type="button"
            onClick={() => setStatusFilter(f.key)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              statusFilter === f.key
                ? "bg-emerald-600 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {t(f.labelKey)}
          </button>
        ))}
      </div>

      {error && (
        <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      )}

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-28 skeleton-shimmer rounded-2xl" />
          ))}
        </div>
      ) : requests.length === 0 ? (
        <EmptyState
          icon={Truck}
          title={t("account.noTransportRequests")}
          description={t("account.noTransportRequestsDesc")}
          action={
            <Link href="/direct" className="font-semibold text-emerald-600 hover:underline">
              {t("account.browseDirect")}
            </Link>
          }
        />
      ) : (
        <ul className="space-y-3">
          {requests.map((r) => (
            <li key={r.requestId}>
              <Link
                href={`/transport/requests/${r.requestId}`}
                className="block rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-slate-900">
                      {localized(r as unknown as LocalizableRecord, "productType", r.productType || t("account.transportRequestFallback"))} · #
                      {r.requestId}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      {localized(r as unknown as LocalizableRecord, "fromRegion", r.fromRegion || t("common.notAvailable"))} →{" "}
                      {localized(r as unknown as LocalizableRecord, "toRegion", r.toRegion || t("common.notAvailable"))}
                    </p>
                    <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                      {r.createdAt && (
                        <span>
                          {t("account.requestDate", "", { date: formatDateAr(r.createdAt) })}
                        </span>
                      )}
                      {r.weightKg != null && r.weightKg > 0 && (
                        <span>{t("account.weight", "", { weight: r.weightKg })}</span>
                      )}
                      {typeof r.offersCount === "number" && (
                        <span className="font-medium text-emerald-700">
                          {t(
                            r.offersCount === 1
                              ? "account.offersCountOne"
                              : "account.offersCountOther",
                            "",
                            { count: r.offersCount },
                          )}
                        </span>
                      )}
                      {r.agreedPrice != null && r.agreedPrice > 0 && (
                        <span>
                          {t("account.agreedPrice", "", {
                            price: formatCurrency(r.agreedPrice, language),
                          })}
                        </span>
                      )}
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
  );
}
