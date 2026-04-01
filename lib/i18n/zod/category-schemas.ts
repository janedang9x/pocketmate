import { z } from "zod";
import type { AppMessages } from "@/lib/i18n/catalog-en";
import { CATEGORY_ICON_NAMES } from "@/lib/category-icons";

export function buildCategorySchemas(m: AppMessages) {
  const v = m.validation.category;
  return {
    createExpense: z.object({
      name: z.string().trim().min(1, v.nameRequired).max(200, v.nameMax),
      parentCategoryId: z.string().min(1).nullable().optional(),
      icon: z.enum(CATEGORY_ICON_NAMES).optional(),
    }),
    updateExpense: z.object({
      name: z.string().trim().min(1, v.nameRequired).max(200, v.nameMax).optional(),
      parentCategoryId: z.string().min(1).nullable().optional(),
      icon: z.enum(CATEGORY_ICON_NAMES).optional(),
    }),
    createIncome: z.object({
      name: z.string().trim().min(1, v.nameRequired).max(200, v.nameMax),
      icon: z.enum(CATEGORY_ICON_NAMES).optional(),
    }),
    updateIncome: z.object({
      name: z.string().trim().min(1, v.nameRequired).max(200, v.nameMax).optional(),
      icon: z.enum(CATEGORY_ICON_NAMES).optional(),
    }),
  };
}
