import { createSupabaseServerClient } from "@/lib/supabase";
import type { AccountWithBalance, Currency, AccountType } from "@/types/account.types";

/**
 * Calculate account balance from transactions
 * Balance = sum of income/transfers TO account - sum of expenses/transfers FROM account
 * Implements FR-ACC-002: View Financial Accounts
 */
export async function calculateAccountBalance(
  accountId: string,
  userId: string,
  accessToken?: string,
): Promise<number> {
  const supabase = createSupabaseServerClient({ accessToken });

  // Get all transactions affecting this account
  const { data: transactions, error } = await supabase
    .from("transaction")
    .select("type, from_account_id, to_account_id, amount, currency")
    .eq("user_id", userId)
    .or(`from_account_id.eq.${accountId},to_account_id.eq.${accountId}`);

  if (error) {
    console.error("Error calculating account balance:", error);
    return 0;
  }

  if (!transactions || transactions.length === 0) {
    return 0;
  }

  let balance = 0;

  for (const transaction of transactions) {
    // Income: adds to to_account_id
    if (transaction.type === "Income" && transaction.to_account_id === accountId) {
      balance += Number(transaction.amount);
    }
    // Expense: subtracts from from_account_id
    else if (transaction.type === "Expense" && transaction.from_account_id === accountId) {
      balance -= Number(transaction.amount);
    }
    // Transfer: subtracts from from_account_id, adds to to_account_id
    else if (transaction.type === "Transfer") {
      if (transaction.from_account_id === accountId) {
        balance -= Number(transaction.amount);
      }
      if (transaction.to_account_id === accountId) {
        balance += Number(transaction.amount);
      }
    }
    // Borrow: depends on direction
    else if (transaction.type === "Borrow") {
      // If from_account_id is set, user is lending (subtract)
      if (transaction.from_account_id === accountId) {
        balance -= Number(transaction.amount);
      }
      // If to_account_id is set, user is borrowing (add)
      if (transaction.to_account_id === accountId) {
        balance += Number(transaction.amount);
      }
    }
  }

  return balance;
}

/**
 * Calculate balances for multiple accounts
 */
export async function calculateAccountBalances(
  accounts: Array<{ id: string }>,
  userId: string,
  accessToken?: string,
): Promise<Map<string, number>> {
  const balanceMap = new Map<string, number>();

  // Calculate balances in parallel
  await Promise.all(
    accounts.map(async (account) => {
      const balance = await calculateAccountBalance(account.id, userId, accessToken);
      balanceMap.set(account.id, balance);
    }),
  );

  return balanceMap;
}

/**
 * Add balance to account objects
 */
export function addBalancesToAccounts<T extends { id: string }>(
  accounts: T[],
  balances: Map<string, number>,
): Array<T & { balance: number }> {
  return accounts.map((account) => ({
    ...account,
    balance: balances.get(account.id) ?? 0,
  }));
}

/**
 * Format currency amount as a string
 * Supports VND, USD, and mace currencies
 * Implements Sprint 2.4: Account Dashboard Integration
 */
export function formatCurrency(amount: number, currency: Currency): string {
  const formatted = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: currency === "VND" ? 0 : 2,
    maximumFractionDigits: currency === "VND" ? 0 : 2,
  }).format(amount);

  return `${formatted} ${currency}`;
}

/**
 * Get account icon component name for account type
 * Returns the icon name that can be used with lucide-react icons
 * Implements Sprint 2.4: Account Dashboard Integration
 */
export function getAccountIcon(type: AccountType): string {
  const iconMap: Record<AccountType, string> = {
    "Bank Account": "Building2",
    "Credit Card": "CreditCard",
    "E-wallet": "Wallet",
    Cash: "Banknote",
    Others: "CircleDot",
  };

  return iconMap[type];
}

/**
 * Calculate total balance across all accounts
 * Note: This doesn't handle currency conversion - sums balances as-is
 * For multi-currency support, use aggregateBalancesByCurrency instead
 * Implements Sprint 2.4: Account Dashboard Integration
 */
export function calculateTotalBalance(accounts: AccountWithBalance[]): number {
  return accounts.reduce((total, account) => total + account.balance, 0);
}

/**
 * Aggregate balances by currency
 * Returns a map of currency -> total balance
 * Implements Sprint 2.4: Account Dashboard Integration
 */
export function aggregateBalancesByCurrency(
  accounts: AccountWithBalance[],
): Map<Currency, number> {
  const balanceMap = new Map<Currency, number>();

  for (const account of accounts) {
    const currency = account.currency as Currency;
    const currentBalance = balanceMap.get(currency) ?? 0;
    balanceMap.set(currency, currentBalance + account.balance);
  }

  return balanceMap;
}

/**
 * Get accounts grouped by currency
 * Returns a map of currency -> accounts array
 * Implements Sprint 2.4: Account Dashboard Integration
 */
export function groupAccountsByCurrency(
  accounts: AccountWithBalance[],
): Map<Currency, AccountWithBalance[]> {
  const grouped = new Map<Currency, AccountWithBalance[]>();

  for (const account of accounts) {
    const currency = account.currency as Currency;
    const accountsForCurrency = grouped.get(currency) ?? [];
    accountsForCurrency.push(account);
    grouped.set(currency, accountsForCurrency);
  }

  return grouped;
}

/**
 * Get top N accounts by balance
 * Implements Sprint 2.4: Account Dashboard Integration
 */
export function getTopAccountsByBalance(
  accounts: AccountWithBalance[],
  limit: number = 5,
): AccountWithBalance[] {
  return [...accounts]
    .sort((a, b) => b.balance - a.balance)
    .slice(0, limit);
}
