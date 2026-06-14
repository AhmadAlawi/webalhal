"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageContainer } from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { createTransportProvider } from "@/services/transport";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/context/I18nContext";
import { UserRole } from "@/types";

export default function TransportRegisterPage() {
  const { t } = useI18n();
  const router = useRouter();
  const { user, requireAuth } = useAuth();
  const [accountType, setAccountType] = useState<"individual" | "company">("individual");
  const [coveredAreas, setCoveredAreas] = useState("");
  const [workersAvailable, setWorkersAvailable] = useState("");
  const [availabilityHours, setAvailabilityHours] = useState("");
  const [estimatedPricePerKm, setEstimatedPricePerKm] = useState("");
  const [walletAccount, setWalletAccount] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (user?.roleId !== UserRole.Transport) {
    return (
      <>
        <PageHeader title={t("transport.register.title")} backHref="/account" />
        <PageContainer className="py-16 text-center text-slate-600">
          {t("transport.register.pageForTransporters")}
        </PageContainer>
      </>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!requireAuth() || !user?.userId) return;
    setLoading(true);
    setError("");
    try {
      await createTransportProvider({
        userId: user.userId,
        accountType,
        coveredAreas: coveredAreas.trim() || undefined,
        workersAvailable: workersAvailable ? Number(workersAvailable) : undefined,
        availabilityHours: availabilityHours.trim() || undefined,
        estimatedPricePerKm: estimatedPricePerKm ? Number(estimatedPricePerKm) : undefined,
        walletAccount: walletAccount.trim() || undefined,
      });
      router.push("/transport/hub");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("transport.register.failed"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <PageHeader title={t("transport.register.titleFull")} backHref="/account" />
      <PageContainer narrow className="py-8">
        <form
          onSubmit={handleSubmit}
          className="space-y-5 rounded-2xl border border-gray-100 bg-white p-8 shadow-sm"
        >
          <p className="text-sm text-slate-600">{t("transport.register.intro")}</p>

          <label className="block text-sm">
            <span className="font-medium text-slate-600">{t("transport.register.accountType")}</span>
            <select
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2"
              value={accountType}
              onChange={(e) => setAccountType(e.target.value as "individual" | "company")}
            >
              <option value="individual">{t("transport.register.individual")}</option>
              <option value="company">{t("transport.register.company")}</option>
            </select>
          </label>

          <Input
            label={t("transport.register.coveredAreas")}
            value={coveredAreas}
            onChange={(e) => setCoveredAreas(e.target.value)}
          />
          <Input
            label={t("transport.register.workersAvailable")}
            type="number"
            value={workersAvailable}
            onChange={(e) => setWorkersAvailable(e.target.value)}
          />
          <Input
            label={t("transport.register.availabilityHours")}
            value={availabilityHours}
            onChange={(e) => setAvailabilityHours(e.target.value)}
          />
          <Input
            label={t("transport.register.estimatedPricePerKm")}
            type="number"
            value={estimatedPricePerKm}
            onChange={(e) => setEstimatedPricePerKm(e.target.value)}
          />
          <Input
            label={t("transport.register.walletAccount")}
            value={walletAccount}
            onChange={(e) => setWalletAccount(e.target.value)}
          />

          {error && <p className="text-sm text-red-600">{error}</p>}

          <Button type="submit" fullWidth disabled={loading}>
            {loading ? t("transport.register.registering") : t("transport.register.createAccount")}
          </Button>
        </form>
      </PageContainer>
    </>
  );
}
