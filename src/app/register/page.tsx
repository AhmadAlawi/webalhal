"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { StepProgress } from "@/components/ui/StepProgress";
import { Card } from "@/components/ui/Card";
import {
  startRegistration,
  registrationStep1,
  verifyOtp,
  resendOtp,
  registrationStep2,
  registrationStep3,
  completeDocuments,
  registrationPayout,
  completePayout,
  submitRegistration,
} from "@/services/registration";

const ROLES = [
  { id: "farmer", label: "مزارع" },
  { id: "trader", label: "تاجر" },
  { id: "transporter", label: "ناقل" },
  { id: "gov_employee", label: "موظف حكومي" },
];

function RegisterForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [step, setStep] = useState(0);
  const [registrationId, setRegistrationId] = useState("");
  const [roleName, setRoleName] = useState("farmer");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");

  useEffect(() => {
    const id = params.get("registrationId");
    if (id) {
      setRegistrationId(id);
      setStep(1);
    }
  }, [params]);

  async function handleStart() {
    setLoading(true);
    setError("");
    try {
      const data = await startRegistration();
      setRegistrationId(data.registrationId);
      setStep(1);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function handleStep1(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await registrationStep1({ registrationId, fullName, email, phone, password });
      setStep(2);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function handleOtp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await verifyOtp(registrationId, otp);
      setStep(3);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function handleRole(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await registrationStep2(registrationId, roleName);
      setStep(4);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function handleProfile(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const body: Record<string, unknown> = { registrationId };
    if (roleName === "farmer") {
      body.nationality = "سوري";
      body.storageAvailable = false;
      body.landOwnership = "ملك";
    } else if (roleName === "trader") {
      body.companyName = fullName;
      body.activity = "تجارة زراعية";
      body.canBuy = true;
      body.canImport = false;
      body.canExport = false;
    } else if (roleName === "transporter") {
      body.companyName = fullName;
    }
    try {
      await registrationStep3(roleName === "gov_employee" ? "farmer" : roleName, body);
      await completeDocuments(registrationId);
      setStep(5);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function handlePayout(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await registrationPayout({
        registrationId,
        type: 1,
        providerName: "محفظة",
      });
      await completePayout(registrationId);
      await submitRegistration(registrationId);
      router.push("/login");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-lg animate-fade-up pb-8">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-slate-900">إنشاء حساب</h1>
        <p className="mt-1 text-sm text-slate-500">خطوات بسيطة للانضمام إلى رزق</p>
      </div>
      <StepProgress step={step} />
      <Card padding="lg">
        {step === 0 && (
          <div className="space-y-4">
            <p className="text-slate-600">ابدأ التسجيل في منصة رزق</p>
            <Button fullWidth onClick={handleStart} disabled={loading}>
              بدء التسجيل
            </Button>
          </div>
        )}

        {step === 1 && (
          <form onSubmit={handleStep1} className="space-y-4">
            <Input label="الاسم الكامل" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
            <Input label="البريد" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <Input label="الهاتف" value={phone} onChange={(e) => setPhone(e.target.value)} required />
            <Input label="كلمة المرور" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            <Button type="submit" fullWidth disabled={loading}>التالي</Button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleOtp} className="space-y-4">
            <p className="text-sm text-slate-600">أدخل رمز التحقق المرسل إلى هاتفك</p>
            <Input label="رمز OTP" value={otp} onChange={(e) => setOtp(e.target.value)} required />
            <Button type="button" variant="ghost" onClick={() => resendOtp(registrationId)}>
              إعادة الإرسال
            </Button>
            <Button type="submit" fullWidth disabled={loading}>تحقق</Button>
          </form>
        )}

        {step === 3 && (
          <form onSubmit={handleRole} className="space-y-4">
            <p className="font-medium">اختر نوع الحساب</p>
            {ROLES.map((r) => (
              <label
                key={r.id}
                className={`flex cursor-pointer items-center gap-3 rounded-2xl border p-4 transition-colors ${
                  roleName === r.id
                    ? "border-emerald-300 bg-emerald-50"
                    : "border-slate-200 hover:border-emerald-200"
                }`}
              >
                <input
                  type="radio"
                  name="role"
                  value={r.id}
                  checked={roleName === r.id}
                  onChange={() => setRoleName(r.id)}
                  className="accent-emerald-600"
                />
                <span className="font-medium text-slate-800">{r.label}</span>
              </label>
            ))}
            <Button type="submit" fullWidth disabled={loading}>التالي</Button>
          </form>
        )}

        {step === 4 && (
          <form onSubmit={handleProfile} className="space-y-4">
            <p className="text-slate-600">أكمل بيانات ملفك — يمكن تحديثها لاحقاً من الحساب</p>
            <Button type="submit" fullWidth disabled={loading}>متابعة</Button>
          </form>
        )}

        {step === 5 && (
          <form onSubmit={handlePayout} className="space-y-4">
            <p className="text-slate-600">إعداد طريقة الدفع (محفظة افتراضية)</p>
            <Button type="submit" fullWidth disabled={loading}>إرسال الطلب</Button>
          </form>
        )}

        {error && (
          <p className="mt-4 rounded-xl bg-red-50 px-4 py-2 text-sm text-red-600">{error}</p>
        )}
      </Card>

      <p className="mt-6 text-center text-sm">
        لديك حساب؟ <Link href="/login" className="text-emerald-600 font-semibold">دخول</Link>
      </p>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">جاري التحميل...</div>}>
      <RegisterForm />
    </Suspense>
  );
}
