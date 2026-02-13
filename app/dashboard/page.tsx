"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wallet, TrendingUp, TrendingDown, Receipt, ArrowRight } from "lucide-react";
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
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your financial accounts and recent activity
        </p>
      </div>

      {/* Summary Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-2xl font-bold">--</div>
            ) : error ? (
              <div className="text-2xl font-bold text-destructive">Error</div>
            ) : accounts.length === 0 ? (
              <div className="text-2xl font-bold">0 {primaryCurrency}</div>
            ) : (
              <>
                <div className="text-2xl font-bold">{formatCurrency(primaryCurrencyBalance, primaryCurrency)}</div>
                {balancesByCurrency.size > 1 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Multi-currency: {Array.from(balancesByCurrency.entries())
                      .map(([curr, bal]) => formatCurrency(bal, curr))
                      .join(", ")}
                  </p>
                )}
              </>
            )}
            <p className="text-xs text-muted-foreground">Across all accounts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Income</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">--</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">--</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Savings</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">--</div>
            <p className="text-xs text-muted-foreground">Income - Expenses</p>
          </CardContent>
        </Card>
      </div>

      {/* Account Summary Cards */}
      {!isLoading && !error && accounts.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Your Accounts</CardTitle>
              <CardDescription>Top accounts by balance</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/accounts">
                View All <ArrowRight className="ml-2 h-4 w-4" />
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
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks and shortcuts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Button variant="outline" className="h-auto flex-col py-4" asChild>
              <Link href="/accounts/new">
                <Wallet className="mb-2 h-5 w-5" />
                <span>Add Account</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto flex-col py-4" asChild>
              <Link href="/transactions">
                <Receipt className="mb-2 h-5 w-5" />
                <span>Add Transaction</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto flex-col py-4" asChild>
              <Link href="/reports">
                <TrendingUp className="mb-2 h-5 w-5" />
                <span>View Reports</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto flex-col py-4" asChild>
              <Link href="/accounts">
                <Wallet className="mb-2 h-5 w-5" />
                <span>View Accounts</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>Your latest financial activity</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
              No transactions yet. Start by adding your first transaction!
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
