"use client";

import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { getAccessToken } from "@/lib/auth-storage";

export function useRequireAuth(redirectTo = "/login") {
  const { isLoading, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isLoading && !getAccessToken()) {
      window.location.href = redirectTo;
    }
  }, [isLoading, redirectTo]);

  return { isLoading, isAuthenticated };
}
