"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageContainer } from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { createTransportProvider } from "@/services/transport";
import { useAuth } from "@/context/AuthContext";
import { UserRole } from "@/types";

export default function TransportRegisterPage() {
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
        <PageHeader title="تسجيل كناقل" backHref="/account" />
        <PageContainer className="py-16 text-center text-slate-600">
          هذه الصفحة لحسابات الناقل فقط
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
      setError(err instanceof Error ? err.message : "فشل التسجيل كمزود نقل");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <PageHeader title="تسجيل كمزود نقل" backHref="/account" />
      <PageContainer narrow className="py-8">
        <form
          onSubmit={handleSubmit}
          className="space-y-5 rounded-2xl border border-gray-100 bg-white p-8 shadow-sm"
        >
          <p className="text-sm text-slate-600">
            نفس خطوة «تسجيل ناقل» في تطبيق الهاتف — بعد التسجيل أضف خطوط الأسعار والمركبات.
          </p>

          <label className="block text-sm">
            <span className="font-medium text-slate-600">نوع الحساب</span>
            <select
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2"
              value={accountType}
              onChange={(e) => setAccountType(e.target.value as "individual" | "company")}
            >
              <option value="individual">فرد</option>
              <option value="company">شركة</option>
            </select>
          </label>

          <Input
            label="المناطق المغطاة"
            value={coveredAreas}
            onChange={(e) => setCoveredAreas(e.target.value)}
          />
          <Input
            label="عدد العمال المتاحين"
            type="number"
            value={workersAvailable}
            onChange={(e) => setWorkersAvailable(e.target.value)}
          />
          <Input
            label="ساعات التوفر"
            value={availabilityHours}
            onChange={(e) => setAvailabilityHours(e.target.value)}
          />
          <Input
            label="السعر التقديري لكل كم (ل.س)"
            type="number"
            value={estimatedPricePerKm}
            onChange={(e) => setEstimatedPricePerKm(e.target.value)}
          />
          <Input
            label="محفظة / حساب دفع"
            value={walletAccount}
            onChange={(e) => setWalletAccount(e.target.value)}
          />

          {error && <p className="text-sm text-red-600">{error}</p>}

          <Button type="submit" fullWidth disabled={loading}>
            {loading ? "جاري التسجيل..." : "إنشاء حساب الناقل"}
          </Button>
        </form>
      </PageContainer>
    </>
  );
}
