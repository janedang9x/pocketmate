"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { endOfMonth, format, parseISO, startOfMonth } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Receipt,
  ArrowRight,
  PiggyBank,
  FileText,
  LineChart,
} from "lucide-react";
import { AccountCard } from "@/components/accounts/AccountCard";
import { CategoryBreakdown } from "@/components/reports";
import {
  formatCurrency,
  getTopAccountsByBalance,
  aggregateBalancesByCurrency,
} from "@/lib/utils/account.utils";
import type { AccountWithBalance, Currency } from "@/types/account.types";
import type { ComparisonReportData, ExpenseReportData } from "@/types/report.types";
import type { TransactionRow } from "@/types/transaction.types";
import { convertAmountToVnd, type VndExchangeRates } from "@/lib/utils/exchange-rate.utils";

type ApiError = { success: false; error: string; code: string };

type AccountsResponse =
  | {
      success: true;
      data: {
        accounts: AccountWithBalance[];
        exchangeRates: VndExchangeRates | null;
      };
    }
  | ApiError;

type ComparisonResponse = { success: true; data: ComparisonReportData } | ApiError;
type ExpenseResponse = { success: true; data: ExpenseReportData } | ApiError;
type TransactionsResponse =
  | {
      success: true;
      data: {
        transactions: TransactionRow[];
      };
    }
  | ApiError;

interface DashboardData {
  accounts: AccountWithBalance[];
  exchangeRates: VndExchangeRates | null;
  monthlyComparison: ComparisonReportData | null;
  monthlyExpense: ExpenseReportData | null;
  recentTransactions: TransactionRow[];
  startDate: string;
  endDate: string;
}

/**
 * Dashboard page with summary stats, charts, and recent transactions.
 * Implements Sprint 1.4: Create Dashboard Skeleton
 * Implements Sprint 2.4: Account Dashboard Integration
 * Implements Sprint 4.7: Dashboard Finalization
 */
