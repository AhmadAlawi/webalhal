"use client";

import type { ReactNode } from "react";
import { useI18n } from "@/context/I18nContext";

export function AuctionEndedOverlay({
  message,
  children,
}: {
  message?: string;
  children?: ReactNode;
}) {
  const { t } = useI18n();
  const endedLabel = t("auctions.ended");

  return (
    <div
      className="pointer-events-none absolute inset-0 z-30 flex flex-col items-center justify-center rounded-3xl bg-slate-900/55 px-6 py-8 text-center backdrop-blur-[2px]"
      role="status"
      aria-live="polite"
    >
      <div className="pointer-events-auto flex max-w-sm flex-col items-center">
        <p className="text-2xl font-bold text-white drop-shadow-sm">{endedLabel}</p>
        {message && message !== endedLabel && (
          <p className="mt-2 text-sm text-white/90">{message}</p>
        )}
        {children && <div className="mt-5 w-full">{children}</div>}
      </div>
    </div>
  );
}
