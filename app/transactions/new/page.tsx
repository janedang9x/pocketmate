"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useLocaleContext } from "@/components/providers/LocaleProvider";
import { TransactionForm } from "@/components/transactions/TransactionForm";
import type { AccountWithBalance } from "@/types/account.types";
import type { ExpenseCategoryWithChildren, IncomeCategory } from "@/types/category.types";
import type { Counterparty } from "@/types/counterparty.types";
import type { CreateTransactionInput } from "@/lib/schemas/transaction.schema";
import type { TransactionRowWithCategoryNames } from "@/types/transaction.types";

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

type ExpenseCategoriesResponse =
  | {
      success: true;
      data: {
        categories: ExpenseCategoryWithChildren[];
      };
    }
  | {
      success: false;
      error: string;
      code: string;
    };

type IncomeCategoriesResponse =
  | {
      success: true;
      data: {
        categories: IncomeCategory[];
      };
    }
  | {
      success: false;
      error: string;
      code: string;
    };

type CounterpartiesResponse =
  | {
      success: true;
      data: {
        counterparties: Counterparty[];
      };
    }
  | {
      success: false;
      error: string;
      code: string;
    };

type CreateTransactionResponse =
  | {
      success: true;
      data: {
        transaction: { id: string };
      };
      message?: string;
    }
  | {
      success: false;
      error: string;
      code: string;
    };

type TransactionsResponse =
  | {
      success: true;
      data: {
        transactions: TransactionRowWithCategoryNames[];
      };
    }
  | {
      success: false;
      error: string;
      code: string;
    };

/**
 * Create Transaction Page
 * Implements Sprint 3.4: Transaction UI - Create Flows
 * Implements FR-TXN-001 to FR-TXN-004
 * @see docs/specifications.md#fr-txn-001-create-expense-transaction
 */
