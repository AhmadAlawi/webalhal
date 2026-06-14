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

export type ThemeMode = "system" | "light" | "dark";
export type ResolvedTheme = "light" | "dark";

type ThemeContextValue = {
  themeMode: ThemeMode;
  resolvedTheme: ResolvedTheme;
  isDark: boolean;
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
};

const STORAGE_KEY = "rizq-web-theme-mode";

function resolveTheme(mode: ThemeMode, systemTheme: ResolvedTheme): ResolvedTheme {
  return mode === "system" ? systemTheme : mode;
}

function isThemeMode(value: string | null): value is ThemeMode {
  return value === "system" || value === "light" || value === "dark";
}

function applyTheme(theme: ResolvedTheme) {
  if (typeof document === "undefined") return;

  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
}

const ThemeContext = createContext<ThemeContextValue>({
  themeMode: "system",
  resolvedTheme: "light",
  isDark: false,
  setThemeMode: () => {},
  toggleTheme: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeMode, setThemeModeState] = useState<ThemeMode>("system");
  const [systemTheme, setSystemTheme] = useState<ResolvedTheme>("light");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => setSystemTheme(media.matches ? "dark" : "light");

    const initialize = window.setTimeout(() => {
      if (isThemeMode(stored)) {
        setThemeModeState(stored);
      }
      handleChange();
      setReady(true);
    }, 0);

    media.addEventListener("change", handleChange);
    return () => {
      window.clearTimeout(initialize);
      media.removeEventListener("change", handleChange);
    };
  }, []);

  const resolvedTheme = resolveTheme(themeMode, systemTheme);

  useEffect(() => {
    if (!ready) return;
    applyTheme(resolvedTheme);
  }, [ready, resolvedTheme]);

  const setThemeMode = useCallback((mode: ThemeMode) => {
    setThemeModeState(mode);
    window.localStorage.setItem(STORAGE_KEY, mode);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeMode(resolvedTheme === "dark" ? "light" : "dark");
  }, [resolvedTheme, setThemeMode]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      themeMode,
      resolvedTheme,
      isDark: resolvedTheme === "dark",
      setThemeMode,
      toggleTheme,
    }),
    [themeMode, resolvedTheme, setThemeMode, toggleTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
