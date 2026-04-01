import { z } from "zod";
import type { AppMessages } from "../dictionaries";
import { accountTypeSchema, currencySchema } from "@/lib/schemas/account.schema";

export function buildCreateAccountSchema(v: AppMessages["validation"]["account"]) {
  return z.object({
    name: z.string().trim().min(1, v.nameRequired).max(200, v.nameMax),
    type: accountTypeSchema,
    currency: currencySchema,
    openingBalance: z
      .number()
      .finite(v.openingFinite)
      .refine((val) => !isNaN(val), v.openingNumber),
  });
}

export function buildUpdateAccountSchema(v: AppMessages["validation"]["account"]) {
  return z.object({
    name: z.string().trim().min(1, v.nameRequired).max(200, v.nameMax).optional(),
    type: accountTypeSchema.optional(),
  });
}
