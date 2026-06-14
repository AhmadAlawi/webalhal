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
import { useI18n } from "@/context/I18nContext";
import type { LocalizableRecord } from "@/lib/localized-value";
import { useLocalizedLabel } from "@/hooks/useLocalizedLabel";
import { canCreateTender } from "@/lib/permissions";
import { createTender } from "@/services/tenders";
import type { Product } from "@/types/farm";
import type { LocationSelection } from "@/types/location";

function toIso(local: string, t: ReturnType<typeof useI18n>["t"]): string {
  const d = new Date(local);
  if (Number.isNaN(d.getTime())) throw new Error(t("tenders.create.invalidDate"));
  return d.toISOString();
}

type DeliveryMode = "with_transport" | "without_transport";

export default function CreateTenderPage() {
  const { t } = useI18n();
  const { localized } = useLocalizedLabel();
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
        {t("tenders.create.noPermission")}
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
    if (end <= start) return t("tenders.create.endAfterStart");
    if (dTo <= dFrom) return t("tenders.create.deliveryEndAfterStart");
    return null;
  }

  async function submit() {
    if (!user?.userId || !productId) return;
    if (!title.trim()) {
      setError(t("tenders.create.enterTitle"));
      return;
    }
    if (!locationReady()) {
      setError(t("tenders.create.selectDeliveryLocation"));
      return;
    }
    if (!quantity || !deliveryFrom || !deliveryTo || !startTime || !endTime) {
      setError(t("tenders.create.fillRequired"));
      return;
    }
    const dateErr = validateDates();
    if (dateErr) {
      setError(dateErr);
      return;
    }

    const cropName = localized(selectedProduct as unknown as LocalizableRecord) || title.trim();

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
        deliveryFrom: toIso(deliveryFrom, t),
        deliveryTo: toIso(deliveryTo, t),
        startTime: toIso(startTime, t),
        endTime: toIso(endTime, t),
        maxBudget: maxBudget ? Number(maxBudget) : undefined,
        unit: t("forms.units.kg"),
        imageUrls: imageUrls.length ? imageUrls : undefined,
      });
      router.push("/tenders");
    } catch (e) {
      setError(e instanceof Error ? e.message : t("tenders.create.failed"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <PageHeader title={t("tenders.create.title")} backHref="/tenders" />
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
                  const productName = product
                    ? localized(product as unknown as LocalizableRecord)
                    : "";
                  if (productName && !title) {
                    setTitle(t("tenders.create.titleWithProduct", undefined, { product: productName }));
                  }
                }}
              />
              <Input
                label={t("tenders.create.requiredQuantity")}
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                required
              />
              <Input
                label={t("tenders.create.tenderTitle")}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
              <div>
                <p className="mb-2 text-sm font-medium text-slate-700">
                  {t("tenders.create.deliveryLocation")}
                </p>
                <LocationCascadeSelect value={location} onChange={setLocation} />
              </div>
              <fieldset className="space-y-2">
                <legend className="text-sm font-medium text-slate-700">
                  {t("tenders.create.transportOption")}
                </legend>
                <label className="flex cursor-pointer items-center gap-3 rounded-xl border p-3">
                  <input
                    type="radio"
                    name="deliveryMode"
                    checked={deliveryMode === "with_transport"}
                    onChange={() => setDeliveryMode("with_transport")}
                    className="accent-emerald-600"
                  />
                  <span className="text-sm">{t("tenders.create.withTransport")}</span>
                </label>
                <label className="flex cursor-pointer items-center gap-3 rounded-xl border p-3">
                  <input
                    type="radio"
                    name="deliveryMode"
                    checked={deliveryMode === "without_transport"}
                    onChange={() => setDeliveryMode("without_transport")}
                    className="accent-emerald-600"
                  />
                  <span className="text-sm">{t("tenders.create.withoutTransport")}</span>
                </label>
              </fieldset>
              <Button
                fullWidth
                disabled={!productId || !title.trim() || !quantity || !locationReady()}
                onClick={() => setStep(2)}
              >
                {t("common.next")}
              </Button>
            </>
          )}
          {step === 2 && (
            <>
              <Input
                label={t("tenders.create.maxBudget")}
                type="number"
                value={maxBudget}
                onChange={(e) => setMaxBudget(e.target.value)}
              />
              <Input
                label={t("tenders.create.deliveryFrom")}
                type="datetime-local"
                value={deliveryFrom}
                onChange={(e) => setDeliveryFrom(e.target.value)}
                required
              />
              <Input
                label={t("tenders.create.deliveryTo")}
                type="datetime-local"
                value={deliveryTo}
                onChange={(e) => setDeliveryTo(e.target.value)}
                required
              />
              <ImageUploadField value={imageUrls} onChange={setImageUrls} folder="tenders" />
              <div className="flex gap-2">
                <Button variant="outline" fullWidth onClick={() => setStep(1)}>
                  {t("common.back")}
                </Button>
                <Button fullWidth onClick={() => setStep(3)}>
                  {t("common.next")}
                </Button>
              </div>
            </>
          )}
          {step === 3 && (
            <>
              <Input
                label={t("tenders.create.tenderStart")}
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
              />
              <Input
                label={t("tenders.create.tenderEnd")}
                type="datetime-local"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
              />
              <p className="text-xs text-slate-500">
                {t("tenders.create.summary", undefined, {
                  location: deliveryLocationLabel(),
                  transport:
                    deliveryMode === "with_transport"
                      ? t("tenders.create.withTransportShort")
                      : t("tenders.create.withoutTransportShort"),
                })}
              </p>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <div className="flex gap-2">
                <Button variant="outline" fullWidth onClick={() => setStep(2)}>
                  {t("common.back")}
                </Button>
                <Button fullWidth onClick={submit} disabled={submitting}>
                  {submitting ? t("tenders.create.publishing") : t("tenders.create.publish")}
                </Button>
              </div>
            </>
          )}
        </div>
      </PageContainer>
    </>
  );
}