export default function DashboardPage() {
  const { data, isLoading, error } = useQuery<DashboardData>({
    queryKey: ["dashboard-data"],
    queryFn: async () => {
      const token = localStorage.getItem("pm_token");
      const authHeader = {
        Authorization: token ? `Bearer ${token}` : "",
      };

      const now = new Date();
      const startDate = format(startOfMonth(now), "yyyy-MM-dd");
      const endDate = format(endOfMonth(now), "yyyy-MM-dd");

      const [accountsRes, comparisonRes, expenseRes, transactionsRes] = await Promise.all([
        fetch("/api/accounts", { headers: authHeader }),
        fetch(
          `/api/reports/comparison?${new URLSearchParams({
            startDate,
            endDate,
            groupBy: "day",
          }).toString()}`,
          { headers: authHeader },
        ),
        fetch(
          `/api/reports/expense?${new URLSearchParams({
            startDate,
            endDate,
            groupBy: "day",
          }).toString()}`,
          { headers: authHeader },
        ),
        fetch("/api/transactions?page=1&limit=10", { headers: authHeader }),
      ]);

      const accountsJson = (await accountsRes.json()) as AccountsResponse;
      const comparisonJson = (await comparisonRes.json()) as ComparisonResponse;
      const expenseJson = (await expenseRes.json()) as ExpenseResponse;
      const transactionsJson = (await transactionsRes.json()) as TransactionsResponse;

      if (!accountsRes.ok || accountsJson.success === false) {
        throw new Error(accountsJson.success === false ? accountsJson.error : "Failed to fetch accounts");
      }

      return {
        accounts: accountsJson.data.accounts,
        exchangeRates: accountsJson.data.exchangeRates,
        monthlyComparison:
          comparisonRes.ok && comparisonJson.success === true ? comparisonJson.data : null,
        monthlyExpense: expenseRes.ok && expenseJson.success === true ? expenseJson.data : null,
        recentTransactions:
          transactionsRes.ok && transactionsJson.success === true
            ? transactionsJson.data.transactions
            : [],
        startDate,
        endDate,
      };
    },
  });

  const accounts = data?.accounts ?? [];
  const exchangeRates = data?.exchangeRates ?? null;
  const balancesByCurrency = aggregateBalancesByCurrency(accounts);
  const topAccounts = getTopAccountsByBalance(accounts, 4);

  const totalBalanceVnd = exchangeRates
    ? accounts.reduce(
        (sum, account) =>
          sum + convertAmountToVnd(account.balance, account.currency as Currency, exchangeRates),
        0,
      )
    : null;
  const monthlyIncome = data?.monthlyComparison?.summary.totalIncome ?? 0;
  const monthlyExpense = data?.monthlyComparison?.summary.totalExpense ?? 0;
  const monthlyNetSavings = data?.monthlyComparison?.summary.netSavings ?? 0;

  const topCategoryItems =
    data?.monthlyExpense?.byCategory.slice(0, 5).map((category) => ({
      id: category.categoryId,
      name: category.categoryName,
      amount: category.amount,
      percentage: category.percentage,
      transactionCount: category.transactionCount,
    })) ?? [];

  const accountNameById = new Map(accounts.map((account) => [account.id, account.name]));

  function getTransactionAmountLabel(transaction: TransactionRow): string {
    if (transaction.type === "Expense") {
      return `-${formatCurrency(transaction.amount, transaction.currency as Currency)}`;
    }
    if (transaction.type === "Income") {
      return `+${formatCurrency(transaction.amount, transaction.currency as Currency)}`;
    }
    return formatCurrency(transaction.amount, transaction.currency as Currency);
  }

  function getTransactionAccountLabel(transaction: TransactionRow): string {
    if (transaction.type === "Expense" || transaction.type === "Borrow") {
      const fromName = transaction.from_account_id
        ? accountNameById.get(transaction.from_account_id)
        : null;
      const toName = transaction.to_account_id ? accountNameById.get(transaction.to_account_id) : null;
      if (fromName) return fromName;
      if (toName) return toName;
      return "N/A";
    }

    if (transaction.type === "Income") {
      return transaction.to_account_id ? accountNameById.get(transaction.to_account_id) ?? "N/A" : "N/A";
    }

    const fromName = transaction.from_account_id
      ? accountNameById.get(transaction.from_account_id)
      : null;
    const toName = transaction.to_account_id ? accountNameById.get(transaction.to_account_id) : null;
    if (fromName && toName) return `${fromName} -> ${toName}`;
    return fromName ?? toName ?? "N/A";
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Overview of your financial accounts and recent activity
        </p>
      </div>

      {/* Summary Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Balance</CardTitle>
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center">
              <Wallet className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-3xl font-bold">--</div>
            ) : error ? (
              <div className="text-3xl font-bold text-destructive">Error</div>
            ) : accounts.length === 0 ? (
              <div className="text-3xl font-bold">0 VND</div>
            ) : (
              <>
                <div className="text-3xl font-bold">
                  {totalBalanceVnd === null ? "--" : formatCurrency(totalBalanceVnd, "VND")}
                </div>
                {balancesByCurrency.size > 1 && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Multi-currency: {Array.from(balancesByCurrency.entries())
                      .map(([curr, bal]) => formatCurrency(bal, curr))
                      .join(", ")}
                  </p>
                )}
              </>
            )}
            <p className="text-xs text-muted-foreground mt-2">Across all accounts</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Monthly Income</CardTitle>
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-3xl font-bold">--</div>
            ) : error ? (
              <div className="text-3xl font-bold text-destructive">Error</div>
            ) : (
              <div className="text-3xl font-bold text-blue-600">
                {formatCurrency(monthlyIncome, "VND")}
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-2">
              {data ? `${data.startDate} to ${data.endDate}` : "This month"}
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Monthly Expense</CardTitle>
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center">
              <TrendingDown className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-3xl font-bold">--</div>
            ) : error ? (
              <div className="text-3xl font-bold text-destructive">Error</div>
            ) : (
              <div className="text-3xl font-bold text-orange-600">
                {formatCurrency(monthlyExpense, "VND")}
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-2">
              {data ? `${data.startDate} to ${data.endDate}` : "This month"}
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Net Savings</CardTitle>
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-pink-400 to-purple-600 flex items-center justify-center">
              <PiggyBank className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-3xl font-bold">--</div>
            ) : error ? (
              <div className="text-3xl font-bold text-destructive">Error</div>
            ) : (
              <div
                className={`text-3xl font-bold ${
                  monthlyNetSavings >= 0 ? "text-emerald-600" : "text-destructive"
                }`}
              >
                {formatCurrency(monthlyNetSavings, "VND")}
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-2">Income - expense (this month)</p>
          </CardContent>
        </Card>
      </div>

      <CategoryBreakdown
        title="Top expense categories"
        description="Highest spending categories this month"
        items={topCategoryItems}
        formatAmount={(value) => formatCurrency(value, "VND")}
        listMaxHeight="220px"
      />

      {/* Account Summary Cards */}
      {!isLoading && !error && accounts.length > 0 && (
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <div>
              <CardTitle className="text-xl font-semibold">Your Accounts</CardTitle>
              <CardDescription className="mt-1">Top accounts by balance</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild className="gap-2">
              <Link href="/accounts">
                View All <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {topAccounts.map((account) => (
                <AccountCard key={account.id} account={account} exchangeRates={exchangeRates} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Reports quick links */}
      <Card className="shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-semibold">Reports</CardTitle>
          <CardDescription className="mt-1">Jump directly to analytics pages</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Button variant="outline" className="justify-start gap-2" asChild>
              <Link href="/reports/expense">
                <TrendingDown className="h-4 w-4" />
                Expense report
              </Link>
            </Button>
            <Button variant="outline" className="justify-start gap-2" asChild>
              <Link href="/reports/income">
                <TrendingUp className="h-4 w-4" />
                Income report
              </Link>
            </Button>
            <Button variant="outline" className="justify-start gap-2" asChild>
              <Link href="/reports/comparison">
                <LineChart className="h-4 w-4" />
                Comparison report
              </Link>
            </Button>
            <Button variant="outline" className="justify-start gap-2" asChild>
              <Link href="/reports/statement">
                <FileText className="h-4 w-4" />
                Financial statement
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      <Card className="shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-semibold">Recent Transactions</CardTitle>
          <CardDescription className="mt-1">Your latest 10 transactions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data?.recentTransactions.length ? (
              data.recentTransactions.map((transaction) => (
                <Link
                  key={transaction.id}
                  href={`/transactions/${transaction.id}`}
                  className="block rounded-lg border p-3 transition-colors hover:bg-muted/50"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 space-y-1">
                      <p className="text-sm font-medium">
                        {transaction.type}
                        <span className="text-muted-foreground"> • {getTransactionAccountLabel(transaction)}</span>
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {transaction.details?.trim() || "No details"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(parseISO(transaction.date_time), "MMM d, yyyy HH:mm")}
                      </p>
                    </div>
                    <p
                      className={`shrink-0 text-sm font-semibold ${
                        transaction.type === "Expense"
                          ? "text-destructive"
                          : transaction.type === "Income"
                          ? "text-emerald-600"
                          : "text-foreground"
                      }`}
                    >
                      {getTransactionAmountLabel(transaction)}
                    </p>
                  </div>
                </Link>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-sm text-muted-foreground">
                <Receipt className="mb-3 h-12 w-12 text-muted-foreground/30" />
                <p>No transactions yet. Start by adding your first transaction!</p>
              </div>
            )}
          </div>
          <div className="mt-4 flex justify-end">
            <Button variant="ghost" size="sm" asChild className="gap-2">
              <Link href="/transactions">
                View all transactions <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Exchange Rates */}
      <Card className="shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-semibold">Exchange rate</CardTitle>
          <CardDescription className="mt-1">Rates are refreshed once per day</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading exchange rates...</p>
          ) : exchangeRates ? (
            <div className="space-y-2">
              <p className="text-sm">
                <span className="text-muted-foreground">1 USD = </span>
                <span className="font-semibold">{formatCurrency(exchangeRates.usdToVnd, "VND")}</span>
              </p>
              <p className="text-sm">
                <span className="text-muted-foreground">1 mace = </span>
                <span className="font-semibold">{formatCurrency(exchangeRates.maceToVnd, "VND")}</span>
              </p>
              <p className="text-xs text-muted-foreground">
                Updated: {format(parseISO(exchangeRates.fetchedAt), "MMM d, yyyy HH:mm")} ({exchangeRates.source})
              </p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Exchange rate is temporarily unavailable.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
