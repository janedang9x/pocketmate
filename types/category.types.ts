import type { Database } from "./database.types";

/**
 * Expense Category type based on database schema
 * Implements FR-CAT-001: View Default Categories
 */
export type ExpenseCategory = Database["public"]["Tables"]["expense_categories"]["Row"];

/**
 * Income Category type based on database schema
 * Implements FR-CAT-001: View Default Categories
 */
export type IncomeCategory = Database["public"]["Tables"]["income_categories"]["Row"];

/**
 * Expense Category with children (hierarchical structure)
 * Used for displaying parent categories with their child categories
 */
export interface ExpenseCategoryWithChildren extends ExpenseCategory {
  children: ExpenseCategory[];
  isDefault: boolean;
}

/**
 * Category creation input for expense categories
 * Implements FR-CAT-002: Create Custom Category
 */
export interface CreateExpenseCategoryInput {
  name: string;
  parentCategoryId?: string | null;
}

/**
 * Category update input for expense categories
 * Implements FR-CAT-003: Edit Category
 */
export interface UpdateExpenseCategoryInput {
  name?: string;
  parentCategoryId?: string | null;
}

/**
 * Category creation input for income categories
 * Implements FR-CAT-002: Create Custom Category
 */
export interface CreateIncomeCategoryInput {
  name: string;
}

/**
 * Category update input for income categories
 * Implements FR-CAT-003: Edit Category
 */
export interface UpdateIncomeCategoryInput {
  name?: string;
}
