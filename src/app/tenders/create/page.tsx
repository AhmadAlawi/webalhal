"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageContainer } from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ProductSelect } from "@/components/forms/ProductSelect";
import { LocationCascadeSelect } from "@/components/forms/LocationCascadeSelect";
import { ImageUploadField } from "@/components/forms/ImageUploadField";
import { useAuth } from "@/context/AuthContext";
import { canCreateTender } from "@/lib/permissions";
import { createTender } from "@/services/tenders";
import type { Product } from "@/types/farm";
import type { LocationSelection } from "@/types/location";

function toIso(local: string): string {
  const d = new Date(local);
  if (Number.isNaN(d.getTime())) throw new Error("تاريخ غير صالح");
  return d.toISOString();
}

type DeliveryMode = "with_transport" | "without_transport";

export default function CreateTenderPage() {
  const { user, requireAuth } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [productId, setProductId] = useState<number | "">("");
  const [selectedProduct, setSelectedProduct] = useState<Product | undefined>();
  const [quantity, setQuantity] = useState("");
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState<LocationSelection>({
    governorateId: "",
    cityId: "",
    areaId: "",
  });
  const [deliveryMode, setDeliveryMode] = useState<DeliveryMode>("with_transport");
  const [maxBudget, setMaxBudget] = useState("");
  const [deliveryFrom, setDeliveryFrom] = useState("");
  const [deliveryTo, setDeliveryTo] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!requireAuth()) return null;
  if (!canCreateTender(user?.roleId)) {
    return (
      <PageContainer className="py-16 text-center text-red-600">
        ليس لديك صلاحية إنشاء مناقصة
      </PageContainer>
    );
  }

  function locationReady(): boolean {
    return Boolean(location.governorateId && location.cityId && location.areaId);
  }

  function deliveryLocationLabel(): string {
    return [location.governorateName, location.cityName, location.areaName]
      .filter(Boolean)
      .join(" — ");
  }

  function validateDates(): string | null {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const dFrom = new Date(deliveryFrom);
    const dTo = new Date(deliveryTo);
    if (end <= start) return "نهاية المناقصة يجب أن تكون بعد بدايتها";
    if (dTo <= dFrom) return "نهاية التسليم يجب أن تكون بعد بدايته";
    return null;
  }

  async function submit() {
    if (!user?.userId || !productId) return;
    if (!title.trim()) {
      setError("أدخل عنوان المناقصة");
      return;
    }
    if (!locationReady()) {
      setError("اختر المحافظة والمدينة والمقاطعة لموقع التسليم");
      return;
    }
    if (!quantity || !deliveryFrom || !deliveryTo || !startTime || !endTime) {
      setError("أكمل جميع الحقول المطلوبة");
      return;
    }
    const dateErr = validateDates();
    if (dateErr) {
      setError(dateErr);
      return;
    }

    const cropName =
      selectedProduct?.nameAr || selectedProduct?.name || title.trim();

    setSubmitting(true);
    setError("");
    try {
      await createTender(user.userId, {
        productId: Number(productId),
        title: title.trim(),
        cropName,
        deliveryLocation: deliveryLocationLabel(),
        governorateId: Number(location.governorateId),
        cityId: Number(location.cityId),
        areaId: Number(location.areaId),
        requiresTransport: deliveryMode === "with_transport",
        withTransport: deliveryMode === "with_transport",
        quantity: Number(quantity),
        deliveryFrom: toIso(deliveryFrom),
        deliveryTo: toIso(deliveryTo),
        startTime: toIso(startTime),
        endTime: toIso(endTime),
        maxBudget: maxBudget ? Number(maxBudget) : undefined,
        unit: "كغ",
        imageUrls: imageUrls.length ? imageUrls : undefined,
      });
      router.push("/tenders");
    } catch (e) {
      setError(e instanceof Error ? e.message : "فشل إنشاء المناقصة");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <PageHeader title="إنشاء مناقصة" backHref="/tenders" />
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
              <ProductSelect
                productId={productId}
                onChange={(id, product) => {
                  setProductId(id || "");
                  setSelectedProduct(product);
                  if (product?.nameAr && !title) setTitle(`مناقصة ${product.nameAr}`);
                }}
              />
              <Input
                label="الكمية المطلوبة"
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                required
              />
              <Input
                label="عنوان المناقصة"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
              <div>
                <p className="mb-2 text-sm font-medium text-slate-700">موقع التسليم</p>
                <LocationCascadeSelect value={location} onChange={setLocation} />
              </div>
              <fieldset className="space-y-2">
                <legend className="text-sm font-medium text-slate-700">خيار النقل</legend>
                <label className="flex cursor-pointer items-center gap-3 rounded-xl border p-3">
                  <input
                    type="radio"
                    name="deliveryMode"
                    checked={deliveryMode === "with_transport"}
                    onChange={() => setDeliveryMode("with_transport")}
                    className="accent-emerald-600"
                  />
                  <span className="text-sm">مع نقل (يشمل التوصيل)</span>
                </label>
                <label className="flex cursor-pointer items-center gap-3 rounded-xl border p-3">
                  <input
                    type="radio"
                    name="deliveryMode"
                    checked={deliveryMode === "without_transport"}
                    onChange={() => setDeliveryMode("without_transport")}
                    className="accent-emerald-600"
                  />
                  <span className="text-sm">بدون نقل (استلام من الموقع)</span>
                </label>
              </fieldset>
              <Button
                fullWidth
                disabled={!productId || !title.trim() || !quantity || !locationReady()}
                onClick={() => setStep(2)}
              >
                التالي
              </Button>
            </>
          )}
          {step === 2 && (
            <>
              <Input
                label="الميزانية القصوى (اختياري)"
                type="number"
                value={maxBudget}
                onChange={(e) => setMaxBudget(e.target.value)}
              />
              <Input
                label="التسليم من"
                type="datetime-local"
                value={deliveryFrom}
                onChange={(e) => setDeliveryFrom(e.target.value)}
                required
              />
              <Input
                label="التسليم إلى"
                type="datetime-local"
                value={deliveryTo}
                onChange={(e) => setDeliveryTo(e.target.value)}
                required
              />
              <ImageUploadField value={imageUrls} onChange={setImageUrls} folder="tenders" />
              <div className="flex gap-2">
                <Button variant="outline" fullWidth onClick={() => setStep(1)}>
                  رجوع
                </Button>
                <Button fullWidth onClick={() => setStep(3)}>
                  التالي
                </Button>
              </div>
            </>
          )}
          {step === 3 && (
            <>
              <Input
                label="بداية المناقصة"
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
              />
              <Input
                label="نهاية المناقصة"
                type="datetime-local"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
              />
              <p className="text-xs text-slate-500">
                الموقع: {deliveryLocationLabel()} ·{" "}
                {deliveryMode === "with_transport" ? "مع نقل" : "بدون نقل"}
              </p>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <div className="flex gap-2">
                <Button variant="outline" fullWidth onClick={() => setStep(2)}>
                  رجوع
                </Button>
                <Button fullWidth onClick={submit} disabled={submitting}>
                  {submitting ? "جاري النشر..." : "نشر المناقصة"}
                </Button>
              </div>
            </>
          )}
        </div>
      </PageContainer>
    </>
  );
}
