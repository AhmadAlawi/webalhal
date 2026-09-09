"use client";

import { SWRConfig } from "swr";
import { DocumentMeta } from "@/components/i18n/DocumentMeta";
import { AuthProvider } from "@/context/AuthContext";
import { I18nProvider } from "@/context/I18nContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { defaultSwrConfig } from "@/lib/swr-config";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SWRConfig value={defaultSwrConfig}>
      <I18nProvider>
        <DocumentMeta />
        <ThemeProvider>
          <AuthProvider>{children}</AuthProvider>
        </ThemeProvider>
      </I18nProvider>
    </SWRConfig>
  );
}
