import { apiGet, apiPost, apiPut } from "@/lib/api";
import type { AuthUser } from "@/types";

export async function getMyProfile() {
  return apiGet<AuthUser & Record<string, unknown>>("/api/profile");
}

export async function updateProfile(body: {
  fullName?: string;
  email?: string;
  phone?: string;
}) {
  return apiPut<AuthUser & Record<string, unknown>>("/api/profile", body);
}

export async function requestPhoneChange(newPhone: string) {
  return apiPost<{ otpSent?: boolean; message?: string }>(
    "/api/profile/phone-change/request",
    { newPhone: newPhone.replace(/\s/g, "").trim() },
  );
}

export async function confirmPhoneChange(newPhone: string, otp: string) {
  return apiPost("/api/profile/phone-change/confirm", {
    newPhone: newPhone.replace(/\s/g, "").trim(),
    otp: otp.replace(/\s/g, "").trim(),
  });
}
