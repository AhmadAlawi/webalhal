"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageContainer } from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { FarmCropSelect } from "@/components/forms/FarmCropSelect";
import { ImageUploadField } from "@/components/forms/ImageUploadField";
import { useAuth } from "@/context/AuthContext";
import { canCreateDirectListing } from "@/lib/permissions";
import { formatPrice } from "@/lib/auctionPricing";
import { createListing } from "@/services/marketplace";
import { updateCrop } from "@/services/farms";
import type { Crop } from "@/types/farm";

export default function NewDirectListingPage() {
  return (
    <Suspense
      fallback={
        <PageContainer className="py-16 text-center text-slate-500">جاري التحميل...</PageContainer>
      }
    >
      <NewDirectListingForm />
    </Suspense>
  );
}

function NewDirectListingForm() {
  const { user, requireAuth } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState(1);
  const [cropId, setCropId] = useState<number | "">("");
  const [selectedCrop, setSelectedCrop] = useState<Crop | null>(null);
  const [unitPrice, setUnitPrice] = useState("");
  const [availableQty, setAvailableQty] = useState("");
  const [minOrderQty, setMinOrderQty] = useState("1");
  const [maxOrderQty, setMaxOrderQty] = useState("");
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
      if (crop.quantity != null) {
        setAvailableQty(String(crop.quantity));
        setMaxOrderQty((m) => m || String(crop.quantity));
      }
      if (crop.imageUrls?.length) setImageUrls(crop.imageUrls);
    }
  }, []);

  useEffect(() => {
    const fromUrl = searchParams.get("cropId");
    if (fromUrl) {
      const id = Number(fromUrl);
      if (Number.isFinite(id) && id > 0) setCropId(id);
    }
  }, [searchParams]);

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
        maxOrderQty: maxOrderQty.trim() ? Number(maxOrderQty) : Number(availableQty),
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

  const cropLabel =
    selectedCrop?.nameAr || selectedCrop?.cropName || selectedCrop?.name || "—";

  return (
    <>
      <PageHeader title="عرض بيع مباشر" backHref="/direct" />
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
              <Input
                label="أقصى كمية للطلب"
                type="number"
                value={maxOrderQty}
                onChange={(e) => setMaxOrderQty(e.target.value)}
                placeholder="افتراضياً = الكمية المتاحة"
              />
              <Input label="الوحدة" value={unit} onChange={(e) => setUnit(e.target.value)} />
              <Input label="عنوان العرض" value={title} onChange={(e) => setTitle(e.target.value)} />
              <ImageUploadField value={imageUrls} onChange={setImageUrls} folder="direct" />
              <div className="flex gap-2">
                <Button variant="outline" fullWidth onClick={() => setStep(1)}>
                  رجوع
                </Button>
                <Button
                  fullWidth
                  disabled={!unitPrice || !availableQty}
                  onClick={() => setStep(3)}
                >
                  مراجعة
                </Button>
              </div>
            </>
          )}
          {step === 3 && (
            <>
              <h2 className="font-semibold text-slate-900">مراجعة العرض</h2>
              <dl className="space-y-2 text-sm text-slate-700">
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-500">المحصول</dt>
                  <dd className="font-medium">{cropLabel}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-500">السعر</dt>
                  <dd>{formatPrice(Number(unitPrice))} ل.س / {unit}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-500">الكمية</dt>
                  <dd>
                    {availableQty} {unit} (أقل {minOrderQty || 1}
                    {maxOrderQty.trim() ? ` — أقصى ${maxOrderQty}` : ""})
                  </dd>
                </div>
                {title && (
                  <div className="flex justify-between gap-4">
                    <dt className="text-slate-500">العنوان</dt>
                    <dd>{title}</dd>
                  </div>
                )}
                {imageUrls.length > 0 && (
                  <div>
                    <dt className="text-slate-500">الصور</dt>
                    <dd className="mt-1 text-emerald-700">{imageUrls.length} صورة</dd>
                  </div>
                )}
              </dl>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <div className="flex gap-2">
                <Button variant="outline" fullWidth onClick={() => setStep(2)}>
                  رجوع
                </Button>
                <Button fullWidth onClick={submit} disabled={submitting}>
                  {submitting ? "جاري النشر..." : "تأكيد النشر"}
                </Button>
              </div>
            </>
          )}
        </div>
      </PageContainer>
    </>
  );
}
