import type { AppMessages } from "./dictionaries";
import type { AccountType } from "@/types/account.types";
import type { TransactionType } from "@/types/transaction.types";
import type { PaymentMethod } from "@/types/transaction.types";

export function transactionTypeLabel(
  type: TransactionType,
  m: AppMessages["transactionTypes"],
): string {
  return m[type];
}

export function accountTypeLabel(type: AccountType, m: AppMessages["accountTypes"]): string {
  return m[type];
}

export function paymentMethodLabel(
  method: PaymentMethod,
  m: AppMessages["paymentMethods"],
): string {
  return m[method];
}

export function transactionTabLabel(
  tab: "Expense" | "Income" | "Transfer" | "Borrow" | "Lend",
  m: AppMessages["transactionForm"]["tabs"],
): string {
  return m[tab];
}
