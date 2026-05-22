"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { AuthCard } from "@/components/ui/AuthCard";
import {
  confirmPasswordReset,
  requestPasswordResetOtp,
} from "@/services/password-reset";

export default function ForgotPasswordPage() {
  const router = useRouter();
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
      setError("أدخل رقم الهاتف بصيغة دولية (+963...)");
      return;
    }
    setLoading(true);
    setError("");
    setMsg("");
    try {
      const res = await requestPasswordResetOtp(phone);
      setMsg(
        res.message ||
          "إن وُجد حساب مرتبط بهذا الرقم، سيتم إرسال رمز التحقق.",
      );
      setStep(1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذّر إرسال الرمز");
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirm(e: React.FormEvent) {
    e.preventDefault();
    if (!otp.trim()) {
      setError("أدخل رمز التحقق");
      return;
    }
    if (newPassword.length < 6) {
      setError("كلمة المرور 6 أحرف على الأقل");
      return;
    }
    if (newPassword !== confirm) {
      setError("تأكيد كلمة المرور غير متطابق");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await confirmPasswordReset({ phone, otp, newPassword });
      router.push("/login?reset=1");
    } catch (err) {
      setError(err instanceof Error ? err.message : "فشل إعادة التعيين");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthCard
      title="استعادة كلمة المرور"
      subtitle={step === 0 ? "أدخل رقم هاتفك المسجّل" : "أدخل الرمز وكلمة المرور الجديدة"}
      footer={
        <p className="mt-6 text-center text-sm">
          <Link href="/login" className="font-medium text-emerald-600 hover:underline">
            العودة لتسجيل الدخول
          </Link>
        </p>
      }
    >
      {step === 0 ? (
        <form onSubmit={handleRequestOtp} className="space-y-4">
          <Input
            label="رقم الهاتف"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+963..."
          />
          {error && <p className="rounded-xl bg-red-50 px-4 py-2 text-sm text-red-600">{error}</p>}
          {msg && <p className="rounded-xl bg-emerald-50 px-4 py-2 text-sm text-emerald-700">{msg}</p>}
          <Button type="submit" fullWidth disabled={loading}>
            {loading ? "جاري الإرسال..." : "إرسال رمز التحقق"}
          </Button>
        </form>
      ) : (
        <form onSubmit={handleConfirm} className="space-y-4">
          <Input label="رمز التحقق" value={otp} onChange={(e) => setOtp(e.target.value)} />
          <Input
            label="كلمة المرور الجديدة"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <Input
            label="تأكيد كلمة المرور"
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
          {error && <p className="rounded-xl bg-red-50 px-4 py-2 text-sm text-red-600">{error}</p>}
          <Button type="submit" fullWidth disabled={loading}>
            {loading ? "جاري الحفظ..." : "تغيير كلمة المرور"}
          </Button>
        </form>
      )}
    </AuthCard>
  );
}
