"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageContainer } from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { LocationCascadeSelect } from "@/components/forms/LocationCascadeSelect";
import { createFarm } from "@/services/farms";
import { navigateAfterCreate, parseEntityId } from "@/lib/return-navigation";
import type { LocationSelection } from "@/types/location";
import { useAuth } from "@/context/AuthContext";

const emptyLocation = (): LocationSelection => ({
  governorateId: "",
  cityId: "",
  areaId: "",
});

function NewFarmForm() {
  const { user, requireAuth } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("returnTo");

  const [name, setName] = useState("");
  const [location, setLocation] = useState<LocationSelection>(emptyLocation);
  const [village, setVillage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    requireAuth();
  }, [requireAuth]);

  const backHref =
    returnTo && returnTo.startsWith("/") ? returnTo : "/farms";

  async function submit() {
    if (!user?.userId) {
      requireAuth();
      return;
    }
    if (!name.trim()) {
      setError("أدخل اسم المزرعة");
      return;
    }
    if (!location.governorateId || !location.cityId || !location.areaId) {
      setError("اختر المحافظة والمدينة والمقاطعة");
      return;
    }

    setSaving(true);
    setError("");
    try {
      const res = await createFarm(user.userId, {
        name: name.trim(),
        governorateId: Number(location.governorateId),
        cityId: Number(location.cityId),
        areaId: Number(location.areaId),
        governorate: location.governorateName,
        city: location.cityName,
        village: village.trim() || undefined,
        canStoreAfterHarvest: false,
      });
      const newFarmId = parseEntityId(res, "farmId", "FarmId");

      navigateAfterCreate(router, returnTo, { farmId: newFarmId }, "/farms");
    } catch (e) {
      setError(e instanceof Error ? e.message : "فشل إنشاء المزرعة");
    } finally {
      setSaving(false);
    }
  }

  const locationReady =
    location.governorateId && location.cityId && location.areaId;

  return (
    <>
      <PageHeader title="مزرعة جديدة" backHref={backHref} />
      <PageContainer narrow className="py-8">
        <div className="space-y-4 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <Input label="اسم المزرعة" value={name} onChange={(e) => setName(e.target.value)} required />

          <LocationCascadeSelect value={location} onChange={setLocation} />

          <Input
            label="القرية / تفاصيل إضافية (اختياري)"
            value={village}
            onChange={(e) => setVillage(e.target.value)}
            placeholder="اسم القرية أو معلم قريب"
            disabled={!locationReady}
          />

          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button fullWidth onClick={submit} disabled={saving || !locationReady}>
            {saving ? "جاري الحفظ..." : "حفظ المزرعة"}
          </Button>
        </div>
      </PageContainer>
    </>
  );
}

export default function NewFarmPage() {
  return (
    <Suspense
      fallback={
        <PageContainer className="py-16 text-center text-slate-500">جاري التحميل...</PageContainer>
      }
    >
      <NewFarmForm />
    </Suspense>
  );
}
