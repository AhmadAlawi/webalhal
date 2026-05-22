import { getApiBaseUrl } from "./config";
import {
  getAccessToken,
  getRefreshToken,
  getStoredUser,
  setAuthSession,
  clearAuthSession,
} from "./auth-storage";
import { unwrapEnvelopeData } from "./api-envelope";
import type { ApiEnvelope } from "@/types";

export class ApiClientError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
    public traceId?: string,
  ) {
    super(message);
    this.name = "ApiClientError";
  }
}

type RequestOptions = RequestInit & {
  skipAuth?: boolean;
  raw?: boolean;
  _retried?: boolean;
};

let refreshInFlight: Promise<boolean> | null = null;

async function tryRefreshSession(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;

  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      try {
        const { refreshAccessToken } = await import("@/services/auth");
        const data = await refreshAccessToken(refreshToken);
        const user = getStoredUser();
        if (user && data.accessToken) {
          setAuthSession(
            data.accessToken,
            user,
            data.refreshToken ?? refreshToken,
          );
          return true;
        }
        return false;
      } catch {
        clearAuthSession();
        return false;
      } finally {
        refreshInFlight = null;
      }
    })();
  }

  return refreshInFlight;
}

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { skipAuth, raw, _retried, ...init } = options;
  const headers = new Headers(init.headers);

  if (!headers.has("Content-Type") && !(init.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  if (!skipAuth) {
    const token = getAccessToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }

  const res = await fetch(`${getApiBaseUrl()}${path}`, {
    ...init,
    headers,
  });

  if (res.status === 401 && !skipAuth && !_retried) {
    const refreshed = await tryRefreshSession();
    if (refreshed) {
      return apiRequest<T>(path, { ...options, _retried: true });
    }
    if (typeof window !== "undefined") {
      clearAuthSession();
      window.location.href = "/login";
    }
    throw new ApiClientError("انتهت الجلسة", 401);
  }

  const text = await res.text();
  let body: unknown = null;
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }
  }

  if (raw) return body as T;

  const envelope = body as ApiEnvelope<T>;

  if (res.status === 409 && envelope && "registrationId" in (envelope as object)) {
    throw new ApiClientError(
      "registration_incomplete",
      409,
      "registration_incomplete",
    );
  }

  if (!res.ok) {
    const err = envelope?.error;
    throw new ApiClientError(
      err?.detail || err?.title || envelope?.message || res.statusText,
      res.status,
      err?.code,
      envelope?.traceId,
    );
  }

  if (envelope && typeof envelope === "object" && "success" in envelope) {
    if (!envelope.success) {
      throw new ApiClientError(
        envelope.error?.detail || envelope.message || "Request failed",
        res.status,
        envelope.error?.code,
        envelope.traceId,
      );
    }
    return unwrapEnvelopeData<T>(envelope.data ?? envelope);
  }

  return unwrapEnvelopeData<T>(body);
}

export function apiGet<T>(path: string, init?: RequestOptions) {
  return apiRequest<T>(path, { ...init, method: "GET" });
}

export function apiPost<T>(path: string, body?: unknown, init?: RequestOptions) {
  return apiRequest<T>(path, {
    ...init,
    method: "POST",
    body: body instanceof FormData ? body : JSON.stringify(body ?? {}),
  });
}

export function apiPut<T>(path: string, body?: unknown, init?: RequestOptions) {
  return apiRequest<T>(path, {
    ...init,
    method: "PUT",
    body: JSON.stringify(body ?? {}),
  });
}

export function apiDelete<T>(path: string, init?: RequestOptions) {
  return apiRequest<T>(path, { ...init, method: "DELETE" });
}
