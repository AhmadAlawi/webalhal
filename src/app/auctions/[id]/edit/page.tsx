"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageContainer } from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { getAuction, getAuctionsCreatedByUser, updateAuction } from "@/services/auctions";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/context/I18nContext";
import { useLocalizedLabel } from "@/hooks/useLocalizedLabel";
import type { LocalizableRecord } from "@/lib/localized-value";

function toIso(local: string): string | undefined {
  if (!local?.trim()) return undefined;
  const d = new Date(local);
  if (Number.isNaN(d.getTime())) return undefined;
  return d.toISOString();
}

export default function EditAuctionPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, requireAuth } = useAuth();
  const { t } = useI18n();
  const { marketTitle } = useLocalizedLabel();
  const auctionId = Number(id);

  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [startingPrice, setStartingPrice] = useState("");
  const [minIncrement, setMinIncrement] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [canEdit, setCanEdit] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!requireAuth() || !auctionId || !user?.userId) return;
    Promise.all([getAuction(auctionId), getAuctionsCreatedByUser(user.userId)])
      .then(([a, mine]) => {
        setCanEdit(mine.some((x) => x.auctionId === auctionId));
        const resolvedTitle = marketTitle(a as unknown as LocalizableRecord, "auction", auctionId);
        setTitle(resolvedTitle || (a.auctionTitle ?? a.cropName ?? ""));
        setDesc(a.auctionDescription ?? "");
        setStartingPrice(String(a.startingPrice ?? ""));
        setMinIncrement(String(a.minIncrement ?? ""));
        if (a.startTime) setStartTime(a.startTime.slice(0, 16));
        if (a.endTime) setEndTime(a.endTime.slice(0, 16));
      })
      .catch(() => setError(t("auctions.loadFailed")))
      .finally(() => setLoading(false));
  }, [auctionId, user?.userId, requireAuth, marketTitle, t]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!canEdit) return;
    setSaving(true);
    setError("");
    try {
      await updateAuction(auctionId, {
        auctionId,
        cropName: title.trim() || undefined,
        startingPrice: startingPrice ? Number(startingPrice) : undefined,
        minIncrement: minIncrement ? Number(minIncrement) : undefined,
        startTime: toIso(startTime),
        endTime: toIso(endTime),
      });
      router.push(`/auctions/${auctionId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("auctions.saveFailed"));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <>
        <PageHeader title={t("auctions.editTitle")} backHref={`/auctions/${id}`} />
        <PageContainer className="py-16 text-center text-slate-500">
          {t("common.loadingEllipsis")}
        </PageContainer>
      </>
    );
  }

  if (!canEdit) {
    return (
      <>
        <PageHeader title={t("auctions.editTitle")} backHref={`/auctions/${id}`} />
        <PageContainer className="py-16 text-center text-red-600">
          {t("auctions.cannotEdit")}
        </PageContainer>
      </>
    );
  }

  return (
    <>
      <PageHeader title={t("auctions.editTitle")} backHref={`/auctions/${id}`} />
      <PageContainer narrow className="py-8">
        <form onSubmit={handleSave} className="space-y-4 rounded-2xl border bg-white p-8 shadow-sm">
          <Input
            label={t("auctions.auctionTitleLabel")}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <label className="block text-sm">
            <span className="font-medium text-slate-600">{t("auctions.description")}</span>
            <textarea
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2"
              rows={4}
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
            />
          </label>
          <Input
            label={t("auctions.startingPrice")}
            type="number"
            value={startingPrice}
            onChange={(e) => setStartingPrice(e.target.value)}
          />
          <Input
            label={t("auctions.minIncrementLabel")}
            type="number"
            value={minIncrement}
            onChange={(e) => setMinIncrement(e.target.value)}
          />
          <Input
            label={t("auctions.startsAt")}
            type="datetime-local"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
          />
          <Input
            label={t("auctions.endsAtLabel")}
            type="datetime-local"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" fullWidth disabled={saving}>
            {saving ? t("common.saving") : t("auctions.saveChanges")}
          </Button>
        </form>
      </PageContainer>
    </>
  );
}
