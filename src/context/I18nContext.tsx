"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import ar from "@/i18n/ar.json";
import en from "@/i18n/en.json";

export type AppLanguage = "ar" | "en";
export type AppDirection = "rtl" | "ltr";

const STORAGE_KEY = "rizq-web-language";
const messages = { ar, en };

type TranslationValues = Record<string, string | number | null | undefined>;

type I18nContextValue = {
  language: AppLanguage;
  direction: AppDirection;
  isRtl: boolean;
  setLanguage: (language: AppLanguage) => void;
  toggleLanguage: () => void;
  t: (key: string, fallback?: string, values?: TranslationValues) => string;
};

function isLanguage(value: string | null | undefined): value is AppLanguage {
  return value === "ar" || value === "en";
}

function directionFor(language: AppLanguage): AppDirection {
  return language === "ar" ? "rtl" : "ltr";
}

function detectBrowserLanguage(): AppLanguage {
  if (typeof navigator === "undefined") return "en";
  const lang = navigator.language?.toLowerCase() ?? "";
  if (lang.startsWith("ar")) return "ar";
  return "en";
}

export function resolveInitialLanguage(): AppLanguage {
  if (typeof window === "undefined") return "en";
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (isLanguage(stored)) return stored;
  return detectBrowserLanguage();
}

function getByPath(source: unknown, path: string): string | undefined {
  const value = path.split(".").reduce<unknown>((current, part) => {
    if (!current || typeof current !== "object") return undefined;
    return (current as Record<string, unknown>)[part];
  }, source);

  return typeof value === "string" ? value : undefined;
}

function interpolate(value: string, replacements?: TranslationValues) {
  if (!replacements) return value;
  return value.replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
    const replacement = replacements[key];
    return replacement == null ? "" : String(replacement);
  });
}

function applyDocumentLanguage(language: AppLanguage) {
  const direction = directionFor(language);
  document.documentElement.lang = language;
  document.documentElement.dir = direction;
  document.documentElement.dataset.locale = language;
  document.body.dir = direction;
}

const I18nContext = createContext<I18nContextValue>({
  language: "en",
  direction: "ltr",
  isRtl: false,
  setLanguage: () => {},
  toggleLanguage: () => {},
  t: (_key, fallback) => fallback ?? _key,
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<AppLanguage>(() => resolveInitialLanguage());

  useEffect(() => {
    applyDocumentLanguage(language);
  }, [language]);

  const setLanguage = useCallback((next: AppLanguage) => {
    setLanguageState(next);
    window.localStorage.setItem(STORAGE_KEY, next);
    applyDocumentLanguage(next);
  }, []);

  const toggleLanguage = useCallback(() => {
    setLanguage(language === "ar" ? "en" : "ar");
  }, [language, setLanguage]);

  const t = useCallback(
    (key: string, fallback?: string, values?: TranslationValues) => {
      const translated =
        getByPath(messages[language], key) ??
        getByPath(messages.en, key) ??
        getByPath(messages.ar, key) ??
        fallback ??
        key;

      return interpolate(translated, values);
    },
    [language],
  );

  const direction = directionFor(language);
  const value = useMemo<I18nContextValue>(
    () => ({
      language,
      direction,
      isRtl: direction === "rtl",
      setLanguage,
      toggleLanguage,
      t,
    }),
    [language, direction, setLanguage, toggleLanguage, t],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  return useContext(I18nContext);
}
