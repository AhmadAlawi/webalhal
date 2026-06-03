"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageContainer } from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { FarmCropSelect } from "@/components/forms/FarmCropSelect";
import { ImageUploadField } from "@/components/forms/ImageUploadField";
import { UnitSelect } from "@/components/forms/UnitSelect";
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

const DIRECT_RETURN = "/direct/new";

function NewDirectListingForm() {
  const { user, requireAuth } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const cropIdFromUrl = searchParams.get("cropId");
  const farmIdFromUrl = searchParams.get("farmId");
  const [step, setStep] = useState(1);
  const [farmId, setFarmId] = useState<number | "">("");
  const [cropId, setCropId] = useState<number | "">("");
  const [selectedCrop, setSelectedCrop] = useState<Crop | null>(null);
  const [totalPrice, setTotalPrice] = useState("");
  const [availableQty, setAvailableQty] = useState("");
  const [minOrderQty, setMinOrderQty] = useState("");
  const [unit, setUnit] = useState("كغ");
  const [title, setTitle] = useState("");
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [justCreatedCrop, setJustCreatedCrop] = useState(false);

  const applyCropFields = useCallback((crop: Crop) => {
    const name = crop.nameAr || crop.cropName || crop.name;
    if (name) setTitle((t) => t || name);
    if (crop.unit) setUnit(crop.unit);
    if (crop.quantity != null) {
      const qty = String(crop.quantity);
      setAvailableQty(qty);
      setMinOrderQty(qty);
    }
    if (crop.imageUrls?.length) setImageUrls(crop.imageUrls);
  }, []);

  const handleCropChange = useCallback(
    (id: number, crop?: Crop) => {
      setCropId(id || "");
      setSelectedCrop(crop ?? null);
      if (crop) applyCropFields(crop);
    },
    [applyCropFields],
  );

  useEffect(() => {
    if (farmIdFromUrl) {
      const fid = Number(farmIdFromUrl);
      if (Number.isFinite(fid) && fid > 0) setFarmId(fid);
    }
    if (cropIdFromUrl) {
      const id = Number(cropIdFromUrl);
      if (Number.isFinite(id) && id > 0) {
        setCropId(id);
        setStep(1);
        setJustCreatedCrop(true);
      }
    }
  }, [cropIdFromUrl, farmIdFromUrl]);

  if (!requireAuth()) return null;
  if (!canCreateDirectListing(user?.roleId)) {
    return (
      <PageContainer className="py-16 text-center text-red-600">
        التاجر لا يمكنه إنشاء بيع مباشر
      </PageContainer>
    );
  }

  const qtyNum = Number(availableQty);
  const totalNum = Number(totalPrice);
  const computedUnitPrice =
    qtyNum > 0 && totalNum > 0 ? totalNum / qtyNum : 0;

  async function submit() {
    if (!user?.userId || !cropId || !totalPrice || !availableQty || computedUnitPrice <= 0) return;
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
        price: computedUnitPrice,
        unitPrice: computedUnitPrice,
        availableQty: Number(availableQty),
        minOrderQty: Number(minOrderQty) || Number(availableQty),
        maxOrderQty: Number(availableQty),
        unit: unit.trim() || selectedCrop?.unit || "كغ",
        imageUrls: imageUrls.length ? imageUrls : selectedCrop?.imageUrls,
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
              {justCreatedCrop && cropId && (
                <p className="rounded-xl bg-emerald-50 px-4 py-2.5 text-sm text-emerald-800">
                  تم إنشاء المحصول بنجاح — يمكنك متابعة إنشاء عرض البيع المباشر.
                </p>
              )}
              <FarmCropSelect
                cropId={cropId}
                farmId={farmId}
                onFarmChange={(id) => setFarmId(id || "")}
                onCropChange={handleCropChange}
                onlyAvailable
                returnTo={DIRECT_RETURN}
                reloadKey={cropIdFromUrl ?? undefined}
              />
              <Button fullWidth disabled={!cropId} onClick={() => setStep(2)}>
                التالي
              </Button>
            </>
          )}
          {step === 2 && (
            <>
              <Input
                label="السعر الإجمالي (ل.س)"
                type="number"
                min={1}
                value={totalPrice}
                onChange={(e) => setTotalPrice(e.target.value)}
                required
              />
              {computedUnitPrice > 0 && (
                <p className="rounded-xl bg-slate-50 px-4 py-2.5 text-sm text-slate-700">
                  سعر الوحدة:{" "}
                  <span className="font-semibold text-emerald-700">
                    {formatPrice(computedUnitPrice)} ل.س / {unit}
                  </span>
                </p>
              )}
              <Input
                label="الكمية المتاحة"
                type="number"
                value={availableQty}
                readOnly
                disabled
                className="bg-slate-100 text-slate-700"
              />
              <Input
                label="أقل كمية للطلب"
                type="number"
                value={minOrderQty}
                readOnly
                disabled
                className="bg-slate-100 text-slate-700"
              />
              <UnitSelect
                value={unit}
                onChange={setUnit}
                disabled={Boolean(selectedCrop?.unit)}
              />
              <Input label="عنوان العرض" value={title} onChange={(e) => setTitle(e.target.value)} />
              <ImageUploadField value={imageUrls} onChange={setImageUrls} folder="direct" />
              <div className="flex gap-2">
                <Button variant="outline" fullWidth onClick={() => setStep(1)}>
                  رجوع
                </Button>
                <Button
                  fullWidth
                  disabled={!totalPrice || !availableQty || computedUnitPrice <= 0}
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
                  <dt className="text-slate-500">السعر الإجمالي</dt>
                  <dd className="font-medium">{formatPrice(totalNum)} ل.س</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-500">سعر الوحدة</dt>
                  <dd>
                    {formatPrice(computedUnitPrice)} ل.س / {unit}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-500">الكمية</dt>
                  <dd>
                    {availableQty} {unit} (الطلب بالكمية كاملة)
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
