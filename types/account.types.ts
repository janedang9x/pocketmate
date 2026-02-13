import type { Database } from "./database.types";

/**
 * Account type constants matching database CHECK constraint
 * Implements FR-ACC-001: Create Financial Account
 */
export const ACCOUNT_TYPES = ["Bank Account", "Credit Card", "E-wallet", "Cash", "Others"] as const;

export type AccountType = (typeof ACCOUNT_TYPES)[number];

/**
 * Currency codes supported by the system
 */
export const CURRENCIES = ["VND", "USD", "mace"] as const;

export type Currency = (typeof CURRENCIES)[number];

/**
 * Financial Account type based on database schema
 */
export type FinancialAccount = Database["public"]["Tables"]["financial_account"]["Row"];

/**
 * Financial Account with calculated balance
 * Balance is calculated from opening balance + sum of all transactions
 */
export interface AccountWithBalance extends FinancialAccount {
  balance: number;
}

/**
 * Account details with transaction count
 */
export interface AccountDetails extends AccountWithBalance {
  transactionCount: number;
}

/**
 * Account creation input (for API requests)
 */
export interface CreateAccountInput {
  name: string;
  type: AccountType;
  currency: Currency;
  openingBalance: number;
}

/**
 * Account update input (for API requests)
 */
export interface UpdateAccountInput {
  name?: string;
  type?: AccountType;
}
