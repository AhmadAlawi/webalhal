"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  parseRegistrationProgress,
  registerResumePath,
} from "@/lib/registration-progress";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { AuthCard } from "@/components/ui/AuthCard";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await login(emailOrPhone, password);
      if (!result.registrationIncomplete) {
        router.push("/");
      }
    } catch (err) {
      const ex = err as Error & Record<string, unknown>;
      if (ex.message === "registration_incomplete") {
        router.push(registerResumePath(parseRegistrationProgress(ex)));
        return;
      }
      setError(ex.message || "فشل تسجيل الدخول");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthCard
      title="تسجيل الدخول"
      subtitle="مرحباً بعودتك إلى رزق — سوق الهال"
      footer={
        <>
          <p className="mt-6 text-center text-sm">
            <Link href="/forgot-password" className="font-medium text-emerald-600 hover:underline">
              نسيت كلمة المرور؟
            </Link>
          </p>
          <p className="mt-3 text-center text-sm text-slate-600">
            ليس لديك حساب؟{" "}
            <Link href="/register" className="font-semibold text-emerald-600 hover:underline">
              إنشاء حساب
            </Link>
          </p>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="البريد أو الهاتف"
          type="text"
          value={emailOrPhone}
          onChange={(e) => setEmailOrPhone(e.target.value)}
          required
          autoComplete="username"
        />
        <Input
          label="كلمة المرور"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
        />
        {error && (
          <p className="rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-600">{error}</p>
        )}
        <Button type="submit" fullWidth disabled={loading}>
          {loading ? "جاري الدخول..." : "دخول"}
        </Button>
      </form>
    </AuthCard>
  );
}
