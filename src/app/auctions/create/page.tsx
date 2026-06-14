"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageContainer } from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { FarmCropSelect } from "@/components/forms/FarmCropSelect";
import { LocationCascadeSelect } from "@/components/forms/LocationCascadeSelect";
import { ImageUploadField } from "@/components/forms/ImageUploadField";
import { useAuth } from "@/context/AuthContext";
import { useUserPermissions } from "@/hooks/useUserPermissions";
import { useI18n } from "@/context/I18nContext";
import { useLocalizedLabel } from "@/hooks/useLocalizedLabel";
import { createAuction } from "@/services/auctions";
import { getFarm, updateFarm, updateCrop } from "@/services/farms";
import type { Crop, Farm } from "@/types/farm";
import type { LocationSelection } from "@/types/location";

type StepId = "farm" | "location" | "details" | "schedule";

function toIso(local: string, invalidMessage: string): string {
  const d = new Date(local);
  if (Number.isNaN(d.getTime())) throw new Error(invalidMessage);
  return d.toISOString();
}

function emptyLocation(): LocationSelection {
  return { governorateId: "", cityId: "", areaId: "" };
}

function farmToLocation(farm?: Farm | null): LocationSelection {
  if (!farm) return emptyLocation();
  return {
    governorateId: farm.governorateId ?? "",
    cityId: farm.cityId ?? "",
    areaId: farm.areaId ?? "",
    governorateName: farm.governorateName,
    cityName: farm.cityName,
    areaName: typeof farm.area === "string" ? farm.area : undefined,
  };
}

function farmHasCompleteLocation(farm?: Farm | null): boolean {
  return Boolean(farm?.governorateId && farm?.cityId && farm?.areaId);
}

const AUCTION_RETURN = "/auctions/create";

