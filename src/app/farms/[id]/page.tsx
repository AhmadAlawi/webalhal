"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageContainer } from "@/components/layout/PageContainer";
import { EmptyState } from "@/components/ui/EmptyState";
import { getFarm, getCropsByFarm } from "@/services/farms";
import type { Crop, Farm } from "@/types/farm";
import { Sprout } from "lucide-react";

export default function FarmDetailPage() {
  const { id } = useParams();
  const farmId = Number(id);
  const [farm, setFarm] = useState<Farm | null>(null);
  const [crops, setCrops] = useState<Crop[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!farmId) return;
    Promise.all([
      getFarm(farmId).catch(() => null),
      getCropsByFarm(farmId).catch(() => [] as Crop[]),
    ])
      .then(([f, c]) => {
        setFarm(f);
        setCrops(c);
      })
      .finally(() => setLoading(false));
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
              {[farm.governorateName, farm.cityName, farm.location]
                .filter(Boolean)
                .join(" — ") || "—"}
            </p>
          </div>
        )}

        <h2 className="mb-4 text-lg font-bold text-slate-900">المحاصيل</h2>
        {crops.length === 0 ? (
          <EmptyState
            icon={Sprout}
            title="لا توجد محاصيل"
            description="أضف المحاصيل من تطبيق الجوال أو لوحة الإدارة"
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
                  معرف المحصول: {c.cropId}
                  {c.unit ? ` · ${c.unit}` : ""}
                </p>
              </li>
            ))}
          </ul>
        )}
      </PageContainer>
    </>
  );
}
