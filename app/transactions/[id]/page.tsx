"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { TransactionRow } from "@/types/transaction.types";
import type { AccountWithBalance } from "@/types/account.types";
import type { Currency } from "@/types/account.types";
import type { ExpenseCategoryWithChildren, IncomeCategory } from "@/types/category.types";
import type { Counterparty } from "@/types/counterparty.types";
import { useLocaleContext } from "@/components/providers/LocaleProvider";
import { formatExpenseCategoryBreadcrumb, incomeCategoryDisplayName } from "@/lib/i18n/category-display-name";
import { getCurrencyLabel } from "@/lib/utils/account.utils";

type TransactionDetailResponse =
  | { success: true; data: { transaction: TransactionRow } }
  | { success: false; error: string; code: string };

type AccountsResponse =
  | {
      success: true;
      data: {
        accounts: AccountWithBalance[];
      };
    }
  | { success: false; error: string; code: string };

type ExpenseCategoriesResponse =
  | {
      success: true;
      data: {
        categories: ExpenseCategoryWithChildren[];
      };
    }
  | { success: false; error: string; code: string };

type IncomeCategoriesResponse =
  | {
      success: true;
      data: {
        categories: IncomeCategory[];
      };
    }
  | { success: false; error: string; code: string };

type CounterpartiesResponse =
  | {
      success: true;
      data: {
        counterparties: Counterparty[];
      };
    }
  | { success: false; error: string; code: string };

/**
 * Transaction Details Page
 * Implements Sprint 3.5: Transaction UI - List & Details
 * Implements FR-TXN-005, FR-TXN-006, FR-TXN-007 (view, edit, delete entry points)
 * @see docs/specifications.md#fr-txn-005-view-transactions
 */
