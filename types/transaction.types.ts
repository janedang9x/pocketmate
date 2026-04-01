import type { Database } from "./database.types";
import type { Currency } from "./account.types";

/**
 * Transaction type constants matching database CHECK constraint
 * Implements FR-TXN-001 to FR-TXN-004: Transaction types
 */
export const TRANSACTION_TYPES = ["Expense", "Income", "Transfer", "Borrow"] as const;

export type TransactionType = (typeof TRANSACTION_TYPES)[number];

/**
 * Payment method constants for expense transactions
 * Implements FR-TXN-001: Create Expense Transaction
 */
export const PAYMENT_METHODS = ["Cash", "Credit card", "Installment"] as const;

export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

/**
 * Base Transaction type based on database schema
 */
export type TransactionRow = Database["public"]["Tables"]["transaction"]["Row"];

/**
 * Transaction row as returned by list APIs that join category names for display.
 */
export type TransactionRowWithCategoryNames = TransactionRow & {
  expense_category_name?: string | null;
  income_category_name?: string | null;
};

/**
 * Transaction entity exposed via API
 * Mirrors TransactionRow but with camelCased field names for frontend usage.
 */
export interface Transaction extends Omit<TransactionRow, "date_time" | "created_at" | "updated_at"> {
  dateTime: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Transaction item returned in list queries with optional related entity names
 * Implements FR-TXN-005: View Transactions
 */
export interface TransactionListItem extends Transaction {
  fromAccountName?: string | null;
  toAccountName?: string | null;
  expenseCategoryName?: string | null;
  incomeCategoryName?: string | null;
  counterpartyName?: string | null;
}

/**
 * Input shape for creating a transaction via API
 * Implemented via Zod in lib/schemas/transaction.schema.ts
 */
export interface CreateTransactionInputBase {
  amount: number;
  currency: Currency;
  dateTime: string;
  details?: string;
}

