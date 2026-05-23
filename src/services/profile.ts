import { apiGet, apiPost, apiPut } from "@/lib/api";
import { API } from "@/lib/api-endpoints";
import type { AuthUser } from "@/types";

export async function getMyProfile() {
  return apiGet<AuthUser & Record<string, unknown>>(API.profile.me);
}

export async function updateProfile(body: {
  fullName?: string;
  email?: string;
  phone?: string;
}) {
  return apiPut<AuthUser & Record<string, unknown>>(API.profile.me, body);
}

export async function requestPhoneChange(newPhone: string) {
  return apiPost<{ otpSent?: boolean; message?: string }>(
    API.profile.phoneChangeRequest,
    { newPhone: newPhone.replace(/\s/g, "").trim() },
  );
}

export async function confirmPhoneChange(newPhone: string, otp: string) {
  return apiPost(API.profile.phoneChangeConfirm, {
    newPhone: newPhone.replace(/\s/g, "").trim(),
    otp: otp.replace(/\s/g, "").trim(),
  });
}
