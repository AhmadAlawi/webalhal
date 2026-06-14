"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageContainer } from "@/components/layout/PageContainer";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/context/I18nContext";
import { useUserPermissions } from "@/hooks/useUserPermissions";
import { getMyProfile, updateProfile } from "@/services/profile";
import { UserRole } from "@/types";

function roleLabelKey(roleId?: UserRole): string {
  switch (roleId) {
    case UserRole.Farmer:
      return "account.roles.farmer";
    case UserRole.Trader:
      return "account.roles.trader";
    case UserRole.Transport:
      return "account.roles.transporter";
    case UserRole.Government:
      return "account.roles.government";
    default:
      return "account.roles.guest";
  }
}

export default function ProfilePage() {
  const router = useRouter();
  const { t } = useI18n();
  const { user, requireAuth, refreshProfile, isLoading: authLoading } = useAuth();
  const { roleId } = useUserPermissions();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const originalPhone = useRef("");
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!requireAuth("/account/profile")) return;
    getMyProfile()
      .then((p) => {
        setFullName((p.fullName as string) ?? user?.fullName ?? "");
        setEmail((p.email as string) ?? user?.email ?? "");
        const ph = (p.phone as string) ?? user?.phone ?? "";
        setPhone(ph);
        originalPhone.current = ph;
      })
      .catch(() => {
        setFullName(user?.fullName ?? "");
        setEmail(user?.email ?? "");
        const ph = user?.phone ?? "";
        setPhone(ph);
        originalPhone.current = ph;
      });
  }, [requireAuth, user]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const phoneNorm = phone.replace(/\s/g, "").trim();
    const origNorm = originalPhone.current.replace(/\s/g, "").trim();

    if (phoneNorm && phoneNorm !== origNorm) {
      router.push(`/account/phone-verify?phone=${encodeURIComponent(phoneNorm)}`);
      return;
    }

    setSaving(true);
    setError(null);
    setStatus(null);
    try {
      await updateProfile({ fullName, email });
      await refreshProfile();
      setStatus(t("account.profileSaved"));
    } catch (err) {
      setError(err instanceof Error ? err.message : t("account.saveFailed"));
    } finally {
      setSaving(false);
    }
  }

  if (authLoading) {
    return (
      <PageContainer className="py-16 text-center text-slate-500">{t("common.loadingEllipsis")}</PageContainer>
    );
  }

  return (
    <>
      <PageHeader title={t("account.profile")} backHref="/account" />
      <PageContainer narrow className="py-8">
        <form
          onSubmit={handleSave}
          className="space-y-5 rounded-2xl border border-gray-200 bg-white p-8 shadow-sm"
        >
          <p className="text-sm text-slate-500">
            {t("account.accountType")}:{" "}
            <span className="font-medium text-slate-800">{t(roleLabelKey(roleId))}</span>
          </p>

          <Input
            label={t("account.fullName")}
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
          <Input
            label={t("account.email")}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input label={t("account.phone")} value={phone} onChange={(e) => setPhone(e.target.value)} />

          {status && <p className="text-sm text-emerald-600">{status}</p>}
          {error && <p className="text-sm text-red-600">{error}</p>}

          <Button type="submit" fullWidth disabled={saving}>
            {saving ? t("common.saving") : t("account.saveChanges")}
          </Button>
        </form>
      </PageContainer>
    </>
  );
}
