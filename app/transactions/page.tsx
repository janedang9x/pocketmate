"use client";

import { useState, useMemo, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Plus, Search, Filter, Calendar, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AccountWithBalance } from "@/types/account.types";
import type { ExpenseCategoryWithChildren, IncomeCategory } from "@/types/category.types";
import type { Counterparty } from "@/types/counterparty.types";
import { TRANSACTION_TYPES, type TransactionRow } from "@/types/transaction.types";
import { useLocaleContext } from "@/components/providers/LocaleProvider";
import { formatExpenseCategoryBreadcrumb, incomeCategoryDisplayName } from "@/lib/i18n/category-display-name";
import { transactionTypeLabel } from "@/lib/i18n/labels";

type TransactionsResponse =
  | {
      success: true;
      data: {
        transactions: TransactionRow[];
        pagination: {
          page: number;
          limit: number;
          total: number;
          totalPages: number;
        };
      };
    }
  | {
      success: false;
      error: string;
      code: string;
    };

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

type SortField = "date_time" | "amount" | "category" | "type";
type SortDirection = "asc" | "desc";

/**
 * Transaction List Page
 * Implements Sprint 3.5: Transaction UI - List & Details
 * Implements FR-TXN-005: View Transactions
 * @see docs/specifications.md#fr-txn-005-view-transactions
 */
function TransactionsLoadingFallback() {
  const { messages: m } = useLocaleContext();
  return (
    <div className="flex min-h-[40vh] items-center justify-center text-sm text-muted-foreground">
      {m.transactions.loading}
    </div>
  );
}

