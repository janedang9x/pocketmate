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

import { appMessagesByLocale, type AppMessages, type MainLayoutMessages } from "@/lib/i18n/dictionaries";
import { isLocale, LOCALE_STORAGE_KEY, type Locale } from "@/lib/i18n/types";

interface LocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  /** Full app copy for the active locale */
  messages: AppMessages;
  mainLayout: MainLayoutMessages;
}

const LocaleContext = createContext<LocaleContextValue | undefined>(undefined);

function readStoredLocale(): Locale {
  if (typeof window === "undefined") return "en";
  try {
    const raw = window.localStorage.getItem(LOCALE_STORAGE_KEY);
    return isLocale(raw) ? raw : "en";
  } catch {
    return "en";
  }
}

/**
 * Persists UI language (English / Vietnamese) and exposes translated main shell copy.
 */
export function LocaleProvider({ children }: { children: ReactNode }) {
  /** Start with `en` so SSR and first client paint match; sync from storage after mount. */
  const [locale, setLocaleState] = useState<Locale>("en");

  useEffect(() => {
    setLocaleState(readStoredLocale());
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.lang = locale === "vi" ? "vi" : "en";
    document.title = appMessagesByLocale[locale].metadata.title;
  }, [locale]);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    try {
      window.localStorage.setItem(LOCALE_STORAGE_KEY, next);
    } catch {
      /* ignore quota / private mode */
    }
  }, []);

  const value = useMemo<LocaleContextValue>(
    () => ({
      locale,
      setLocale,
      messages: appMessagesByLocale[locale],
      mainLayout: appMessagesByLocale[locale].mainLayout,
    }),
    [locale, setLocale],
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocaleContext(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    throw new Error("useLocaleContext must be used within LocaleProvider");
  }
  return ctx;
}
