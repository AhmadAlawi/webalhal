"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageContainer } from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { createFarm } from "@/services/farms";
import { getCities } from "@/services/transport";
import type { City } from "@/types/transport";
import { useAuth } from "@/context/AuthContext";

export default function NewFarmPage() {
  const { requireAuth } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [cityId, setCityId] = useState<number | "">("");
  const [area, setArea] = useState("");
  const [location, setLocation] = useState("");
  const [cities, setCities] = useState<City[]>([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!requireAuth()) return;
    getCities().then(setCities).catch(() => {});
  }, [requireAuth]);

  async function submit() {
    if (!name.trim()) {
      setError("أدخل اسم المزرعة");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await createFarm({
        name: name.trim(),
        nameAr: name.trim(),
        cityId: cityId ? Number(cityId) : undefined,
        area: area ? Number(area) : undefined,
        location: location || undefined,
      });
      router.push("/farms");
    } catch (e) {
      setError(e instanceof Error ? e.message : "فشل إنشاء المزرعة");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <PageHeader title="مزرعة جديدة" backHref="/farms" />
      <PageContainer narrow className="py-8">
        <div className="space-y-4 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <Input label="اسم المزرعة" value={name} onChange={(e) => setName(e.target.value)} />
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-slate-700">المدينة</span>
            <select
              className="rounded-xl border border-gray-200 px-3 py-2.5"
              value={cityId}
              onChange={(e) => setCityId(e.target.value ? Number(e.target.value) : "")}
            >
              <option value="">اختر المدينة</option>
              {cities.map((c) => (
                <option key={c.cityId} value={c.cityId}>
                  {c.nameAr || c.name}
                </option>
              ))}
            </select>
          </label>
          <Input label="المساحة (اختياري)" type="number" value={area} onChange={(e) => setArea(e.target.value)} />
          <Input label="الموقع / الوصف" value={location} onChange={(e) => setLocation(e.target.value)} />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button fullWidth onClick={submit} disabled={saving}>
            {saving ? "جاري الحفظ..." : "حفظ المزرعة"}
          </Button>
        </div>
      </PageContainer>
    </>
  );
}
