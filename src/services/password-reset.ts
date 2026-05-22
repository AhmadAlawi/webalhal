import { apiPost } from "@/lib/api";

export async function requestPasswordResetOtp(phone: string) {
  return apiPost<{ sent?: boolean; message?: string }>(
    "/api/password-reset/request-otp",
    { phone: phone.replace(/\s/g, "").trim() },
    { skipAuth: true },
  );
}

export async function confirmPasswordReset(body: {
  phone: string;
  otp: string;
  newPassword: string;
}) {
  return apiPost(
    "/api/password-reset/confirm",
    {
      phone: body.phone.replace(/\s/g, "").trim(),
      otp: body.otp.replace(/\s/g, "").trim(),
      newPassword: body.newPassword,
    },
    { skipAuth: true },
  );
}
