"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageContainer } from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { FarmCropSelect } from "@/components/forms/FarmCropSelect";
import { useAuth } from "@/context/AuthContext";
import { canCreateAuction } from "@/lib/permissions";
import { createAuction } from "@/services/auctions";

export default function CreateAuctionPage() {
  const { user, requireAuth } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [cropId, setCropId] = useState<number | "">("");
  const [startingPrice, setStartingPrice] = useState("");
  const [minIncrement, setMinIncrement] = useState("1000");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [title, setTitle] = useState("");
  const [error, setError] = useState("");

  if (!requireAuth()) return null;
  if (!canCreateAuction(user?.roleId)) {
    return (
      <PageContainer className="py-16 text-center text-red-600">
        ليس لديك صلاحية إنشاء مزاد
      </PageContainer>
    );
  }

  async function submit() {
    if (!user?.userId || !cropId) return;
    try {
      await createAuction(user.userId, {
        cropId: Number(cropId),
        startingPrice: Number(startingPrice),
        minIncrement: Number(minIncrement),
        startTime: new Date(startTime).toISOString(),
        endTime: new Date(endTime).toISOString(),
        auctionTitle: title || undefined,
      });
      router.push("/auctions");
    } catch (e) {
      setError(e instanceof Error ? e.message : "فشل إنشاء المزاد");
    }
  }

  return (
    <>
      <PageHeader title="إنشاء مزاد" backHref="/auctions" />
      <PageContainer narrow className="py-8">
        <div className="mb-6 flex gap-2">
          {[1, 2, 3].map((s) => (
            <span
              key={s}
              className={`h-2 flex-1 rounded-full ${step >= s ? "bg-emerald-600" : "bg-slate-200"}`}
            />
          ))}
        </div>
        <div className="space-y-4 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          {step === 1 && (
            <>
              <p className="text-sm text-slate-600">الخطوة 1: اختر المزرعة والمحصول</p>
              <FarmCropSelect
                cropId={cropId}
                onCropChange={(id) => setCropId(id || "")}
              />
              <Button fullWidth disabled={!cropId} onClick={() => setStep(2)}>
                التالي
              </Button>
            </>
          )}
          {step === 2 && (
            <>
              <Input
                label="سعر البداية (ل.س)"
                type="number"
                value={startingPrice}
                onChange={(e) => setStartingPrice(e.target.value)}
              />
              <Input
                label="أقل زيادة"
                type="number"
                value={minIncrement}
                onChange={(e) => setMinIncrement(e.target.value)}
              />
              <Input label="عنوان المزاد" value={title} onChange={(e) => setTitle(e.target.value)} />
              <Button fullWidth onClick={() => setStep(3)}>
                التالي
              </Button>
            </>
          )}
          {step === 3 && (
            <>
              <Input
                label="وقت البداية"
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
              <Input
                label="وقت النهاية"
                type="datetime-local"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
              {error && <p className="text-sm text-red-600">{error}</p>}
              <Button fullWidth onClick={submit}>
                نشر المزاد
              </Button>
            </>
          )}
        </div>
      </PageContainer>
    </>
  );
}
