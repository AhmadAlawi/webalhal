"use client";

import { useCallback } from "react";
import { useI18n } from "@/context/I18nContext";
import {
  getLocalizedValue,
  getLocationLabel,
  getMarketItemTitle,
  type LocalizableRecord,
} from "@/lib/localized-value";

export function useLocalizedLabel() {
  const { language } = useI18n();

  const localized = useCallback(
    (item: LocalizableRecord, field = "name", fallback = "") =>
      getLocalizedValue(item, field, language, fallback),
    [language],
  );

  const locationLabel = useCallback(
    (item: LocalizableRecord, fallback = "") => getLocationLabel(item, language, fallback),
    [language],
  );

  const marketTitle = useCallback(
    (item: LocalizableRecord, kind: "auction" | "tender" | "direct", id?: number | string) =>
      getMarketItemTitle(item, language, kind, id),
    [language],
  );

  return { localized, locationLabel, marketTitle, language };
}
