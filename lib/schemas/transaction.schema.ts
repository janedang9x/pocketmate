import { z } from "zod";
import { currencySchema } from "@/lib/schemas/account.schema";
import { PAYMENT_METHODS, TRANSACTION_TYPES } from "@/types/transaction.types";

/**
 * Transaction type schema matching database CHECK constraint
 * Implements FR-TXN-001 to FR-TXN-004: Transaction types
 */
export const transactionTypeSchema = z.enum(TRANSACTION_TYPES);

/**
 * Payment method schema for expense transactions
 * Implements FR-TXN-001: Create Expense Transaction
 */
export const paymentMethodSchema = z.enum(PAYMENT_METHODS).optional();

/**
 * Base fields shared by all transaction create schemas
 */
const baseTransactionFields = {
  amount: z
    .number()
    .positive("Amount must be a positive number")
    .finite("Amount must be a valid number"),
  currency: currencySchema,
  dateTime: z
    .string()
    .min(1, "Transaction date and time is required")
    .refine((value) => !Number.isNaN(Date.parse(value)), {
      message: "Invalid date format",
    }),
  details: z
    .string()
    .trim()
    .max(1000, "Details must be at most 1000 characters")
    .optional(),
};

/**
 * Schema for creating an Expense transaction
 * Implements FR-TXN-001: Create Expense Transaction
 */
export const createExpenseTransactionSchema = z.object({
  type: z.literal("Expense"),
  fromAccountId: z.string().min(1, "From account is required"),
  expenseCategoryId: z.string().min(1, "Expense category is required"),
  counterpartyId: z.string().min(1).optional(),
  paymentMethod: paymentMethodSchema,
  ...baseTransactionFields,
});

/**
 * Schema for creating an Income transaction
 * Implements FR-TXN-002: Create Income Transaction
 */
export const createIncomeTransactionSchema = z.object({
  type: z.literal("Income"),
  toAccountId: z.string().min(1, "To account is required"),
  incomeCategoryId: z.string().min(1, "Income category is required"),
  counterpartyId: z.string().min(1).optional(),
  ...baseTransactionFields,
});

/**
 * Schema for creating a Transfer transaction
 * Implements FR-TXN-003: Create Transfer Transaction
 */
export const createTransferTransactionSchema = z
  .object({
    type: z.literal("Transfer"),
    fromAccountId: z.string().min(1, "From account is required"),
    toAccountId: z.string().min(1, "To account is required"),
    vndExchange: z
      .number()
      .positive("Exchange rate must be positive")
      .finite("Exchange rate must be a valid number")
      .optional(),
    ...baseTransactionFields,
  })
  .refine((data) => data.fromAccountId !== data.toAccountId, {
    message: "Source and destination accounts must be different",
    path: ["toAccountId"],
  });

/**
 * Schema for creating a Borrow transaction
 * Implements FR-TXN-004: Create Borrow Transaction
 */
export const createBorrowTransactionSchema = z
  .object({
    type: z.literal("Borrow"),
    fromAccountId: z.string().min(1).optional(),
    toAccountId: z.string().min(1).optional(),
    counterpartyId: z.string().min(1, "Counterparty is required"),
    ...baseTransactionFields,
  })
  .refine((data) => !!data.fromAccountId !== !!data.toAccountId, {
    message: "Either fromAccountId or toAccountId must be provided (but not both)",
    path: ["fromAccountId"],
  });

/**
 * Discriminated union schema for creating any transaction type
 * Implements FR-TXN-001 to FR-TXN-004
 */
export const createTransactionSchema = z.discriminatedUnion("type", [
  createExpenseTransactionSchema,
  createIncomeTransactionSchema,
  createTransferTransactionSchema,
  createBorrowTransactionSchema,
]);

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;

/**
 * Schema for updating an existing transaction
 * Type is intentionally excluded to prevent changing transaction type
 * Implements FR-TXN-006: Edit Transaction
 */
export const updateTransactionSchema = z
  .object({
    amount: baseTransactionFields.amount.optional(),
    currency: baseTransactionFields.currency.optional(),
    dateTime: baseTransactionFields.dateTime.optional(),
    details: baseTransactionFields.details,
    fromAccountId: z.string().min(1).optional(),
    toAccountId: z.string().min(1).optional(),
    expenseCategoryId: z.string().min(1).optional(),
    incomeCategoryId: z.string().min(1).optional(),
    counterpartyId: z.string().min(1).optional(),
    paymentMethod: paymentMethodSchema,
    vndExchange: createTransferTransactionSchema.shape.vndExchange.optional(),
  })
  .refine(
    (data) =>
      !data.fromAccountId ||
      !data.toAccountId ||
      data.fromAccountId !== data.toAccountId,
    {
      message: "Source and destination accounts must be different",
      path: ["toAccountId"],
    },
  );

export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>;

/**
 * Schema for transaction query parameters (filtering & pagination)
 * Implements FR-TXN-005: View Transactions
 */
export const transactionQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((value) => {
      const num = Number(value ?? "1");
      return Number.isNaN(num) || num < 1 ? 1 : Math.floor(num);
    }),
  limit: z
    .string()
    .optional()
    .transform((value) => {
      const num = Number(value ?? "50");
      if (Number.isNaN(num) || num < 1) return 50;
      if (num > 100) return 100;
      return Math.floor(num);
    }),
  type: transactionTypeSchema.optional(),
  accountId: z.string().min(1).optional(),
  categoryId: z.string().min(1).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  search: z.string().optional(),
});

export type TransactionQueryParams = z.infer<typeof transactionQuerySchema>;

