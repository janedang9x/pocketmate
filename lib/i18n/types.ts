export type Locale = "en" | "vi";

export const LOCALES: Locale[] = ["en", "vi"];

export const LOCALE_STORAGE_KEY = "pocketmate-locale";

export function isLocale(value: string | null | undefined): value is Locale {
  return value === "en" || value === "vi";
}
