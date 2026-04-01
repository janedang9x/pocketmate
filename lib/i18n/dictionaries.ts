import { catalogEn, type AppMessages } from "./catalog-en";
import { catalogVi } from "./catalog-vi";
import type { Locale } from "./types";

export type { AppMessages };
export type MainLayoutMessages = AppMessages["mainLayout"];

export const appMessagesByLocale: Record<Locale, AppMessages> = {
  en: catalogEn,
  vi: catalogVi,
};

/** @deprecated Use `appMessagesByLocale[locale].mainLayout` */
export const mainLayoutByLocale: Record<Locale, MainLayoutMessages> = {
  en: catalogEn.mainLayout,
  vi: catalogVi.mainLayout,
};

export const languageLabels = catalogEn.languageNames;
