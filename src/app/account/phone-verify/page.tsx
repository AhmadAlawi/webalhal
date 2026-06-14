"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageContainer } from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { confirmPhoneChange, requestPhoneChange } from "@/services/profile";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/context/I18nContext";

function PhoneVerifyContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { refreshProfile, requireAuth } = useAuth();
  const { t } = useI18n();
  const newPhone = searchParams.get("phone") ?? "";

  const [otp, setOtp] = useState("");
  const [requesting, setRequesting] = useState(true);
  const [otpSent, setOtpSent] = useState<boolean | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!requireAuth() || !newPhone) return;
    requestPhoneChange(newPhone)
      .then((r) => setOtpSent(r.otpSent ?? true))
      .catch((e) => setError(e instanceof Error ? e.message : t("account.otpSendFailed")))
      .finally(() => setRequesting(false));
  }, [newPhone, requireAuth, t]);

  async function handleConfirm(e: React.FormEvent) {
    e.preventDefault();
    if (!otp.trim()) {
      setError(t("account.enterOtp"));
      return;
    }
    setLoading(true);
    setError("");
    try {
      await confirmPhoneChange(newPhone, otp);
      await refreshProfile();
      router.push("/account/profile");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("account.invalidOtp"));
    } finally {
      setLoading(false);
    }
  }

  if (!newPhone) {
    return <p className="text-center text-slate-500">{t("account.invalidPhone")}</p>;
  }

  return (
    <form onSubmit={handleConfirm} className="mx-auto max-w-md space-y-4 rounded-2xl border bg-white p-8 shadow-sm">
      <p className="text-sm text-slate-600">
        {(() => {
          const parts = t("account.otpSentTo", "", { phone: "__PHONE__" }).split("__PHONE__");
          return (
            <>
              {parts[0]}
              <strong dir="ltr">{newPhone}</strong>
              {parts[1]}
            </>
          );
        })()}
        {otpSent === false && t("account.devOtpHint")}
      </p>
      {requesting ? (
        <p className="text-center text-slate-500">{t("account.sendingOtp")}</p>
      ) : (
        <>
          <Input label={t("account.otpLabel")} value={otp} onChange={(e) => setOtp(e.target.value)} />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" fullWidth disabled={loading}>
            {loading ? t("account.confirming") : t("account.confirmPhone")}
          </Button>
        </>
      )}
    </form>
  );
}

export default function PhoneVerifyPage() {
  const { t } = useI18n();

  return (
    <>
      <PageHeader title={t("account.phoneVerifyTitle")} backHref="/account/profile" />
      <PageContainer className="py-8">
        <Suspense fallback={<p className="text-center text-slate-500">{t("common.loadingEllipsis")}</p>}>
          <PhoneVerifyContent />
        </Suspense>
      </PageContainer>
    </>
  );
}
