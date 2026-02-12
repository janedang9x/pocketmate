import { z } from "zod";
import type { AccountType, Currency } from "@/types/account.types";

/**
 * Account type schema matching database CHECK constraint
 * Implements FR-ACC-001: Create Financial Account
 */
export const accountTypeSchema = z.enum(["Bank Account", "Credit Card", "E-wallet", "Cash"]);

/**
 * Currency schema - supports VND, USD, mace
 */
export const currencySchema = z.enum(["VND", "USD", "mace"]);

/**
 * Schema for creating a new financial account
 * Implements FR-ACC-001: Create Financial Account
 */
export const createAccountSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Account name is required")
    .max(200, "Account name must be at most 200 characters"),
  type: accountTypeSchema,
  currency: currencySchema,
  openingBalance: z
    .number()
    .finite("Opening balance must be a valid number")
    .refine((val) => !isNaN(val), "Opening balance must be a number"),
});

export type CreateAccountInput = z.infer<typeof createAccountSchema>;

/**
 * Schema for updating an existing financial account
 * Implements FR-ACC-003: Edit Financial Account
 */
export const updateAccountSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Account name is required")
    .max(200, "Account name must be at most 200 characters")
    .optional(),
  type: accountTypeSchema.optional(),
});

export type UpdateAccountInput = z.infer<typeof updateAccountSchema>;

/**
 * Schema for account query parameters (filtering)
 * Implements FR-ACC-002: View Financial Accounts
 */
export const accountQuerySchema = z.object({
  type: accountTypeSchema.optional(),
  search: z.string().optional(),
});

export type AccountQueryParams = z.infer<typeof accountQuerySchema>;
