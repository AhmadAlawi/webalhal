import { apiGet, apiPost } from "@/lib/api";

export async function startRegistration() {
  return apiPost<{ registrationId: string; currentStep: number }>(
    "/api/registration/start",
    {},
  );
}

export async function registrationStep1(body: {
  registrationId: string;
  fullName: string;
  email: string;
  phone: string;
  password: string;
}) {
  return apiPost("/api/registration/step/1", body);
}

export async function verifyOtp(registrationId: string, otp: string) {
  return apiPost("/api/registration/verify-otp", { registrationId, otp });
}

export async function resendOtp(registrationId: string) {
  return apiPost("/api/registration/resend-otp", { registrationId });
}

export async function registrationStep2(
  registrationId: string,
  roleName: string,
) {
  return apiPost("/api/registration/step/2", { registrationId, roleName });
}

export async function registrationStep3(
  role: string,
  body: Record<string, unknown>,
) {
  return apiPost(`/api/registration/step/3/${role}`, body);
}

export async function uploadDocument(formData: FormData) {
  return apiPost("/api/registration/step/4/document", formData);
}

export async function completeDocuments(registrationId: string) {
  return apiPost("/api/registration/step/4/complete", { registrationId });
}

export async function registrationPayout(body: Record<string, unknown>) {
  return apiPost("/api/registration/step/5/payout", body);
}

export async function completePayout(registrationId: string) {
  return apiPost("/api/registration/step/5/complete", { registrationId });
}

export async function submitRegistration(registrationId: string) {
  return apiPost("/api/registration/submit", { registrationId });
}

export async function getRegistration(registrationId: string) {
  return apiGet(`/api/registration/${registrationId}`);
}
