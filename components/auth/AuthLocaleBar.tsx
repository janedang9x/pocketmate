"use client";

import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";

/** Fixed top-right language switch on auth and marketing pages. */
export function AuthLocaleBar() {
  return (
    <div className="fixed right-4 top-4 z-50">
      <LanguageSwitcher />
    </div>
  );
}
