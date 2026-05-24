"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Sprout, Plus } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageContainer } from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { FadeIn } from "@/components/motion/FadeIn";
import { getMyFarms } from "@/services/farms";
import { useAuth } from "@/context/AuthContext";
import type { Farm } from "@/types/farm";

export default function FarmsPage() {
  const { user, requireAuth, isAuthenticated } = useAuth();
  const [farms, setFarms] = useState<Farm[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated || !user?.userId) {
      requireAuth();
      return;
    }
    getMyFarms(user.userId)
      .then(setFarms)
      .catch(() => setFarms([]))
      .finally(() => setLoading(false));
  }, [isAuthenticated, user?.userId, requireAuth]);

  return (
    <>
      <PageHeader title="مزارعي" backHref="/account" />
      <PageContainer className="py-8">
        <div className="mb-6 flex justify-end">
          <Link href="/farms/new">
            <Button size="sm">
              <Plus className="h-4 w-4" />
              إضافة مزرعة
            </Button>
          </Link>
        </div>

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-32 skeleton-shimmer rounded-2xl" />
            ))}
          </div>
        ) : farms.length === 0 ? (
          <EmptyState
            icon={Sprout}
            title="لا توجد مزارع"
            description="أضف مزرعتك الأولى لربط المحاصيل بالمزادات والبيع المباشر"
            action={
              <Link href="/farms/new">
                <Button>إضافة مزرعة</Button>
              </Link>
            }
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {farms.map((f, i) => (
              <FadeIn key={f.farmId} delay={i * 0.05}>
                <Link
                  href={`/farms/${f.farmId}`}
                  className="block rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
                >
                  <div className="flex items-start gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                      <Sprout className="h-5 w-5" />
                    </span>
                    <div>
                      <h3 className="font-semibold text-slate-900">
                        {f.nameAr || f.name || `مزرعة #${f.farmId}`}
                      </h3>
                      <p className="mt-1 text-sm text-slate-500">
                        {[f.governorateName, f.cityName].filter(Boolean).join(" — ") ||
                          f.location ||
                          "—"}
                      </p>
                    </div>
                  </div>
                </Link>
              </FadeIn>
            ))}
          </div>
        )}
      </PageContainer>
    </>
  );
}