export default function NewTransactionPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { messages: m } = useLocaleContext();
  const t = m.transactions;

  const {
    data: accountsData,
    isLoading: isLoadingAccounts,
    error: accountsError,
  } = useQuery<AccountsResponse>({
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
        throw new Error(errorData?.success === false ? errorData.error : m.common.failedToLoad);
      }

      return (await res.json()) as AccountsResponse;
    },
  });

  const {
    data: expenseCategoriesData,
    isLoading: isLoadingExpenseCategories,
    error: expenseCategoriesError,
  } = useQuery<ExpenseCategoriesResponse>({
    queryKey: ["categories", "expense"],
    queryFn: async () => {
      const token = localStorage.getItem("pm_token");
      const res = await fetch("/api/categories/expense", {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
      });

      if (!res.ok) {
        const errorData = (await res.json().catch(() => null)) as ExpenseCategoriesResponse | null;
        throw new Error(errorData?.success === false ? errorData.error : m.common.failedToLoad);
      }

      return (await res.json()) as ExpenseCategoriesResponse;
    },
  });

  const {
    data: incomeCategoriesData,
    isLoading: isLoadingIncomeCategories,
    error: incomeCategoriesError,
  } = useQuery<IncomeCategoriesResponse>({
    queryKey: ["categories", "income"],
    queryFn: async () => {
      const token = localStorage.getItem("pm_token");
      const res = await fetch("/api/categories/income", {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
      });

      if (!res.ok) {
        const errorData = (await res.json().catch(() => null)) as IncomeCategoriesResponse | null;
        throw new Error(errorData?.success === false ? errorData.error : m.common.failedToLoad);
      }

      return (await res.json()) as IncomeCategoriesResponse;
    },
  });

  const {
    data: counterpartiesData,
    error: counterpartiesError,
  } = useQuery<CounterpartiesResponse>({
    queryKey: ["counterparties"],
    queryFn: async () => {
      const token = localStorage.getItem("pm_token");
      const res = await fetch("/api/counterparties?includeCounts=false", {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
      });

      if (!res.ok) {
        const errorData = (await res.json().catch(() => null)) as CounterpartiesResponse | null;
        throw new Error(errorData?.success === false ? errorData.error : m.common.failedToLoad);
      }

      return (await res.json()) as CounterpartiesResponse;
    },
  });

  const { data: latestTransactionsData } = useQuery<TransactionsResponse>({
    queryKey: ["transactions", "latest-account"],
    queryFn: async () => {
      const token = localStorage.getItem("pm_token");
      const res = await fetch("/api/transactions?page=1&limit=1", {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
      });

      if (!res.ok) {
        const errorData = (await res.json().catch(() => null)) as TransactionsResponse | null;
        throw new Error(errorData?.success === false ? errorData.error : m.common.failedToLoad);
      }

      return (await res.json()) as TransactionsResponse;
    },
  });

  const { data: expenseUsageData } = useQuery<TransactionsResponse>({
    queryKey: ["transactions", "expense-usage-categories"],
    enabled: accountsData?.success === true && accountsData.data.accounts.length > 0,
    queryFn: async () => {
      const token = localStorage.getItem("pm_token");
      const res = await fetch("/api/transactions?type=Expense&page=1&limit=200", {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
      });

      if (!res.ok) {
        const errorData = (await res.json().catch(() => null)) as TransactionsResponse | null;
        throw new Error(errorData?.success === false ? errorData.error : m.common.failedToLoad);
      }

      return (await res.json()) as TransactionsResponse;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: CreateTransactionInput) => {
      const token = localStorage.getItem("pm_token");

      const payload: CreateTransactionInput = {
        ...data,
        dateTime: new Date(data.dateTime).toISOString(),
      };

      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify(payload),
      });

      const result = (await res.json()) as CreateTransactionResponse;

      if (!res.ok) {
        throw new Error(result.success === false ? result.error : m.common.failedToLoad);
      }

      if (!result.success || !result.data?.transaction) {
        throw new Error(m.common.somethingWrong);
      }

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      router.push("/transactions");
    },
  });

  async function handleSubmit(data: CreateTransactionInput) {
    await createMutation.mutateAsync(data);
  }

  const isLoading = isLoadingAccounts || isLoadingExpenseCategories || isLoadingIncomeCategories;

  const loadError = accountsError || expenseCategoriesError || incomeCategoriesError || counterpartiesError;

  const accounts = accountsData?.success === true ? accountsData.data.accounts : [];
  const expenseCategories =
    expenseCategoriesData?.success === true ? expenseCategoriesData.data.categories : [];
  const incomeCategories =
    incomeCategoriesData?.success === true ? incomeCategoriesData.data.categories : [];
  const counterparties =
    counterpartiesData?.success === true ? counterpartiesData.data.counterparties : [];
  const latestTransaction =
    latestTransactionsData?.success === true ? latestTransactionsData.data.transactions[0] : undefined;
  const latestTransactionAccountId =
    latestTransaction?.from_account_id ?? latestTransaction?.to_account_id ?? undefined;
  const mostUsedExpenseCategoryIds = (() => {
    if (expenseUsageData?.success !== true) return [];
    const counts = new Map<string, number>();
    for (const txn of expenseUsageData.data.transactions) {
      const categoryId = txn.expense_category_id;
      if (!categoryId) continue;
      counts.set(categoryId, (counts.get(categoryId) ?? 0) + 1);
    }
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([categoryId]) => categoryId);
  })();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard" aria-label={t.backDashboardAria}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{m.mainLayout.addTransaction}</h1>
          <p className="text-muted-foreground">{t.newSubtitle}</p>
        </div>
      </div>

      <Card className="shadow-sm">
        <CardContent className="pt-6">
          {loadError && (
            <div className="mb-4 rounded-lg border border-destructive bg-destructive/10 p-4">
              <p className="text-sm font-medium text-destructive">
                {loadError instanceof Error ? loadError.message : t.loadFormError}
              </p>
            </div>
          )}

          {createMutation.isError && (
            <div className="mb-4 rounded-lg border border-destructive bg-destructive/10 p-4">
              <p className="text-sm font-medium text-destructive">
                {createMutation.error instanceof Error
                  ? createMutation.error.message
                  : t.createError}
              </p>
            </div>
          )}

          {isLoading ? (
            <p className="text-sm text-muted-foreground">{t.loadingForm}</p>
          ) : accounts.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {t.needAccount}{" "}
              <Link href="/accounts/new" className="font-medium text-primary underline-offset-2 hover:underline">
                {t.createAccountFirst}
              </Link>
            </p>
          ) : (
            <TransactionForm
              accounts={accounts}
              expenseCategories={expenseCategories}
              incomeCategories={incomeCategories}
              counterparties={counterparties}
              latestTransactionAccountId={latestTransactionAccountId}
              mostUsedExpenseCategoryIds={mostUsedExpenseCategoryIds}
              onSubmit={handleSubmit}
              isSubmitting={createMutation.isPending}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