export default function TransactionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { locale } = useLocaleContext();
  const id = params.id as string;

  const {
    data: transactionData,
    isLoading: isLoadingTransaction,
    error: transactionError,
  } = useQuery<TransactionDetailResponse>({
    queryKey: ["transaction", id],
    queryFn: async () => {
      const token = localStorage.getItem("pm_token");
      const res = await fetch(`/api/transactions/${id}`, {
        headers: { Authorization: token ? `Bearer ${token}` : "" },
      });

      const json = (await res.json()) as TransactionDetailResponse;

      if (!res.ok) {
        throw new Error(json.success === false ? json.error : "Failed to fetch transaction");
      }

      return json;
    },
    enabled: !!id,
  });

  const {
    data: accountsData,
    isLoading: isLoadingAccounts,
    error: accountsError,
  } = useQuery<AccountsResponse>({
    queryKey: ["accounts", "for-transaction-detail"],
    queryFn: async () => {
      const token = localStorage.getItem("pm_token");
      const res = await fetch("/api/accounts", {
        headers: { Authorization: token ? `Bearer ${token}` : "" },
      });

      const json = (await res.json()) as AccountsResponse;

      if (!res.ok) {
        throw new Error(json.success === false ? json.error : "Failed to fetch accounts");
      }

      return json;
    },
  });

  const {
    data: expenseCategoriesData,
    isLoading: isLoadingExpenseCategories,
    error: expenseCategoriesError,
  } = useQuery<ExpenseCategoriesResponse>({
    queryKey: ["categories", "expense", "for-transaction-detail"],
    queryFn: async () => {
      const token = localStorage.getItem("pm_token");
      const res = await fetch("/api/categories/expense", {
        headers: { Authorization: token ? `Bearer ${token}` : "" },
      });

      const json = (await res.json()) as ExpenseCategoriesResponse;

      if (!res.ok) {
        throw new Error(json.success === false ? json.error : "Failed to fetch expense categories");
      }

      return json;
    },
  });

  const {
    data: incomeCategoriesData,
    isLoading: isLoadingIncomeCategories,
    error: incomeCategoriesError,
  } = useQuery<IncomeCategoriesResponse>({
    queryKey: ["categories", "income", "for-transaction-detail"],
    queryFn: async () => {
      const token = localStorage.getItem("pm_token");
      const res = await fetch("/api/categories/income", {
        headers: { Authorization: token ? `Bearer ${token}` : "" },
      });

      const json = (await res.json()) as IncomeCategoriesResponse;

      if (!res.ok) {
        throw new Error(json.success === false ? json.error : "Failed to fetch income categories");
      }

      return json;
    },
  });

  const {
    data: counterpartiesData,
    isLoading: isLoadingCounterparties,
    error: counterpartiesError,
  } = useQuery<CounterpartiesResponse>({
    queryKey: ["counterparties", "for-transaction-detail"],
    queryFn: async () => {
      const token = localStorage.getItem("pm_token");
      const res = await fetch("/api/counterparties", {
        headers: { Authorization: token ? `Bearer ${token}` : "" },
      });

      const json = (await res.json()) as CounterpartiesResponse;

      if (!res.ok) {
        throw new Error(json.success === false ? json.error : "Failed to fetch counterparties");
      }

      return json;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const token = localStorage.getItem("pm_token");
      const res = await fetch(`/api/transactions/${id}`, {
        method: "DELETE",
        headers: { Authorization: token ? `Bearer ${token}` : "" },
      });

      const json = (await res.json()) as
        | { success: true }
        | { success: false; error: string; code: string };

      if (!res.ok) {
        throw new Error(json.success === false ? json.error : "Failed to delete transaction");
      }

      return json;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      setDeleteDialogOpen(false);
      router.push("/transactions");
    },
  });

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const transaction = transactionData?.success === true ? transactionData.data.transaction : null;
  const accounts = accountsData?.success === true ? accountsData.data.accounts : [];
  const expenseCategories =
    expenseCategoriesData?.success === true ? expenseCategoriesData.data.categories : [];
  const incomeCategories =
    incomeCategoriesData?.success === true ? incomeCategoriesData.data.categories : [];
  const counterparties =
    counterpartiesData?.success === true ? counterpartiesData.data.counterparties : [];

  const categoryNameById = useMemo(() => {
    const map = new Map<string, string>();

    expenseCategories.forEach((parent) => {
      map.set(
        parent.id,
        formatExpenseCategoryBreadcrumb(parent, null, locale),
      );
      parent.children?.forEach((child) => {
        map.set(child.id, formatExpenseCategoryBreadcrumb(parent, child, locale));
      });
    });

    incomeCategories.forEach((cat) => {
      map.set(cat.id, incomeCategoryDisplayName(cat, locale));
    });

    return map;
  }, [expenseCategories, incomeCategories, locale]);

  const accountById = useMemo(() => {
    const map = new Map<string, AccountWithBalance>();
    accounts.forEach((acc) => {
      map.set(acc.id, acc);
    });
    return map;
  }, [accounts]);

  const counterpartyNameById = useMemo(() => {
    const map = new Map<string, string>();
    counterparties.forEach((cp) => {
      map.set(cp.id, cp.name);
    });
    return map;
  }, [counterparties]);

  const isLoading =
    isLoadingTransaction ||
    isLoadingAccounts ||
    isLoadingExpenseCategories ||
    isLoadingIncomeCategories ||
    isLoadingCounterparties;

  const combinedError =
    transactionError ||
    accountsError ||
    expenseCategoriesError ||
    incomeCategoriesError ||
    counterpartiesError;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Loading transaction...</p>
      </div>
    );
  }

  if (combinedError || !transaction) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/transactions" aria-label="Back to transactions">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
          <p className="text-sm font-medium text-destructive">
            {combinedError instanceof Error
              ? combinedError.message
              : "Transaction not found"}
          </p>
          <Button asChild className="mt-2">
            <Link href="/transactions">Back to Transactions</Link>
          </Button>
        </div>
      </div>
    );
  }

  const fromAccount = transaction.from_account_id
    ? accountById.get(transaction.from_account_id) ?? null
    : null;
  const toAccount = transaction.to_account_id
    ? accountById.get(transaction.to_account_id) ?? null
    : null;

  const categoryId = transaction.expense_category_id ?? transaction.income_category_id ?? undefined;
  const categoryLabel = categoryId ? categoryNameById.get(categoryId) ?? "-" : "-";

  const counterpartyLabel = transaction.counterparty_id
    ? counterpartyNameById.get(transaction.counterparty_id) ?? ""
    : "";

  const amountSign =
    transaction.type === "Income" || (transaction.type === "Borrow" && transaction.to_account_id)
      ? "+"
      : "-";

  const amountClassName =
    amountSign === "+"
      ? "text-emerald-600 dark:text-emerald-400"
      : "text-red-600 dark:text-red-400";

  const formattedAmount = `${amountSign}${transaction.amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} ${getCurrencyLabel(transaction.currency as Currency)}`;

  const formattedDate = new Date(transaction.date_time).toLocaleString();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/transactions" aria-label="Back to transactions">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Transaction Details</h1>
            <p className="text-muted-foreground">
              View full information about this transaction.
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/transactions/${id}/edit`}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </Link>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
            onClick={() => setDeleteDialogOpen(true)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{transaction.type}</span>
            <span className={amountClassName}>{formattedAmount}</span>
          </CardTitle>
          <CardDescription>{formattedDate}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Account</p>
              {transaction.type === "Expense" && fromAccount && (
                <Link
                  href={`/accounts/${fromAccount.id}`}
                  className="text-sm font-medium hover:underline"
                >
                  {fromAccount.name}
                </Link>
              )}
              {transaction.type === "Income" && toAccount && (
                <Link
                  href={`/accounts/${toAccount.id}`}
                  className="text-sm font-medium hover:underline"
                >
                  {toAccount.name}
                </Link>
              )}
              {transaction.type === "Transfer" && (
                <div className="text-sm font-medium">
                  {fromAccount ? (
                    <Link
                      href={`/accounts/${fromAccount.id}`}
                      className="hover:underline"
                    >
                      {fromAccount.name}
                    </Link>
                  ) : (
                    "-"
                  )}{" "}
                  <span className="text-muted-foreground">→</span>{" "}
                  {toAccount ? (
                    <Link
                      href={`/accounts/${toAccount.id}`}
                      className="hover:underline"
                    >
                      {toAccount.name}
                    </Link>
                  ) : (
                    "-"
                  )}
                </div>
              )}
              {transaction.type === "Borrow" && (
                <div className="text-sm font-medium">
                  {fromAccount && (
                    <Link
                      href={`/accounts/${fromAccount.id}`}
                      className="hover:underline"
                    >
                      {fromAccount.name}
                    </Link>
                  )}
                  {fromAccount && toAccount && <span className="text-muted-foreground"> ↔ </span>}
                  {toAccount && (
                    <Link
                      href={`/accounts/${toAccount.id}`}
                      className="hover:underline"
                    >
                      {toAccount.name}
                    </Link>
                  )}
                  {!fromAccount && !toAccount && <span>-</span>}
                </div>
              )}
            </div>

            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Category</p>
              <p className="text-sm">{categoryLabel}</p>
            </div>

            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Counterparty</p>
              <p className="text-sm">{counterpartyLabel || "-"}</p>
            </div>

            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Payment Method</p>
              <p className="text-sm">
                {transaction.payment_method ? transaction.payment_method : "-"}
              </p>
            </div>
          </div>

          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">Notes</p>
            <p className="text-sm whitespace-pre-wrap">
              {transaction.details || "No additional notes for this transaction."}
            </p>
          </div>
        </CardContent>
      </Card>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete transaction</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this transaction? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {deleteMutation.isError && (
            <div className="rounded-lg border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
              {deleteMutation.error instanceof Error
                ? deleteMutation.error.message
                : "Failed to delete transaction"}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={() => deleteMutation.mutate()}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete Transaction"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

