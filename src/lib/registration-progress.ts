/** حقول استئناف التسجيل من login / profile/me */
export interface RegistrationProgress {
  registrationId?: string | null;
  currentStep?: number;
  resumeStep?: number;
  otpVerified?: boolean;
  registrationIncomplete?: boolean;
  documentsPending?: boolean;
}

export function parseRegistrationProgress(raw: unknown): RegistrationProgress {
  if (!raw || typeof raw !== "object") return {};
  const r = raw as Record<string, unknown>;
  const registrationId = String(r.registrationId ?? r.RegistrationId ?? "").trim() || null;
  const currentStep = Number(r.currentStep ?? r.CurrentStep);
  const resumeStep = Number(r.resumeStep ?? r.ResumeStep);
  return {
    registrationId,
    currentStep: Number.isFinite(currentStep) ? currentStep : undefined,
    resumeStep: Number.isFinite(resumeStep) ? resumeStep : undefined,
    otpVerified: Boolean(r.otpVerified ?? r.OtpVerified),
    registrationIncomplete: Boolean(
      r.registrationIncomplete ?? r.RegistrationIncomplete,
    ),
    documentsPending: Boolean(r.documentsPending ?? r.DocumentsPending),
  };
}

export function isRegistrationIncomplete(p: RegistrationProgress | null | undefined): boolean {
  return Boolean(p?.registrationIncomplete && p.registrationId);
}

/**
 * تحويل resumeStep من الـ API إلى خطوة واجهة التسجيل (0–5).
 * 0 بداية | 1 حساب | 2 OTP | 3 دور | 4 ملف | 5 دفع
 */
export function resumeStepToRegisterUiStep(p: RegistrationProgress): number {
  if (p.otpVerified === false) return 2;

  const resume = p.resumeStep ?? p.currentStep ?? 1;

  if (p.documentsPending || resume >= 5) return 5;
  if (resume === 4) return 5;
  if (resume === 3) return 4;
  if (resume === 2) return 3;
  if (resume === 1 && p.otpVerified) return 3;

  return 1;
}

export function buildRegisterResumeQuery(p: RegistrationProgress): string {
  const params = new URLSearchParams();
  if (p.registrationId) params.set("registrationId", p.registrationId);
  const uiStep = resumeStepToRegisterUiStep(p);
  params.set("step", String(uiStep));
  const apiResume = p.resumeStep ?? p.currentStep;
  if (apiResume != null && Number.isFinite(apiResume)) {
    params.set("resumeStep", String(apiResume));
  }
  return params.toString();
}

export function registerResumePath(p: RegistrationProgress): string {
  return `/register?${buildRegisterResumeQuery(p)}`;
}
