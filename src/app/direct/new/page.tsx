"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageContainer } from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { FarmCropSelect } from "@/components/forms/FarmCropSelect";
import { useAuth } from "@/context/AuthContext";
import { canCreateDirectListing } from "@/lib/permissions";
import { createListing } from "@/services/marketplace";

export default function NewDirectListingPage() {
  const { user, requireAuth } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [cropId, setCropId] = useState<number | "">("");
  const [unitPrice, setUnitPrice] = useState("");
  const [availableQty, setAvailableQty] = useState("");
  const [unit, setUnit] = useState("كغ");
  const [title, setTitle] = useState("");
  const [error, setError] = useState("");

  if (!requireAuth()) return null;
  if (!canCreateDirectListing(user?.roleId)) {
    return (
      <PageContainer className="py-16 text-center text-red-600">
        التاجر لا يمكنه إنشاء بيع مباشر
      </PageContainer>
    );
  }

  async function submit() {
    if (!user?.userId || !cropId) return;
    try {
      await createListing({
        sellerUserId: user.userId,
        cropId: Number(cropId),
        title: title || undefined,
        price: Number(unitPrice),
      });
      router.push("/direct");
    } catch (e) {
      setError(e instanceof Error ? e.message : "فشل نشر العرض");
    }
  }

  return (
    <>
      <PageHeader title="عرض بيع مباشر" backHref="/direct" />
      <PageContainer narrow className="py-8">
        <div className="space-y-4 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          {step === 1 && (
            <>
              <FarmCropSelect cropId={cropId} onCropChange={(id) => setCropId(id || "")} />
              <Button fullWidth disabled={!cropId} onClick={() => setStep(2)}>
                التالي
              </Button>
            </>
          )}
          {step === 2 && (
            <>
              <Input
                label="سعر الوحدة (ل.س)"
                type="number"
                value={unitPrice}
                onChange={(e) => setUnitPrice(e.target.value)}
              />
              <Input
                label="الكمية المتاحة"
                type="number"
                value={availableQty}
                onChange={(e) => setAvailableQty(e.target.value)}
              />
              <Input label="الوحدة" value={unit} onChange={(e) => setUnit(e.target.value)} />
              <Input label="عنوان العرض" value={title} onChange={(e) => setTitle(e.target.value)} />
              {error && <p className="text-sm text-red-600">{error}</p>}
              <Button fullWidth onClick={submit}>
                نشر العرض
              </Button>
            </>
          )}
        </div>
      </PageContainer>
    </>
  );
}
