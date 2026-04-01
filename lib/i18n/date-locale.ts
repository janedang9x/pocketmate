import { enUS, vi } from "date-fns/locale";
import type { Locale as AppLocale } from "./types";

export function getDateFnsLocale(locale: AppLocale) {
  return locale === "vi" ? vi : enUS;
}
