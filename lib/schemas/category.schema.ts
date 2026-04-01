import { z } from "zod";
import { CATEGORY_ICON_NAMES } from "@/lib/category-icons";

const categoryIconSchema = z.enum(CATEGORY_ICON_NAMES);

/**
 * Schema for creating a new expense category
 * Implements FR-CAT-002: Create Custom Category
 */
export const createExpenseCategorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Category name is required")
    .max(200, "Category name must be at most 200 characters"),
  parentCategoryId: z.string().min(1).nullable().optional(),
  icon: categoryIconSchema.optional(),
});

export type CreateExpenseCategoryInput = z.infer<typeof createExpenseCategorySchema>;

/**
 * Schema for updating an existing expense category
 * Implements FR-CAT-003: Edit Category
 */
export const updateExpenseCategorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Category name is required")
    .max(200, "Category name must be at most 200 characters")
    .optional(),
  parentCategoryId: z.string().min(1).nullable().optional(),
  icon: categoryIconSchema.optional(),
});

export type UpdateExpenseCategoryInput = z.infer<typeof updateExpenseCategorySchema>;

/**
 * Schema for creating a new income category
 * Implements FR-CAT-002: Create Custom Category
 */
export const createIncomeCategorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Category name is required")
    .max(200, "Category name must be at most 200 characters"),
  icon: categoryIconSchema.optional(),
});

export type CreateIncomeCategoryInput = z.infer<typeof createIncomeCategorySchema>;

/**
 * Schema for updating an existing income category
 * Implements FR-CAT-003: Edit Category
 */
export const updateIncomeCategorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Category name is required")
    .max(200, "Category name must be at most 200 characters")
    .optional(),
  icon: categoryIconSchema.optional(),
});

export type UpdateIncomeCategoryInput = z.infer<typeof updateIncomeCategorySchema>;