function TransactionsPageInner() {
  const { messages: m, locale } = useLocaleContext();
  const t = m.transactions;
  const searchParams = useSearchParams();
  const hydratedFromUrl = useRef(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [accountFilter, setAccountFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [counterpartyFilter, setCounterpartyFilter] = useState<string>("all");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  const [sortField, setSortField] = useState<SortField>("date_time");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  useEffect(() => {
    if (hydratedFromUrl.current) return;
    hydratedFromUrl.current = true;

    const type = searchParams.get("type");
    if (
      type === "Expense" ||
      type === "Income" ||
      type === "Transfer" ||
      type === "Borrow"
    ) {
      setTypeFilter(type);
    }

    const categoryId = searchParams.get("categoryId");
    if (categoryId) {
      setCategoryFilter(categoryId);
    }

    const counterpartyId = searchParams.get("counterpartyId");
    if (counterpartyId) {
      setCounterpartyFilter(counterpartyId);
    }

    const sd = searchParams.get("startDate");
    if (sd) setStartDate(sd);

    const ed = searchParams.get("endDate");
    if (ed) setEndDate(ed);
  }, [searchParams]);

  function toggleSort(field: SortField) {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  }

  const queryParams = new URLSearchParams();
  queryParams.set("page", String(page));
  queryParams.set("limit", "20");

  if (typeFilter !== "all") {
    queryParams.set("type", typeFilter);
  }
  if (accountFilter !== "all") {
    queryParams.set("accountId", accountFilter);
  }
  if (categoryFilter !== "all") {
    queryParams.set("categoryId", categoryFilter);
  }
  if (counterpartyFilter !== "all") {
    queryParams.set("counterpartyId", counterpartyFilter);
  }
  if (startDate) {
    queryParams.set("startDate", startDate);
  }
  if (endDate) {
    queryParams.set("endDate", endDate);
  }
  if (searchQuery.trim()) {
    queryParams.set("search", searchQuery.trim());
  }

  const {
    data: transactionsData,
    isLoading: isLoadingTransactions,
    isFetching: isFetchingTransactions,
    error: transactionsError,
  } = useQuery<TransactionsResponse>({
    queryKey: [
      "transactions",
      page,
      typeFilter,
      accountFilter,
      categoryFilter,
      counterpartyFilter,
      startDate,
      endDate,
      searchQuery,
    ],
    queryFn: async () => {
      const token = localStorage.getItem("pm_token");
      const url = `/api/transactions${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
      const res = await fetch(url, {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
      });

      const json = (await res.json()) as TransactionsResponse;

      if (!res.ok) {
        throw new Error(json.success === false ? json.error : "Failed to fetch transactions");
      }

      return json;
    },
    placeholderData: keepPreviousData,
  });

  const {
    data: accountsData,
    isLoading: isLoadingAccounts,
    error: accountsError,
  } = useQuery<AccountsResponse>({
    queryKey: ["accounts", "for-transactions"],
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
    queryKey: ["categories", "expense", "for-transactions"],
    queryFn: async () => {
      const token = localStorage.getItem("pm_token");
      const res = await fetch("/api/categories/expense", {
        headers: { Authorization: token ? `Bearer ${token}` : "" },
      });

      const json = (await res.json()) as ExpenseCategoriesResponse;

      if (!res.ok) {
        throw new Error(
          json.success === false ? json.error : "Failed to fetch expense categories",
        );
      }

      return json;
    },
  });

  const {
    data: incomeCategoriesData,
    isLoading: isLoadingIncomeCategories,
    error: incomeCategoriesError,
  } = useQuery<IncomeCategoriesResponse>({
    queryKey: ["categories", "income", "for-transactions"],
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
    queryKey: ["counterparties", "for-transactions"],
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

  const accountNameById = useMemo(() => {
    const map = new Map<string, string>();
    accounts.forEach((account) => {
      map.set(account.id, account.name);
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

  const transactions = transactionsData?.success === true ? transactionsData.data.transactions : [];
  const pagination = transactionsData?.success === true ? transactionsData.data.pagination : null;

  const isLoading =
    isLoadingTransactions ||
    isLoadingAccounts ||
    isLoadingExpenseCategories ||
    isLoadingIncomeCategories ||
    isLoadingCounterparties;
  const isRefreshing = isFetchingTransactions && !isLoadingTransactions;

  const combinedError =
    transactionsError ||
    accountsError ||
    expenseCategoriesError ||
    incomeCategoriesError ||
    counterpartiesError;

  const sortedTransactions = useMemo(() => {
    const copy = [...transactions];

    copy.sort((a, b) => {
      let aValue: number | string | null = null;
      let bValue: number | string | null = null;

      if (sortField === "amount") {
        aValue = a.amount;
        bValue = b.amount;
      } else if (sortField === "date_time") {
        aValue = a.date_time;
        bValue = b.date_time;
      } else if (sortField === "type") {
        aValue = a.type;
        bValue = b.type;
      } else if (sortField === "category") {
        const aCat = a.expense_category_id ?? a.income_category_id ?? "";
        const bCat = b.expense_category_id ?? b.income_category_id ?? "";
        aValue = categoryNameById.get(aCat) ?? "";
        bValue = categoryNameById.get(bCat) ?? "";
      }

      if (aValue === bValue) return 0;
      if (aValue == null) return 1;
      if (bValue == null) return -1;

      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
      return sortDirection === "asc" ? 1 : -1;
    });

    return copy;
  }, [transactions, sortField, sortDirection, categoryNameById]);

  const uniqueCategoriesForFilter = useMemo(() => {
    const items: { id: string; label: string }[] = [];

    expenseCategories.forEach((parent) => {
      items.push({
        id: parent.id,
        label: formatExpenseCategoryBreadcrumb(parent, null, locale),
      });
      parent.children?.forEach((child) => {
        items.push({
          id: child.id,
          label: formatExpenseCategoryBreadcrumb(parent, child, locale),
        });
      });
    });

    incomeCategories.forEach((cat) => {
      items.push({ id: cat.id, label: incomeCategoryDisplayName(cat, locale) });
    });

    return items;
  }, [expenseCategories, incomeCategories, locale]);

  function resetFilters() {
    setSearchQuery("");
    setTypeFilter("all");
    setAccountFilter("all");
    setCategoryFilter("all");
    setStartDate("");
    setEndDate("");
    setPage(1);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t.pageTitle}</h1>
          <p className="text-muted-foreground">{t.pageSubtitle}</p>
        </div>
        <Button asChild>
          <Link href="/transactions/new">
            <Plus className="mr-2 h-4 w-4" />
            {m.mainLayout.addTransaction}
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="md:col-span-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t.searchPlaceholder}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              className="pl-9"
            />
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Calendar className="hidden h-4 w-4 text-muted-foreground sm:block" />
          <Input
            type="date"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value);
              setPage(1);
            }}
            className="h-9 w-full text-xs"
          />
          <span className="px-1 text-xs text-muted-foreground">{m.common.to}</span>
          <Input
            type="date"
            value={endDate}
            onChange={(e) => {
              setEndDate(e.target.value);
              setPage(1);
            }}
            className="h-9 w-full text-xs"
          />
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
          <Select
            value={typeFilter}
            onValueChange={(value) => {
              setTypeFilter(value);
              setPage(1);
            }}
          >
            <SelectTrigger className="h-9 w-full sm:w-[140px]">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder={t.typePlaceholder} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t.allTypes}</SelectItem>
              {TRANSACTION_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {transactionTypeLabel(type, m.transactionTypes)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={accountFilter}
            onValueChange={(value) => {
              setAccountFilter(value);
              setPage(1);
            }}
          >
            <SelectTrigger className="h-9 w-full sm:w-[150px]">
              <SelectValue placeholder={t.accountPlaceholder} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t.allAccounts}</SelectItem>
              {accounts.map((account) => (
                <SelectItem key={account.id} value={account.id}>
                  {account.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between md:col-span-2 lg:col-span-4">
          <Select
            value={categoryFilter}
            onValueChange={(value) => {
              setCategoryFilter(value);
              setPage(1);
            }}
          >
            <SelectTrigger className="h-9 w-full sm:w-[220px]">
              <SelectValue placeholder={t.categoryPlaceholder} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t.allCategories}</SelectItem>
              {uniqueCategoriesForFilter.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={resetFilters}
            >
              {m.common.clearFilters}
            </Button>
          </div>
        </div>
      </div>

      {isLoading && !transactionsData && (
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">{t.loading}</p>
        </div>
      )}

      {isRefreshing && !combinedError && (
        <p className="text-sm text-muted-foreground">{t.refreshing}</p>
      )}

      {combinedError && (
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
          <p className="text-sm font-medium text-destructive">
            {combinedError instanceof Error ? combinedError.message : m.common.failedToLoad}
          </p>
        </div>
      )}

      {!combinedError && (
        <>
          {sortedTransactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12">
              <p className="mb-2 text-lg font-medium">{t.emptyTitle}</p>
              <p className="mb-4 text-sm text-muted-foreground">
                {searchQuery ||
                typeFilter !== "all" ||
                accountFilter !== "all" ||
                categoryFilter !== "all" ||
                startDate ||
                endDate
                  ? t.emptyFiltered
                  : t.emptyNew}
              </p>
              {!searchQuery &&
                typeFilter === "all" &&
                accountFilter === "all" &&
                categoryFilter === "all" &&
                !startDate &&
                !endDate && (
                  <Button asChild>
                    <Link href="/transactions/new">
                      <Plus className="mr-2 h-4 w-4" />
                      {m.mainLayout.addTransaction}
                    </Link>
                  </Button>
                )}
            </div>
          ) : (
            <>
              <div className="space-y-3 md:hidden">
                {sortedTransactions.map((txn) => {
                  const categoryId = txn.expense_category_id ?? txn.income_category_id ?? undefined;
                  const categoryLabel = categoryId
                    ? categoryNameById.get(categoryId) ?? m.common.na
                    : m.common.na;

                  let accountLabel = m.common.na;
                  if (txn.type === "Expense" && txn.from_account_id) {
                    accountLabel = accountNameById.get(txn.from_account_id) ?? m.common.na;
                  } else if (txn.type === "Income" && txn.to_account_id) {
                    accountLabel = accountNameById.get(txn.to_account_id) ?? m.common.na;
                  } else if (txn.type === "Transfer") {
                    const fromName = txn.from_account_id
                      ? accountNameById.get(txn.from_account_id) ?? ""
                      : "";
                    const toName = txn.to_account_id ? accountNameById.get(txn.to_account_id) ?? "" : "";
                    accountLabel = [fromName, toName].filter(Boolean).join(" → ") || m.common.na;
                  } else if (txn.type === "Borrow") {
                    const fromName = txn.from_account_id
                      ? accountNameById.get(txn.from_account_id) ?? ""
                      : "";
                    const toName = txn.to_account_id ? accountNameById.get(txn.to_account_id) ?? "" : "";
                    accountLabel = [fromName, toName].filter(Boolean).join(" ↔ ") || m.common.na;
                  }

                  const counterpartyLabel = txn.counterparty_id
                    ? counterpartyNameById.get(txn.counterparty_id) ?? ""
                    : "";

                  const amountSign =
                    txn.type === "Income" || (txn.type === "Borrow" && txn.to_account_id) ? "+" : "-";

                  const amountClassName =
                    amountSign === "+"
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-red-600 dark:text-red-400";

                  const formattedDate = new Date(txn.date_time).toLocaleString();

                  return (
                    <div key={txn.id} className="rounded-lg border bg-card p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <Link
                            href={`/transactions/${txn.id}`}
                            className="text-xs text-muted-foreground hover:underline"
                          >
                            {formattedDate}
                          </Link>
                          <p className="mt-1 text-sm font-medium">
                            {transactionTypeLabel(txn.type, m.transactionTypes)}
                          </p>
                        </div>
                        <span className={`text-sm font-semibold ${amountClassName}`}>
                          {amountSign}
                          {txn.amount.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}{" "}
                          {txn.currency}
                        </span>
                      </div>
                      <div className="mt-2 space-y-1 text-xs">
                        <p>
                          <span className="text-muted-foreground">{t.mobileCategory}</span>
                          {categoryLabel}
                        </p>
                        <p>
                          <span className="text-muted-foreground">{t.mobileAccount}</span>
                          {accountLabel}
                          {counterpartyLabel ? ` · ${counterpartyLabel}` : ""}
                        </p>
                        <p>
                          <span className="text-muted-foreground">{t.mobileBalanceAfter}</span>
                          {m.common.na}
                        </p>
                        <p className="line-clamp-2 text-muted-foreground">
                          {txn.details || m.common.na}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="hidden overflow-x-auto rounded-lg border bg-card md:block">
                <table className="min-w-full divide-y divide-border text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="whitespace-nowrap px-3 py-2 text-left font-medium text-muted-foreground">
                        <button
                          type="button"
                          className="inline-flex items-center gap-1"
                          onClick={() => toggleSort("date_time")}
                        >
                          {t.tableDate}
                          <ArrowUpDown className="h-3 w-3" />
                        </button>
                      </th>
                      <th className="whitespace-nowrap px-3 py-2 text-left font-medium text-muted-foreground">
                        <button
                          type="button"
                          className="inline-flex items-center gap-1"
                          onClick={() => toggleSort("type")}
                        >
                          {t.tableType}
                          <ArrowUpDown className="h-3 w-3" />
                        </button>
                      </th>
                      <th className="whitespace-nowrap px-3 py-2 text-left font-medium text-muted-foreground">
                        <button
                          type="button"
                          className="inline-flex items-center gap-1"
                          onClick={() => toggleSort("category")}
                        >
                          {t.tableCategory}
                          <ArrowUpDown className="h-3 w-3" />
                        </button>
                      </th>
                      <th className="whitespace-nowrap px-3 py-2 text-left font-medium text-muted-foreground">
                        {t.tableAccount}
                      </th>
                      <th className="whitespace-nowrap px-3 py-2 text-right font-medium text-muted-foreground">
                        <button
                          type="button"
                          className="inline-flex items-center gap-1"
                          onClick={() => toggleSort("amount")}
                        >
                          {t.tableAmount}
                          <ArrowUpDown className="h-3 w-3" />
                        </button>
                      </th>
                      <th className="whitespace-nowrap px-3 py-2 text-right font-medium text-muted-foreground">
                        {t.tableBalance}
                      </th>
                      <th className="whitespace-nowrap px-3 py-2 text-left font-medium text-muted-foreground">
                        {t.tableNotes}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {sortedTransactions.map((txn) => {
                      const categoryId = txn.expense_category_id ?? txn.income_category_id ?? undefined;
                      const categoryLabel = categoryId
                        ? categoryNameById.get(categoryId) ?? m.common.na
                        : m.common.na;

                      let accountLabel = m.common.na;
                      if (txn.type === "Expense" && txn.from_account_id) {
                        accountLabel = accountNameById.get(txn.from_account_id) ?? m.common.na;
                      } else if (txn.type === "Income" && txn.to_account_id) {
                        accountLabel = accountNameById.get(txn.to_account_id) ?? m.common.na;
                      } else if (txn.type === "Transfer") {
                        const fromName = txn.from_account_id
                          ? accountNameById.get(txn.from_account_id) ?? ""
                          : "";
                        const toName = txn.to_account_id ? accountNameById.get(txn.to_account_id) ?? "" : "";
                        accountLabel = [fromName, toName].filter(Boolean).join(" → ") || m.common.na;
                      } else if (txn.type === "Borrow") {
                        const fromName = txn.from_account_id
                          ? accountNameById.get(txn.from_account_id) ?? ""
                          : "";
                        const toName = txn.to_account_id ? accountNameById.get(txn.to_account_id) ?? "" : "";
                        accountLabel = [fromName, toName].filter(Boolean).join(" ↔ ") || m.common.na;
                      }

                      const counterpartyLabel = txn.counterparty_id
                        ? counterpartyNameById.get(txn.counterparty_id) ?? ""
                        : "";

                      const amountSign =
                        txn.type === "Income" || (txn.type === "Borrow" && txn.to_account_id)
                          ? "+"
                          : "-";

                      const amountClassName =
                        amountSign === "+"
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-red-600 dark:text-red-400";

                      const formattedDate = new Date(txn.date_time).toLocaleString();

                      return (
                        <tr key={txn.id} className="hover:bg-muted/40">
                          <td className="whitespace-nowrap px-3 py-2 text-xs text-muted-foreground">
                            <Link href={`/transactions/${txn.id}`} className="hover:underline">
                              {formattedDate}
                            </Link>
                          </td>
                          <td className="whitespace-nowrap px-3 py-2 text-xs font-medium">
                            {transactionTypeLabel(txn.type, m.transactionTypes)}
                          </td>
                          <td className="whitespace-nowrap px-3 py-2 text-xs">{categoryLabel}</td>
                          <td className="whitespace-nowrap px-3 py-2 text-xs">
                            {accountLabel}
                            {counterpartyLabel && (
                              <span className="ml-1 text-[10px] text-muted-foreground">
                                · {counterpartyLabel}
                              </span>
                            )}
                          </td>
                          <td className="whitespace-nowrap px-3 py-2 text-right text-xs font-semibold">
                            <span className={amountClassName}>
                              {amountSign}
                              {txn.amount.toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}{" "}
                              {txn.currency}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-3 py-2 text-right text-xs text-muted-foreground">
                            {/* Balance-after per transaction will be provided by reporting layer in Sprint 4. */}
                            {m.common.na}
                          </td>
                          <td className="max-w-[180px] px-3 py-2 text-xs text-muted-foreground">
                            <span className="line-clamp-1">{txn.details || m.common.na}</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {pagination && pagination.totalPages > 1 && (
            <div className="flex flex-col gap-2 pt-4 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
              <div>
                {m.common.pageWord} {pagination.page} {m.common.ofWord} {pagination.totalPages} ·{" "}
                {pagination.total}{" "}
                {pagination.total === 1 ? m.common.transaction : m.common.transactions}
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={pagination.page <= 1}
                  onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                >
                  {m.common.previous}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() =>
                    setPage((prev) =>
                      pagination.totalPages ? Math.min(prev + 1, pagination.totalPages) : prev,
                    )
                  }
                >
                  {m.common.next}
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function TransactionsPage() {
  return (
    <Suspense fallback={<TransactionsLoadingFallback />}>
      <TransactionsPageInner />
    </Suspense>
  );
}
