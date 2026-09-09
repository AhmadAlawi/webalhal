"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { AuthCard } from "@/components/ui/AuthCard";
import { useI18n } from "@/context/I18nContext";
import {
  confirmPasswordReset,
  requestPasswordResetOtp,
} from "@/services/password-reset";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { t } = useI18n();
  const [step, setStep] = useState<0 | 1>(0);
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleRequestOtp(e: React.FormEvent) {
    e.preventDefault();
    if (!phone.trim()) {
      setError(t("auth.enterPhoneIntl"));
      return;
    }
    setLoading(true);
    setError("");
    setMsg("");
    try {
      const res = await requestPasswordResetOtp(phone);
      setMsg(res.message || t("auth.otpSentIfExists"));
      setStep(1);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("auth.sendOtpFailed"));
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirm(e: React.FormEvent) {
    e.preventDefault();
    if (!otp.trim()) {
      setError(t("auth.enterVerificationCode"));
      return;
    }
    if (newPassword.length < 6) {
      setError(t("auth.passwordMinLength"));
      return;
    }
    if (newPassword !== confirm) {
      setError(t("auth.passwordMismatch"));
      return;
    }
    setLoading(true);
    setError("");
    try {
      await confirmPasswordReset({ phone, otp, newPassword });
      router.push("/login?reset=1");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("auth.resetFailed"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthCard
      title={t("auth.forgotPasswordTitle")}
      subtitle={step === 0 ? t("auth.forgotPasswordStep0") : t("auth.forgotPasswordStep1")}
      footer={
        <p className="mt-6 text-center text-sm">
          <Link href="/login" className="font-medium text-emerald-600 hover:underline">
            {t("auth.backToLogin")}
          </Link>
        </p>
      }
    >
      {step === 0 ? (
        <form onSubmit={handleRequestOtp} className="space-y-4">
          <Input
            label={t("auth.phoneNumber")}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder={t("auth.phonePlaceholder")}
          />
          {error && <p className="rounded-xl bg-red-50 px-4 py-2 text-sm text-red-600">{error}</p>}
          {msg && <p className="rounded-xl bg-emerald-50 px-4 py-2 text-sm text-emerald-700">{msg}</p>}
          <Button type="submit" fullWidth disabled={loading}>
            {loading ? t("common.sending") : t("auth.sendVerificationCode")}
          </Button>
        </form>
      ) : (
        <form onSubmit={handleConfirm} className="space-y-4">
          <Input
            label={t("auth.verificationCode")}
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
          />
          <Input
            label={t("auth.newPassword")}
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <Input
            label={t("auth.confirmPassword")}
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
          {error && <p className="rounded-xl bg-red-50 px-4 py-2 text-sm text-red-600">{error}</p>}
          <Button type="submit" fullWidth disabled={loading}>
            {loading ? t("common.saving") : t("auth.changePassword")}
          </Button>
        </form>
      )}
    </AuthCard>
  );
}
