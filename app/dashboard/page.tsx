"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wallet, TrendingUp, TrendingDown, Receipt, ArrowRight, PiggyBank } from "lucide-react";
import { AccountCard } from "@/components/accounts/AccountCard";
import { formatCurrency, calculateTotalBalance, getTopAccountsByBalance, aggregateBalancesByCurrency } from "@/lib/utils/account.utils";
import type { AccountWithBalance, Currency } from "@/types/account.types";

type AccountsResponse =
  | {
      success: true;
      data: {
        accounts: AccountWithBalance[];
      };
    }
  | {
      success: false;
      error: string;
      code: string;
    };

/**
 * Dashboard page with summary stats, quick actions, and recent transactions.
 * Implements Sprint 1.4: Create Dashboard Skeleton
 * Implements Sprint 2.4: Account Dashboard Integration
 */
export default function DashboardPage() {
  const { data, isLoading, error } = useQuery<AccountsResponse>({
    queryKey: ["accounts"],
    queryFn: async () => {
      const token = localStorage.getItem("pm_token");
      const res = await fetch("/api/accounts", {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
      });

      if (!res.ok) {
        const errorData = (await res.json().catch(() => null)) as AccountsResponse | null;
        throw new Error(errorData?.success === false ? errorData.error : "Failed to fetch accounts");
      }

      return (await res.json()) as AccountsResponse;
    },
  });

  const accounts = data?.success === true ? data.data.accounts : [];
  const balancesByCurrency = aggregateBalancesByCurrency(accounts);
  const topAccounts = getTopAccountsByBalance(accounts, 4);

  // Get primary currency (currency with highest total balance)
  const primaryCurrency: Currency = balancesByCurrency.size > 0
    ? Array.from(balancesByCurrency.entries())
        .sort((a, b) => b[1] - a[1])[0][0]
    : accounts.length > 0
    ? (accounts[0].currency as Currency)
    : "VND";

  // Calculate total balance for primary currency only (for display)
  const primaryCurrencyBalance = balancesByCurrency.get(primaryCurrency) ?? 0;

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
              <div className="text-3xl font-bold">0 {primaryCurrency}</div>
            ) : (
              <>
                <div className="text-3xl font-bold">{formatCurrency(primaryCurrencyBalance, primaryCurrency)}</div>
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
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Income</CardTitle>
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">--</div>
            <p className="text-xs text-muted-foreground mt-2">This month</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Expenses</CardTitle>
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center">
              <TrendingDown className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">--</div>
            <p className="text-xs text-muted-foreground mt-2">This month</p>
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
            <div className="text-3xl font-bold">--</div>
            <p className="text-xs text-muted-foreground mt-2">Income - Expenses</p>
          </CardContent>
        </Card>
      </div>

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
                <AccountCard key={account.id} account={account} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card className="shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-semibold">Quick Actions</CardTitle>
          <CardDescription className="mt-1">Common tasks and shortcuts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Button variant="outline" className="h-auto flex-col py-6 hover:shadow-md transition-shadow" asChild>
              <Link href="/accounts/new">
                <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center mb-3">
                  <Wallet className="h-6 w-6 text-white" />
                </div>
                <span className="font-medium">Add Account</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto flex-col py-6 hover:shadow-md transition-shadow" asChild>
              <Link href="/transactions/new">
                <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center mb-3">
                  <Receipt className="h-6 w-6 text-white" />
                </div>
                <span className="font-medium">Add Transaction</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto flex-col py-6 hover:shadow-md transition-shadow" asChild>
              <Link href="/reports">
                <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center mb-3">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
                <span className="font-medium">View Reports</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto flex-col py-6 hover:shadow-md transition-shadow" asChild>
              <Link href="/accounts">
                <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-pink-400 to-purple-600 flex items-center justify-center mb-3">
                  <Wallet className="h-6 w-6 text-white" />
                </div>
                <span className="font-medium">View Accounts</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      <Card className="shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-semibold">Recent Transactions</CardTitle>
          <CardDescription className="mt-1">Your latest financial activity</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex flex-col items-center justify-center py-12 text-sm text-muted-foreground">
              <Receipt className="h-12 w-12 mb-3 text-muted-foreground/30" />
              <p>No transactions yet. Start by adding your first transaction!</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
