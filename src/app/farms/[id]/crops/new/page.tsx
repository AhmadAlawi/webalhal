"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageContainer } from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ProductSelect } from "@/components/forms/ProductSelect";
import { ImageUploadField } from "@/components/forms/ImageUploadField";
import { createCrop } from "@/services/farms";
import { navigateAfterCreate, parseEntityId } from "@/lib/return-navigation";
import { useAuth } from "@/context/AuthContext";

function NewCropForm() {
  const { id } = useParams();
  const farmId = Number(id);
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("returnTo");
  const { user, requireAuth } = useAuth();

  const [productId, setProductId] = useState<number | "">("");
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("كغ");
  const [harvestDate, setHarvestDate] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    requireAuth();
  }, [requireAuth]);

  const backHref =
    returnTo && returnTo.startsWith("/")
      ? returnTo
      : farmId
        ? `/farms/${farmId}`
        : "/farms";

  const isDirectFlow = returnTo === "/direct/new" || returnTo?.includes("/direct/new");

  async function submit() {
    if (!user?.userId || !farmId) return;
    if (!productId || !name.trim() || !quantity || !harvestDate) {
      setError("أكمل المنتج واسم المحصول والكمية وتاريخ الحصاد");
      return;
    }
    const harvest = new Date(harvestDate);
    if (Number.isNaN(harvest.getTime())) {
      setError("تاريخ الحصاد غير صالح");
      return;
    }
    if (expiryDate) {
      const expiry = new Date(expiryDate);
      if (Number.isNaN(expiry.getTime()) || expiry <= harvest) {
        setError("تاريخ الصلاحية يجب أن يكون بعد تاريخ الحصاد");
        return;
      }
    }

    setSaving(true);
    setError("");
    try {
      const res = await createCrop({
        farmId,
        productId: Number(productId),
        name: name.trim(),
        quantity: Number(quantity),
        unit: unit.trim() || "كغ",
        harvestDate: harvest.toISOString(),
        expiryDate: expiryDate ? new Date(expiryDate).toISOString() : undefined,
        imageUrls: imageUrls.length ? imageUrls : undefined,
      });
      const newCropId = parseEntityId(res, "cropId", "CropId");

      navigateAfterCreate(
        router,
        returnTo,
        { farmId, cropId: newCropId },
        `/farms/${farmId}`,
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "فشل إنشاء المحصول");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <PageHeader title="محصول جديد" backHref={backHref} />
      <PageContainer narrow className="py-8">
        <div className="space-y-4 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <ProductSelect
            productId={productId}
            onChange={(pid, product) => {
              setProductId(pid || "");
              if (product?.nameAr && !name) setName(product.nameAr);
            }}
          />
          <Input
            label="اسم المحصول"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <Input
            label="الكمية"
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            required
          />
          <Input
            label="الوحدة"
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            placeholder="كغ"
          />
          <Input
            label="تاريخ الحصاد"
            type="date"
            value={harvestDate}
            onChange={(e) => setHarvestDate(e.target.value)}
            required
          />
          <Input
            label="تاريخ انتهاء الصلاحية (اختياري)"
            type="date"
            value={expiryDate}
            onChange={(e) => setExpiryDate(e.target.value)}
          />
          <ImageUploadField value={imageUrls} onChange={setImageUrls} />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button fullWidth onClick={submit} disabled={saving}>
            {saving
              ? "جاري الحفظ..."
              : isDirectFlow
                ? "التالي — متابعة البيع المباشر"
                : "حفظ المحصول"}
          </Button>
        </div>
      </PageContainer>
    </>
  );
}

export default function NewCropPage() {
  return (
    <Suspense
      fallback={
        <PageContainer className="py-16 text-center text-slate-500">جاري التحميل...</PageContainer>
      }
    >
      <NewCropForm />
    </Suspense>
  );
}
