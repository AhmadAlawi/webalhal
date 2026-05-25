"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageContainer } from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { FarmCropSelect } from "@/components/forms/FarmCropSelect";
import { ImageUploadField } from "@/components/forms/ImageUploadField";
import { useAuth } from "@/context/AuthContext";
import { canCreateDirectListing } from "@/lib/permissions";
import { createListing } from "@/services/marketplace";
import { updateCrop } from "@/services/farms";
import type { Crop } from "@/types/farm";

export default function NewDirectListingPage() {
  const { user, requireAuth } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [cropId, setCropId] = useState<number | "">("");
  const [selectedCrop, setSelectedCrop] = useState<Crop | null>(null);
  const [unitPrice, setUnitPrice] = useState("");
  const [availableQty, setAvailableQty] = useState("");
  const [minOrderQty, setMinOrderQty] = useState("1");
  const [unit, setUnit] = useState("كغ");
  const [title, setTitle] = useState("");
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleCropChange = useCallback((id: number, crop?: Crop) => {
    setCropId(id || "");
    setSelectedCrop(crop ?? null);
    if (crop) {
      const name = crop.nameAr || crop.cropName || crop.name;
      if (name) setTitle((t) => t || name);
      if (crop.unit) setUnit(crop.unit);
      if (crop.quantity != null) setAvailableQty(String(crop.quantity));
      if (crop.imageUrls?.length) setImageUrls(crop.imageUrls);
    }
  }, []);

  if (!requireAuth()) return null;
  if (!canCreateDirectListing(user?.roleId)) {
    return (
      <PageContainer className="py-16 text-center text-red-600">
        التاجر لا يمكنه إنشاء بيع مباشر
      </PageContainer>
    );
  }

  async function submit() {
    if (!user?.userId || !cropId || !unitPrice || !availableQty) return;
    setSubmitting(true);
    setError("");
    try {
      const cropName =
        selectedCrop?.nameAr || selectedCrop?.cropName || selectedCrop?.name;

      if (selectedCrop?.cropId && imageUrls.length > 0) {
        const merged = [...new Set([...(selectedCrop.imageUrls ?? []), ...imageUrls])];
        await updateCrop(selectedCrop.cropId, {
          farmId: selectedCrop.farmId,
          productId: selectedCrop.productId,
          name: cropName,
          quantity: selectedCrop.quantity,
          unit: unit || selectedCrop.unit,
          harvestDate: selectedCrop.harvestDate ?? new Date().toISOString(),
          imageUrls: merged,
        }).catch(() => undefined);
      }

      await createListing({
        sellerUserId: user.userId,
        cropId: Number(cropId),
        title: title || cropName,
        cropName,
        price: Number(unitPrice),
        unitPrice: Number(unitPrice),
        availableQty: Number(availableQty),
        minOrderQty: Number(minOrderQty) || 1,
        unit: unit.trim() || "كغ",
        imageUrls: imageUrls.length ? imageUrls : undefined,
      });
      router.push("/direct");
    } catch (e) {
      setError(e instanceof Error ? e.message : "فشل نشر العرض");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <PageHeader title="عرض بيع مباشر" backHref="/direct" />
      <PageContainer narrow className="py-8">
        <div className="mb-6 flex gap-2">
          {[1, 2].map((s) => (
            <span
              key={s}
              className={`h-2 flex-1 rounded-full ${step >= s ? "bg-emerald-600" : "bg-slate-200"}`}
            />
          ))}
        </div>
        <div className="space-y-4 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          {step === 1 && (
            <>
              <FarmCropSelect
                cropId={cropId}
                onCropChange={handleCropChange}
                onlyAvailable
              />
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
                required
              />
              <Input
                label="الكمية المتاحة"
                type="number"
                value={availableQty}
                onChange={(e) => setAvailableQty(e.target.value)}
                required
              />
              <Input
                label="أقل كمية للطلب"
                type="number"
                value={minOrderQty}
                onChange={(e) => setMinOrderQty(e.target.value)}
              />
              <Input label="الوحدة" value={unit} onChange={(e) => setUnit(e.target.value)} />
              <Input label="عنوان العرض" value={title} onChange={(e) => setTitle(e.target.value)} />
              <ImageUploadField value={imageUrls} onChange={setImageUrls} folder="direct" />
              {error && <p className="text-sm text-red-600">{error}</p>}
              <div className="flex gap-2">
                <Button variant="outline" fullWidth onClick={() => setStep(1)}>
                  رجوع
                </Button>
                <Button
                  fullWidth
                  onClick={submit}
                  disabled={submitting || !unitPrice || !availableQty}
                >
                  {submitting ? "جاري النشر..." : "نشر العرض"}
                </Button>
              </div>
            </>
          )}
        </div>
      </PageContainer>
    </>
  );
}
