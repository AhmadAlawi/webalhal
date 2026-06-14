"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageContainer } from "@/components/layout/PageContainer";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatCurrency } from "@/lib/format";
import { getBuyerOrders, getSellerOrders, type DirectOrder } from "@/services/direct";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/context/I18nContext";
import { useLocalizedLabel } from "@/hooks/useLocalizedLabel";
import { ShoppingBag } from "lucide-react";

function orderKey(o: DirectOrder, i: number) {
  return o.orderId ?? o.id ?? i;
}

export default function DirectOrdersPage() {
  const { t, language } = useI18n();
  const { localized } = useLocalizedLabel();
  const { user, requireAuth, isAuthenticated, isLoading: authLoading } = useAuth();
  const [orders, setOrders] = useState<DirectOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const dateLocale = language === "ar" ? "ar-SY" : "en-US";

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated || !user?.userId) {
      requireAuth();
      return;
    }
    const uid = user.userId;
    setLoading(true);
    Promise.all([getBuyerOrders(uid), getSellerOrders(uid)])
      .then(([buyer, seller]) => {
        const merged = [...buyer, ...seller];
        const seen = new Set<number>();
        const unique = merged.filter((o) => {
          const id = o.orderId ?? o.id;
          if (id == null) return true;
          if (seen.has(id)) return false;
          seen.add(id);
          return true;
        });
        unique.sort((a, b) => {
          const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return tb - ta;
        });
        setOrders(unique);
      })
      .catch((e) => {
        setOrders([]);
        setError(e instanceof Error ? e.message : t("orders.direct.loadFailed"));
      })
      .finally(() => setLoading(false));
  }, [authLoading, isAuthenticated, user?.userId, requireAuth, t]);

  return (
    <>
      <PageHeader title={t("orders.direct.title")} backHref="/account" />
      <PageContainer className="py-8">
        {error && (
          <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
        )}
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-24 skeleton-shimmer rounded-2xl" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <EmptyState
            icon={ShoppingBag}
            title={t("orders.direct.noOrders")}
            description={t("orders.direct.noOrdersDesc")}
            action={
              <Link href="/direct" className="text-emerald-600 font-semibold hover:underline">
                {t("orders.direct.browseListings")}
              </Link>
            }
          />
        ) : (
          <ul className="space-y-3">
            {orders.map((o, i) => (
              <li key={orderKey(o, i)}>
                <Link
                  href={`/orders/direct/${o.orderId ?? o.id}`}
                  className="block rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-colors hover:border-emerald-200"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-slate-900">
                        {o.listingTitle ||
                          localized({ name: o.cropName, nameAr: o.productNameAr }) ||
                          o.cropName ||
                          o.productNameAr ||
                          t("orders.direct.orderFallback", undefined, {
                            id: o.orderId ?? o.id,
                          })}
                      </p>
                      {o.qty != null && (
                        <p className="mt-1 text-sm text-slate-500">
                          {t("orders.direct.quantity", undefined, { qty: o.qty })}
                        </p>
                      )}
                      {o.totalPrice != null && (
                        <p className="mt-1 font-bold text-emerald-600">
                          {formatCurrency(o.totalPrice)}
                        </p>
                      )}
                    </div>
                    <StatusBadge status={o.status} />
                  </div>
                  {o.createdAt && (
                    <p className="mt-2 text-xs text-slate-400">
                      {new Date(o.createdAt).toLocaleString(dateLocale)}
                    </p>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </PageContainer>
    </>
  );
}
