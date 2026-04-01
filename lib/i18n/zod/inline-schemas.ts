import { z } from "zod";
import type { AppMessages } from "../dictionaries";
import { CATEGORY_ICON_NAMES } from "@/lib/category-icons";

/** Inline expense category quick-create — uses translated "name required". */
export function buildQuickExpenseCategorySchema(quick: AppMessages["validation"]["quick"]) {
  return z.object({
    name: z.string().trim().min(1, quick.nameRequired).max(200),
    parentCategoryId: z.string().optional(),
    icon: z.enum(CATEGORY_ICON_NAMES),
  });
}

export function buildQuickIncomeCategorySchema(quick: AppMessages["validation"]["quick"]) {
  return z.object({
    name: z.string().trim().min(1, quick.nameRequired).max(200),
    icon: z.enum(CATEGORY_ICON_NAMES),
  });
}

export function buildCounterpartySchemaFromMessages(v: AppMessages["validation"]["counterparty"]) {
  return z.object({
    name: z.string().trim().min(1, v.nameRequired).max(200, v.nameMax),
  });
}
