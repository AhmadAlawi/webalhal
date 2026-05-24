"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Plus, Sprout } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageContainer } from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { getFarm, getCropsByFarm } from "@/services/farms";
import type { Crop, Farm } from "@/types/farm";

export default function FarmDetailPage() {
  const { id } = useParams();
  const farmId = Number(id);
  const [farm, setFarm] = useState<Farm | null>(null);
  const [crops, setCrops] = useState<Crop[]>([]);
  const [loading, setLoading] = useState(true);

  function reload() {
    if (!farmId) return;
    Promise.all([
      getFarm(farmId).catch(() => null),
      getCropsByFarm(farmId).catch(() => [] as Crop[]),
    ]).then(([f, c]) => {
      setFarm(f);
      setCrops(c);
    });
  }

  useEffect(() => {
    if (!farmId) return;
    reload();
    setLoading(false);
  }, [farmId]);

  if (loading) {
    return (
      <>
        <PageHeader title="المزرعة" backHref="/farms" />
        <PageContainer className="py-16 text-center text-slate-500">جاري التحميل...</PageContainer>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title={farm?.nameAr || farm?.name || `مزرعة #${farmId}`}
        backHref="/farms"
      />
      <PageContainer className="py-8">
        {farm && (
          <div className="mb-8 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">الموقع</p>
            <p className="font-medium text-slate-800">
              {[farm.governorateName, farm.cityName, farm.area, farm.location]
                .filter(Boolean)
                .join(" — ") || "—"}
            </p>
          </div>
        )}

        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-slate-900">المحاصيل</h2>
          <Link href={`/farms/${farmId}/crops/new`}>
            <Button size="sm">
              <Plus className="h-4 w-4" />
              إضافة محصول
            </Button>
          </Link>
        </div>

        {crops.length === 0 ? (
          <EmptyState
            icon={Sprout}
            title="لا توجد محاصيل"
            description="أضف محصولاً لهذه المزرعة لاستخدامه في المزادات والبيع المباشر"
            action={
              <Link href={`/farms/${farmId}/crops/new`}>
                <Button size="sm">إضافة محصول</Button>
              </Link>
            }
          />
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {crops.map((c) => (
              <li
                key={c.cropId}
                className="rounded-xl border border-gray-100 bg-white px-4 py-3 shadow-sm"
              >
                <p className="font-semibold text-slate-900">
                  {c.nameAr || c.cropName || c.name || `#${c.cropId}`}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {c.quantity != null ? `${c.quantity} ` : ""}
                  {c.unit || ""}
                </p>
              </li>
            ))}
          </ul>
        )}
      </PageContainer>
    </>
  );
}
