import { apiGet, apiPost } from "@/lib/api";
import { API, REGISTRATION_STEP3_ROLE } from "@/lib/api-endpoints";

export async function startRegistration() {
  return apiPost<{ registrationId: string; currentStep: number }>(
    API.registration.start,
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
  return apiPost(API.registration.step1, body);
}

export async function verifyOtp(registrationId: string, otp: string) {
  return apiPost(API.registration.verifyOtp, { registrationId, otp });
}

export async function resendOtp(registrationId: string) {
  return apiPost(API.registration.resendOtp, { registrationId });
}

export async function registrationStep2(
  registrationId: string,
  roleName: string,
) {
  return apiPost(API.registration.step2, { registrationId, roleName });
}

export async function registrationStep3(
  role: string,
  body: Record<string, unknown>,
) {
  const slug = REGISTRATION_STEP3_ROLE[role] ?? role;
  return apiPost(API.registration.step3(slug), body);
}

export async function uploadDocument(formData: FormData) {
  return apiPost("/api/registration/step/4/document", formData);
}

/** Swagger: body is raw registration GUID JSON string */
export async function completeDocuments(registrationId: string) {
  return apiPost("/api/registration/step/4/complete", registrationId);
}

export async function registrationPayout(body: Record<string, unknown>) {
  return apiPost("/api/registration/step/5/payout", body);
}

export async function completePayout(registrationId: string) {
  return apiPost("/api/registration/step/5/complete", registrationId);
}

export async function submitRegistration(registrationId: string) {
  return apiPost(API.registration.submit, registrationId);
}

export async function getRegistration(registrationId: string) {
  return apiGet(`/api/registration/${registrationId}`);
}