function CreateAuctionForm() {
  const { user, isLoading, isAuthenticated, requireAuth } = useAuth();
  const { canCreateAuction } = useUserPermissions();
  const { t } = useI18n();
  const { localized } = useLocalizedLabel();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState<StepId>("farm");
  const [farmId, setFarmId] = useState<number | "">("");
  const [selectedFarm, setSelectedFarm] = useState<Farm | null>(null);
  const [selectedCrop, setSelectedCrop] = useState<Crop | null>(null);
  const [cropId, setCropId] = useState<number | "">("");
  const [location, setLocation] = useState<LocationSelection>(emptyLocation());
  const [startingPrice, setStartingPrice] = useState("");
  const [minIncrement, setMinIncrement] = useState("1000");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [secondEndTime, setSecondEndTime] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const skipLocationStep = useMemo(
    () => farmHasCompleteLocation(selectedFarm),
    [selectedFarm],
  );

  const steps = useMemo<StepId[]>(
    () =>
      skipLocationStep
        ? ["farm", "details", "schedule"]
        : ["farm", "location", "details", "schedule"],
    [skipLocationStep],
  );

  const stepIndex = steps.indexOf(step);

  useEffect(() => {
    requireAuth();
  }, [requireAuth]);

  useEffect(() => {
    const qFarm = searchParams.get("farmId");
    const qCrop = searchParams.get("cropId");
    if (qFarm) setFarmId(Number(qFarm));
    if (qCrop) setCropId(Number(qCrop));
  }, [searchParams]);

  const handleFarmChange = useCallback((id: number, farm?: Farm) => {
    setFarmId(id || "");
    setSelectedFarm(farm ?? null);
    setLocation(farmToLocation(farm));
  }, []);

  const handleCropChange = useCallback(
    (id: number, crop?: Crop) => {
      setCropId(id || "");
      setSelectedCrop(crop ?? null);
      if (crop) {
        const name =
          localized(crop as unknown as Record<string, unknown>, "name") ||
          crop.nameAr ||
          crop.cropName ||
          crop.name;
        if (name) setTitle((prev) => prev || t("auctions.titleWithCrop", "", { name }));
        if (crop.imageUrls?.length) setImageUrls(crop.imageUrls);
      }
    },
    [localized, t],
  );

  function goNext() {
    const i = steps.indexOf(step);
    if (i >= 0 && i < steps.length - 1) setStep(steps[i + 1]);
  }

  function goBack() {
    const i = steps.indexOf(step);
    if (i > 0) setStep(steps[i - 1]);
  }

  if (isLoading) {
    return (
      <PageContainer className="py-16 text-center text-slate-500">
        {t("common.loadingEllipsis")}
      </PageContainer>
    );
  }

  if (!isAuthenticated) return null;

  if (!canCreateAuction) {
    return (
      <PageContainer className="py-16 text-center text-red-600">
        {t("auctions.noCreatePermission")}
      </PageContainer>
    );
  }

  const locationReady =
    location.governorateId && location.cityId && location.areaId;

  function validateTimes(): string | null {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const second = secondEndTime ? new Date(secondEndTime) : null;
    if (end <= start) return t("auctions.endAfterStart");
    if (second) {
      if (second > end) return t("auctions.secondEndBeforeEnd");
      if (second <= start) return t("auctions.secondEndAfterStart");
    }
    return null;
  }

  async function submit() {
    if (!user?.userId || !cropId) return;
    if (!skipLocationStep && !locationReady) {
      setError(t("auctions.farmLocationIncomplete"));
      return;
    }
    const timeErr = validateTimes();
    if (timeErr) {
      setError(timeErr);
      return;
    }
    if (!description.trim()) {
      setError(t("auctions.descriptionRequired"));
      return;
    }
    const hasImages =
      imageUrls.length > 0 || (selectedCrop?.imageUrls?.length ?? 0) > 0;
    if (!hasImages) {
      setError(t("auctions.imageRequired"));
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      if (farmId) {
        const fid = Number(farmId);
        const locationChanged =
          !skipLocationStep &&
          (Number(selectedFarm?.governorateId) !== Number(location.governorateId) ||
            Number(selectedFarm?.cityId) !== Number(location.cityId) ||
            Number(selectedFarm?.areaId) !== Number(location.areaId));

        if (locationChanged) {
          let farmName = selectedFarm?.name?.trim() || selectedFarm?.nameAr?.trim();
          if (!farmName) {
            const full = await getFarm(fid).catch(() => null);
            farmName = full?.name?.trim() || full?.nameAr?.trim();
          }
          if (!farmName) {
            throw new Error(t("auctions.farmUpdateNameRequired"));
          }

          await updateFarm(fid, user.userId, {
            name: farmName,
            governorateId: Number(location.governorateId),
            cityId: Number(location.cityId),
            areaId: Number(location.areaId),
            governorate: location.governorateName,
            city: location.cityName,
            canStoreAfterHarvest: false,
          });
        }
      }

      if (selectedCrop?.cropId && imageUrls.length > 0) {
        const existing = selectedCrop.imageUrls ?? [];
        const merged = [...new Set([...existing, ...imageUrls])];
        if (merged.length !== existing.length) {
          await updateCrop(selectedCrop.cropId, {
            farmId: selectedCrop.farmId ?? Number(farmId),
            productId: selectedCrop.productId,
            name: selectedCrop.nameAr || selectedCrop.cropName || selectedCrop.name,
            quantity: selectedCrop.quantity,
            unit: selectedCrop.unit,
            harvestDate: selectedCrop.harvestDate ?? new Date().toISOString(),
            imageUrls: merged,
          });
        }
      }

      const endIso = toIso(endTime, t("auctions.invalidDate"));
      const startIso = toIso(startTime, t("auctions.invalidDate"));
      const secondIso = secondEndTime ? toIso(secondEndTime, t("auctions.invalidDate")) : endIso;

      await createAuction(user.userId, {
        cropId: Number(cropId),
        startingPrice: Number(startingPrice),
        minIncrement: Number(minIncrement),
        startTime: startIso,
        endTime: endIso,
        secondEndTime: secondIso,
        auctionTitle: title.trim() || undefined,
        auctionDescription: description.trim(),
      });
      router.push("/auctions");
    } catch (e) {
      setError(e instanceof Error ? e.message : t("auctions.createFailed"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <PageHeader title={t("auctions.createTitle")} backHref="/auctions" />
      <PageContainer narrow className="py-8">
        <div className="mb-6 flex gap-2">
          {steps.map((s, i) => (
            <span
              key={s}
              className={`h-2 flex-1 rounded-full ${stepIndex >= i ? "bg-emerald-600" : "bg-slate-200"}`}
            />
          ))}
        </div>
        <div className="space-y-4 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          {step === "farm" && (
            <>
              <p className="text-sm text-slate-600">{t("auctions.stepFarm")}</p>
              {skipLocationStep && selectedFarm && (
                <p className="rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
                  {t("auctions.farmLocationSaved", "", {
                    location: [selectedFarm.governorateName, selectedFarm.cityName, selectedFarm.area]
                      .filter(Boolean)
                      .join(" — "),
                  })}
                </p>
              )}
              <FarmCropSelect
                cropId={cropId}
                farmId={farmId}
                returnTo={AUCTION_RETURN}
                onCropChange={handleCropChange}
                onFarmChange={handleFarmChange}
                onlyAvailable
              />
              <Button fullWidth disabled={!cropId} onClick={goNext}>
                {t("common.next")}
              </Button>
            </>
          )}

          {step === "location" && (
            <>
              <p className="text-sm text-slate-600">{t("auctions.stepLocation")}</p>
              <p className="text-xs text-amber-700">{t("auctions.farmLocationMissing")}</p>
              <LocationCascadeSelect value={location} onChange={setLocation} />
              <div className="flex gap-2">
                <Button variant="outline" fullWidth onClick={goBack}>
                  {t("common.back")}
                </Button>
                <Button fullWidth disabled={!locationReady} onClick={goNext}>
                  {t("common.next")}
                </Button>
              </div>
            </>
          )}

          {step === "details" && (
            <>
              <p className="text-sm text-slate-600">{t("auctions.stepDetails")}</p>
              <Input
                label={t("auctions.startingPriceCurrency", "", { currency: t("common.currency") })}
                type="number"
                value={startingPrice}
                onChange={(e) => setStartingPrice(e.target.value)}
                required
              />
              <Input
                label={t("auctions.minIncrementShort")}
                type="number"
                value={minIncrement}
                onChange={(e) => setMinIncrement(e.target.value)}
                required
              />
              <Input
                label={t("auctions.auctionTitleLabel")}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium text-slate-700">{t("auctions.descriptionLabel")}</span>
                <textarea
                  className="min-h-[88px] rounded-xl border border-gray-200 px-3 py-2.5"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={t("auctions.descriptionPlaceholder")}
                  required
                />
              </label>
              <ImageUploadField
                label={t("auctions.cropImages")}
                value={imageUrls}
                onChange={setImageUrls}
                folder="auctions"
              />
              <div className="flex gap-2">
                <Button variant="outline" fullWidth onClick={goBack}>
                  {t("common.back")}
                </Button>
                <Button
                  fullWidth
                  disabled={
                    !startingPrice ||
                    !minIncrement ||
                    !description.trim() ||
                    (imageUrls.length === 0 && !(selectedCrop?.imageUrls?.length ?? 0))
                  }
                  onClick={goNext}
                >
                  {t("common.next")}
                </Button>
              </div>
            </>
          )}

          {step === "schedule" && (
            <>
              <Input
                label={t("auctions.startTime")}
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
              />
              <Input
                label={t("auctions.endTime")}
                type="datetime-local"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
              />
              <Input
                label={t("auctions.secondEndTime")}
                type="datetime-local"
                value={secondEndTime}
                onChange={(e) => setSecondEndTime(e.target.value)}
              />
              <p className="text-xs text-slate-500">{t("auctions.secondEndHint")}</p>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <div className="flex gap-2">
                <Button variant="outline" fullWidth onClick={goBack}>
                  {t("common.back")}
                </Button>
                <Button fullWidth onClick={submit} disabled={submitting}>
                  {submitting ? t("auctions.publishing") : t("auctions.publishAuction")}
                </Button>
              </div>
            </>
          )}
        </div>
      </PageContainer>
    </>
  );
}

export default function CreateAuctionPage() {
  const { t } = useI18n();

  return (
    <Suspense
      fallback={
        <PageContainer className="py-16 text-center text-slate-500">
          {t("common.loadingEllipsis")}
        </PageContainer>
      }
    >
      <CreateAuctionForm />
    </Suspense>
  );
}
