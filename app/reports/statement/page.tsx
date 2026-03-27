"use client";

import { useMemo } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ReportSummaryCard } from "@/components/reports";
import type { FinancialStatementData } from "@/types/report.types";

type FinancialStatementResponse =
  | { success: true; data: FinancialStatementData }
  | { success: false; error: string; code: string };

/**
 * Financial statement dashboard (FR-RPT-004).
 */
export default function FinancialStatementPage() {
  const statementQuery = useQuery<FinancialStatementResponse>({
    queryKey: ["reports", "statement"],
    queryFn: async () => {
      const token = localStorage.getItem("pm_token");
      const res = await fetch("/api/reports/statement", {
        headers: { Authorization: token ? `Bearer ${token}` : "" },
      });
      const json = (await res.json()) as FinancialStatementResponse;
      if (!res.ok) {
        throw new Error(
          json.success === false ? json.error : "Failed to load financial statement",
        );
      }
      return json;
    },
    placeholderData: keepPreviousData,
  });

  const statement = statementQuery.data?.success === true ? statementQuery.data.data : null;

  const accountsByType = useMemo(() => {
    if (!statement) return new Map<string, FinancialStatementData["assets"]["accounts"]>();
    const grouped = new Map<string, FinancialStatementData["assets"]["accounts"]>();
    for (const account of statement.assets.accounts) {
      const current = grouped.get(account.type) ?? [];
      current.push(account);
      grouped.set(account.type, current);
    }
    return grouped;
  }, [statement]);

  const formatAmount = (n: number) =>
    n.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  function accountTransactionsHref(accountId: string): string {
    const p = new URLSearchParams();
    p.set("accountId", accountId);
    return `/transactions?${p.toString()}`;
  }

  function counterpartyTransactionsHref(counterpartyId: string): string {
    const p = new URLSearchParams();
    p.set("type", "Borrow");
    p.set("counterpartyId", counterpartyId);
    return `/transactions?${p.toString()}`;
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Button variant="ghost" size="sm" className="mb-2 -ml-2 gap-1" asChild>
            <Link href="/reports">
              <ArrowLeft className="h-4 w-4" aria-hidden />
              Reports
            </Link>
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Financial statement</h1>
          <p className="mt-1 text-muted-foreground">
            Current assets, borrow positions, and net worth snapshot
          </p>
        </div>
      </div>

      {statementQuery.isError ? (
        <p className="text-sm text-destructive">{(statementQuery.error as Error).message}</p>
      ) : null}

      {statementQuery.isLoading && !statement ? (
        <p className="text-sm text-muted-foreground">Loading statement...</p>
      ) : null}

      {statementQuery.isFetching && statement ? (
        <p className="text-sm text-muted-foreground">Refreshing statement...</p>
      ) : null}

      {statement ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <ReportSummaryCard
              title="Total assets"
              value={formatAmount(statement.assets.totalAssets)}
              description="Sum of all current account balances"
            />
            <ReportSummaryCard
              title="Total liabilities"
              value={formatAmount(statement.liabilities.totalLiabilities)}
              description="Borrowed minus lent outstanding"
            />
            <ReportSummaryCard
              title="Net worth"
              value={formatAmount(statement.netWorth)}
              valueClassName={statement.netWorth >= 0 ? "text-emerald-600" : "text-red-600"}
              description="Assets minus liabilities"
            />
          </div>

          <section className="rounded-lg border bg-card p-4">
            <h2 className="text-lg font-semibold">Assets</h2>
            <p className="mb-4 mt-1 text-sm text-muted-foreground">
              Account balances grouped by account type.
            </p>

            {statement.assets.accounts.length === 0 ? (
              <p className="text-sm text-muted-foreground">No accounts yet.</p>
            ) : (
              <div className="space-y-5">
                {[...accountsByType.entries()].map(([type, accounts]) => (
                  <div key={type} className="space-y-2">
                    <h3 className="text-sm font-medium text-muted-foreground">{type}</h3>
                    <ul className="space-y-2">
                      {accounts.map((account) => (
                        <li
                          key={account.id}
                          className="flex flex-wrap items-center justify-between gap-2 rounded-md border px-3 py-2"
                        >
                          <div>
                            <p className="font-medium">{account.name}</p>
                            <p className="text-xs text-muted-foreground">{account.currency}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold">{formatAmount(account.balance)}</p>
                            <Button asChild size="sm" variant="outline">
                              <Link href={accountTransactionsHref(account.id)}>
                                View transactions
                              </Link>
                            </Button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-lg border bg-card p-4">
              <h2 className="text-lg font-semibold">Borrowed from others</h2>
              <p className="mb-4 mt-1 text-sm text-muted-foreground">
                Outstanding amounts you currently owe by counterparty.
              </p>
              {statement.liabilities.borrowedFrom.length === 0 ? (
                <p className="text-sm text-muted-foreground">No borrowed balances.</p>
              ) : (
                <ul className="space-y-2">
                  {statement.liabilities.borrowedFrom.map((row) => (
                    <li
                      key={row.counterpartyId}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-md border px-3 py-2"
                    >
                      <div>
                        <p className="font-medium">{row.counterpartyName}</p>
                        <p className="text-xs text-muted-foreground">Owed amount</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold">{formatAmount(row.amount)}</p>
                        <Button asChild size="sm" variant="outline">
                          <Link href={counterpartyTransactionsHref(row.counterpartyId)}>
                            View transactions
                          </Link>
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="rounded-lg border bg-card p-4">
              <h2 className="text-lg font-semibold">Lent to others</h2>
              <p className="mb-4 mt-1 text-sm text-muted-foreground">
                Outstanding amounts others owe you by counterparty.
              </p>
              {statement.liabilities.lentTo.length === 0 ? (
                <p className="text-sm text-muted-foreground">No lent balances.</p>
              ) : (
                <ul className="space-y-2">
                  {statement.liabilities.lentTo.map((row) => (
                    <li
                      key={row.counterpartyId}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-md border px-3 py-2"
                    >
                      <div>
                        <p className="font-medium">{row.counterpartyName}</p>
                        <p className="text-xs text-muted-foreground">Receivable amount</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold">{formatAmount(row.amount)}</p>
                        <Button asChild size="sm" variant="outline">
                          <Link href={counterpartyTransactionsHref(row.counterpartyId)}>
                            View transactions
                          </Link>
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}
