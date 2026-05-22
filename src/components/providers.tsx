"use client";

import { SWRConfig } from "swr";
import { AuthProvider } from "@/context/AuthContext";
import { defaultSwrConfig } from "@/lib/swr-config";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SWRConfig value={defaultSwrConfig}>
      <AuthProvider>{children}</AuthProvider>
    </SWRConfig>
  );
}
