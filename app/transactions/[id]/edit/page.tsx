"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TransactionForm } from "@/components/transactions/TransactionForm";
import type { TransactionRow, TransactionType } from "@/types/transaction.types";
import type { AccountWithBalance } from "@/types/account.types";
import type { ExpenseCategoryWithChildren, IncomeCategory } from "@/types/category.types";
import type { Counterparty } from "@/types/counterparty.types";
import type {
  CreateTransactionInput,
  UpdateTransactionInput,
} from "@/lib/schemas/transaction.schema";

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

type UpdateResponse =
  | { success: true; data: { transaction: TransactionRow }; message?: string }
  | { success: false; error: string; code: string };

/**
 * Edit Transaction Page
 * Implements Sprint 3.5: Transaction UI - Edit Flow
 * Implements FR-TXN-006: Edit Transaction
 * @see docs/specifications.md#fr-txn-006-edit-transaction
 */
export default function EditTransactionPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
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
    queryKey: ["accounts", "for-transaction-edit"],
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
    queryKey: ["categories", "expense", "for-transaction-edit"],
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
    queryKey: ["categories", "income", "for-transaction-edit"],
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
    queryKey: ["counterparties", "for-transaction-edit"],
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

  const updateMutation = useMutation({
    mutationFn: async (payload: UpdateTransactionInput) => {
      const token = localStorage.getItem("pm_token");
      const res = await fetch(`/api/transactions/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify(payload),
      });

      const json = (await res.json()) as UpdateResponse;

      if (!res.ok) {
        throw new Error(json.success === false ? json.error : "Failed to update transaction");
      }

      return json;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["transaction", id] });
      router.push(`/transactions/${id}`);
    },
  });

  const transaction = transactionData?.success === true ? transactionData.data.transaction : null;
  const accounts = accountsData?.success === true ? accountsData.data.accounts : [];
  const expenseCategories =
    expenseCategoriesData?.success === true ? expenseCategoriesData.data.categories : [];
  const incomeCategories =
    incomeCategoriesData?.success === true ? incomeCategoriesData.data.categories : [];
  const counterparties =
    counterpartiesData?.success === true ? counterpartiesData.data.counterparties : [];

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

  async function handleSubmit(values: TransactionRow) {
    const payload: UpdateTransactionInput = {
      amount: values.amount,
      currency: values.currency as UpdateTransactionInput["currency"],
      dateTime: values.date_time,
      details: values.details ?? undefined,
      fromAccountId: values.from_account_id ?? undefined,
      toAccountId: values.to_account_id ?? undefined,
      expenseCategoryId: values.expense_category_id ?? undefined,
      incomeCategoryId: values.income_category_id ?? undefined,
      counterpartyId: values.counterparty_id ?? undefined,
      paymentMethod: values.payment_method
        ? (values.payment_method as NonNullable<
            UpdateTransactionInput["paymentMethod"]
          >)
        : undefined,
      vndExchange: values.vnd_exchange ?? undefined,
    };

    await updateMutation.mutateAsync(payload);
  }

  if (isLoading || !transaction) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">
          {isLoading ? "Loading transaction..." : "Transaction not found"}
        </p>
      </div>
    );
  }

  if (combinedError) {
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
              : "Failed to load transaction"}
          </p>
          <Button asChild className="mt-2">
            <Link href="/transactions">Back to Transactions</Link>
          </Button>
        </div>
      </div>
    );
  }

  const defaultValuesForForm = {
    type: transaction.type,
    amount: transaction.amount,
    currency: transaction.currency,
    dateTime: transaction.date_time,
    details: transaction.details ?? "",
    fromAccountId: transaction.from_account_id ?? undefined,
    toAccountId: transaction.to_account_id ?? undefined,
    expenseCategoryId: transaction.expense_category_id ?? undefined,
    incomeCategoryId: transaction.income_category_id ?? undefined,
    counterpartyId: transaction.counterparty_id ?? undefined,
    paymentMethod: transaction.payment_method ?? undefined,
    vndExchange: transaction.vnd_exchange ?? undefined,
  } as Partial<CreateTransactionInput> & { type: TransactionType };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/transactions/${id}`} aria-label="Back to transaction">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Transaction</h1>
          <p className="text-muted-foreground">
            Update transaction details. Transaction type cannot be changed.
          </p>
        </div>
      </div>

      {updateMutation.isError && (
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
          <p className="text-sm font-medium text-destructive">
            {updateMutation.error instanceof Error
              ? updateMutation.error.message
              : "Something went wrong"}
          </p>
        </div>
      )}

      <TransactionForm
        accounts={accounts}
        expenseCategories={expenseCategories}
        incomeCategories={incomeCategories}
        counterparties={counterparties}
        onSubmit={async (data: CreateTransactionInput) => {
          const base = {
            amount: data.amount,
            currency: data.currency,
            date_time: data.dateTime,
            details: data.details ?? null,
          };
          let mapped: TransactionRow;
          switch (data.type) {
            case "Expense":
              mapped = {
                ...transaction,
                ...base,
                from_account_id: data.fromAccountId,
                to_account_id: null,
                expense_category_id: data.expenseCategoryId,
                income_category_id: null,
                counterparty_id: data.counterpartyId ?? null,
                payment_method: data.paymentMethod ?? null,
                vnd_exchange: null,
              };
              break;
            case "Income":
              mapped = {
                ...transaction,
                ...base,
                from_account_id: null,
                to_account_id: data.toAccountId,
                expense_category_id: null,
                income_category_id: data.incomeCategoryId,
                counterparty_id: data.counterpartyId ?? null,
                payment_method: null,
                vnd_exchange: null,
              };
              break;
            case "Transfer":
              mapped = {
                ...transaction,
                ...base,
                from_account_id: data.fromAccountId,
                to_account_id: data.toAccountId,
                expense_category_id: null,
                income_category_id: null,
                counterparty_id: null,
                payment_method: null,
                vnd_exchange: data.vndExchange ?? null,
              };
              break;
            case "Borrow":
              mapped = {
                ...transaction,
                ...base,
                from_account_id: data.fromAccountId ?? null,
                to_account_id: data.toAccountId ?? null,
                expense_category_id: null,
                income_category_id: null,
                counterparty_id: data.counterpartyId,
                payment_method: null,
                vnd_exchange: null,
              };
              break;
          }
          await handleSubmit(mapped);
        }}
        isSubmitting={updateMutation.isPending}
        defaultValues={defaultValuesForForm}
        disableTypeChange
      />
    </div>
  );
}

