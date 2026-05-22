"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageContainer } from "@/components/layout/PageContainer";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatCurrency } from "@/lib/format";
import { getMyOrders } from "@/services/marketplace";
import { useAuth } from "@/context/AuthContext";
import { ShoppingBag } from "lucide-react";

interface DirectOrder {
  orderId?: number;
  id?: number;
  status?: string;
  qty?: number;
  totalPrice?: number;
  listingTitle?: string;
  cropName?: string;
  createdAt?: string;
}

export default function DirectOrdersPage() {
  const { requireAuth } = useAuth();
  const [orders, setOrders] = useState<DirectOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!requireAuth()) return;
    getMyOrders()
      .then((d) => setOrders(Array.isArray(d) ? (d as DirectOrder[]) : []))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, [requireAuth]);

  return (
    <>
      <PageHeader title="طلباتي — بيع مباشر" backHref="/account" />
      <PageContainer className="py-8">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-24 skeleton-shimmer rounded-2xl" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <EmptyState
            icon={ShoppingBag}
            title="لا توجد طلبات"
            description="عند شراء منتج من البيع المباشر ستظهر طلباتك هنا"
            action={
              <Link href="/direct" className="text-emerald-600 font-semibold hover:underline">
                تصفح العروض
              </Link>
            }
          />
        ) : (
          <ul className="space-y-3">
            {orders.map((o, i) => (
              <li key={o.orderId ?? o.id ?? i}>
                <Link
                  href={`/orders/direct/${o.orderId ?? o.id}`}
                  className="block rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-colors hover:border-emerald-200"
                >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-slate-900">
                      {o.listingTitle || o.cropName || `طلب #${o.orderId ?? o.id}`}
                    </p>
                    {o.qty != null && (
                      <p className="mt-1 text-sm text-slate-500">الكمية: {o.qty}</p>
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
                    {new Date(o.createdAt).toLocaleString("ar-SY")}
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
