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
import { useI18n } from "@/context/I18nContext";
import type { LocalizableRecord } from "@/lib/localized-value";
import { useLocalizedLabel } from "@/hooks/useLocalizedLabel";

function NewCropForm() {
  const { t } = useI18n();
  const { localized } = useLocalizedLabel();
  const { id } = useParams();
  const farmId = Number(id);
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("returnTo");
  const { user, requireAuth } = useAuth();

  const [productId, setProductId] = useState<number | "">("");
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("kg");
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
      setError(t("farms.crop.fillRequired"));
      return;
    }
    const harvest = new Date(harvestDate);
    if (Number.isNaN(harvest.getTime())) {
      setError(t("farms.crop.invalidHarvest"));
      return;
    }
    if (expiryDate) {
      const expiry = new Date(expiryDate);
      if (Number.isNaN(expiry.getTime()) || expiry <= harvest) {
        setError(t("farms.crop.invalidExpiry"));
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
        unit: unit.trim() || t("forms.units.kg"),
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
      setError(e instanceof Error ? e.message : t("farms.crop.createFailed"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <PageHeader title={t("farms.crop.new")} backHref={backHref} />
      <PageContainer narrow className="py-8">
        <div className="space-y-4 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <ProductSelect
            productId={productId}
            onChange={(pid, product) => {
              setProductId(pid || "");
              if (product && !name) setName(localized(product as unknown as LocalizableRecord));
            }}
          />
          <Input
            label={t("farms.crop.name")}
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <Input
            label={t("farms.crop.quantity")}
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            required
          />
          <Input
            label={t("forms.units.label")}
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            placeholder={t("forms.units.kg")}
          />
          <Input
            label={t("farms.crop.harvestDate")}
            type="date"
            value={harvestDate}
            onChange={(e) => setHarvestDate(e.target.value)}
            required
          />
          <Input
            label={t("farms.crop.expiryDate")}
            type="date"
            value={expiryDate}
            onChange={(e) => setExpiryDate(e.target.value)}
          />
          <ImageUploadField value={imageUrls} onChange={setImageUrls} />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button fullWidth onClick={submit} disabled={saving}>
            {saving
              ? t("common.saving")
              : isDirectFlow
                ? t("farms.crop.nextDirect")
                : t("farms.crop.save")}
          </Button>
        </div>
      </PageContainer>
    </>
  );
}

export default function NewCropPage() {
  const { t } = useI18n();

  return (
    <Suspense
      fallback={
        <PageContainer className="py-16 text-center text-slate-500">
          {t("common.loadingEllipsis")}
        </PageContainer>
      }
    >
      <NewCropForm />
    </Suspense>
  );
}
