import { z } from "zod";
import type { AppMessages } from "@/lib/i18n/catalog-en";

export function buildCounterpartySchemas(m: AppMessages) {
  const v = m.validation.counterparty;
  return {
    create: z.object({
      name: z.string().trim().min(1, v.nameRequired).max(200, v.nameMax),
    }),
    update: z.object({
      name: z.string().trim().min(1, v.nameRequired).max(200, v.nameMax),
    }),
  };
}
