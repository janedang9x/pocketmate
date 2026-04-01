import { z } from "zod";
import type { AppMessages } from "../dictionaries";
import { currencySchema } from "@/lib/schemas/account.schema";
import { paymentMethodSchema } from "@/lib/schemas/transaction.schema";

export function buildCreateTransactionSchemas(v: AppMessages["validation"]["transaction"]) {
  const baseTransactionFields = {
    amount: z.number().positive(v.amountPositive).finite(v.amountFinite),
    currency: currencySchema,
    dateTime: z
      .string()
      .min(1, v.dateRequired)
      .refine((value) => !Number.isNaN(Date.parse(value)), {
        message: v.dateInvalid,
      }),
    details: z.string().trim().max(1000, v.detailsMax).optional(),
  };

  const createExpenseTransactionSchema = z.object({
    type: z.literal("Expense"),
    fromAccountId: z.string().min(1, v.fromAccount),
    expenseCategoryId: z.string().min(1, v.expenseCategory),
    counterpartyId: z.string().min(1).optional(),
    paymentMethod: paymentMethodSchema,
    ...baseTransactionFields,
  });

  const createIncomeTransactionSchema = z.object({
    type: z.literal("Income"),
    toAccountId: z.string().min(1, v.toAccount),
    incomeCategoryId: z.string().min(1, v.incomeCategory),
    counterpartyId: z.string().min(1).optional(),
    ...baseTransactionFields,
  });

  const createTransferTransactionSchema = z
    .object({
      type: z.literal("Transfer"),
      fromAccountId: z.string().min(1, v.fromAccount),
      toAccountId: z.string().min(1, v.toAccount),
      vndExchange: z
        .number()
        .positive(v.exchangePositive)
        .finite(v.exchangeFinite)
        .optional(),
      ...baseTransactionFields,
    })
    .refine((data) => data.fromAccountId !== data.toAccountId, {
      message: v.transferDifferent,
      path: ["toAccountId"],
    });

  const createBorrowTransactionSchema = z
    .object({
      type: z.literal("Borrow"),
      fromAccountId: z.string().min(1).optional(),
      toAccountId: z.string().min(1).optional(),
      counterpartyId: z.string().min(1, v.counterparty),
      ...baseTransactionFields,
    })
    .refine((data) => !!data.fromAccountId !== !!data.toAccountId, {
      message: v.borrowOneSide,
      path: ["fromAccountId"],
    });

  const createTransactionSchema = z.discriminatedUnion("type", [
    createExpenseTransactionSchema,
    createIncomeTransactionSchema,
    createTransferTransactionSchema,
    createBorrowTransactionSchema,
  ]);

  return {
    createExpenseTransactionSchema,
    createIncomeTransactionSchema,
    createTransferTransactionSchema,
    createBorrowTransactionSchema,
    createTransactionSchema,
  };
}
