"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageContainer } from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { confirmPhoneChange, requestPhoneChange } from "@/services/profile";
import { useAuth } from "@/context/AuthContext";

function PhoneVerifyContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { refreshProfile, requireAuth } = useAuth();
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
      .catch((e) => setError(e instanceof Error ? e.message : "فشل إرسال الرمز"))
      .finally(() => setRequesting(false));
  }, [newPhone, requireAuth]);

  async function handleConfirm(e: React.FormEvent) {
    e.preventDefault();
    if (!otp.trim()) {
      setError("أدخل رمز التحقق");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await confirmPhoneChange(newPhone, otp);
      await refreshProfile();
      router.push("/account/profile");
    } catch (err) {
      setError(err instanceof Error ? err.message : "رمز غير صحيح");
    } finally {
      setLoading(false);
    }
  }

  if (!newPhone) {
    return <p className="text-center text-slate-500">رقم الهاتف غير صالح</p>;
  }

  return (
    <form onSubmit={handleConfirm} className="mx-auto max-w-md space-y-4 rounded-2xl border bg-white p-8 shadow-sm">
      <p className="text-sm text-slate-600">
        تم إرسال رمز التحقق إلى <strong dir="ltr">{newPhone}</strong>
        {otpSent === false && " (قد لا يُرسل OTP في بيئة التطوير — جرّب 000000 إن وُجد)"}
      </p>
      {requesting ? (
        <p className="text-center text-slate-500">جاري إرسال الرمز...</p>
      ) : (
        <>
          <Input label="رمز التحقق (6 أرقام)" value={otp} onChange={(e) => setOtp(e.target.value)} />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" fullWidth disabled={loading}>
            {loading ? "جاري التأكيد..." : "تأكيد الرقم"}
          </Button>
        </>
      )}
    </form>
  );
}

export default function PhoneVerifyPage() {
  return (
    <>
      <PageHeader title="تأكيد رقم الهاتف" backHref="/account/profile" />
      <PageContainer className="py-8">
        <Suspense fallback={<p className="text-center text-slate-500">جاري التحميل...</p>}>
          <PhoneVerifyContent />
        </Suspense>
      </PageContainer>
    </>
  );
}
