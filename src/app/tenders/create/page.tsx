"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageContainer } from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ProductSelect } from "@/components/forms/ProductSelect";
import { useAuth } from "@/context/AuthContext";
import { canCreateTender } from "@/lib/permissions";
import { createTender } from "@/services/tenders";

export default function CreateTenderPage() {
  const { user, requireAuth } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [productId, setProductId] = useState<number | "">("");
  const [quantity, setQuantity] = useState("");
  const [title, setTitle] = useState("");
  const [maxBudget, setMaxBudget] = useState("");
  const [deliveryFrom, setDeliveryFrom] = useState("");
  const [deliveryTo, setDeliveryTo] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
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

  async function submit() {
    if (!user?.userId || !productId) return;
    if (!quantity || !deliveryFrom || !deliveryTo || !startTime || !endTime) {
      setError("أكمل جميع الحقول المطلوبة");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await createTender(user.userId, {
        productId: Number(productId),
        quantity: Number(quantity),
        deliveryFrom: new Date(deliveryFrom).toISOString(),
        deliveryTo: new Date(deliveryTo).toISOString(),
        startTime: new Date(startTime).toISOString(),
        endTime: new Date(endTime).toISOString(),
        title: title || undefined,
        maxBudget: maxBudget ? Number(maxBudget) : undefined,
        unit: "كغ",
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
        <div className="space-y-4 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          {step === 1 && (
            <>
              <ProductSelect
                productId={productId}
                onChange={(id) => setProductId(id || "")}
              />
              <Input
                label="الكمية المطلوبة"
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
              <Input label="عنوان المناقصة" value={title} onChange={(e) => setTitle(e.target.value)} />
              <Button fullWidth disabled={!productId} onClick={() => setStep(2)}>
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
              />
              <Input
                label="التسليم إلى"
                type="datetime-local"
                value={deliveryTo}
                onChange={(e) => setDeliveryTo(e.target.value)}
              />
              <Button fullWidth onClick={() => setStep(3)}>
                التالي
              </Button>
            </>
          )}
          {step === 3 && (
            <>
              <Input
                label="بداية المناقصة"
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
              <Input
                label="نهاية المناقصة"
                type="datetime-local"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
              {error && <p className="text-sm text-red-600">{error}</p>}
              <Button fullWidth onClick={submit} disabled={submitting}>
                {submitting ? "جاري النشر..." : "نشر المناقصة"}
              </Button>
            </>
          )}
        </div>
      </PageContainer>
    </>
  );
}
