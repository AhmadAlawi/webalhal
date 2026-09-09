"use client";

import { useEffect } from "react";
import { useI18n } from "@/context/I18nContext";

export function DocumentMeta() {
  const { language, t } = useI18n();

  useEffect(() => {
    document.title = t("meta.title");
    const description = document.querySelector('meta[name="description"]');
    if (description) {
      description.setAttribute("content", t("meta.description"));
    }
  }, [language, t]);

  return null;
}
