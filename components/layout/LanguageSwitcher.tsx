"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LOCALES } from "@/lib/i18n/types";
import { useLocaleContext } from "@/components/providers/LocaleProvider";
import { Languages } from "lucide-react";

/**
 * Switches between English and Vietnamese; placed in the header next to sign-out.
 */
export function LanguageSwitcher() {
  const { locale, setLocale, messages } = useLocaleContext();

  return (
    <div className="flex items-center gap-2">
      <Languages className="h-4 w-4 shrink-0 text-muted-foreground hidden sm:block" aria-hidden />
      <Select
        value={locale}
        onValueChange={(v) => {
          if (v === "en" || v === "vi") setLocale(v);
        }}
      >
        <SelectTrigger
          className="h-9 w-[min(11rem,44vw)] border-muted-foreground/20 sm:w-40"
          aria-label="Language"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent align="end">
          {LOCALES.map((code) => (
            <SelectItem key={code} value={code}>
              {messages.languageNames[code]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
