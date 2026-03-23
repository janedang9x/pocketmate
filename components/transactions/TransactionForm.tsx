"use client";

import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createBorrowTransactionSchema,
  createExpenseTransactionSchema,
  createIncomeTransactionSchema,
  createTransferTransactionSchema,
  createTransactionSchema,
  type CreateTransactionInput,
} from "@/lib/schemas/transaction.schema";
import type { AccountWithBalance } from "@/types/account.types";
import type { Counterparty } from "@/types/counterparty.types";
import type { ExpenseCategoryWithChildren, IncomeCategory } from "@/types/category.types";
import type { TransactionType } from "@/types/transaction.types";
import { CategorySelector } from "@/components/categories/CategorySelector";
import { CounterpartySelector } from "@/components/counterparties/CounterpartySelector";

interface TransactionFormProps {
  accounts: AccountWithBalance[];
  expenseCategories: ExpenseCategoryWithChildren[];
  incomeCategories: IncomeCategory[];
  counterparties: Counterparty[];
  onSubmit: (data: CreateTransactionInput) => Promise<void>;
  isSubmitting?: boolean;
  /**
   * Optional default values for editing an existing transaction.
   * When provided, the form will initialize with these values.
   */
  defaultValues?: Partial<CreateTransactionInput> & { type: TransactionType };
  /**
   * When true, the transaction type tabs are visually shown but switching types is disabled.
   * Used for edit flows to prevent changing transaction type (FR-TXN-006).
   */
  disableTypeChange?: boolean;
}

type TransactionTab = "Expense" | "Income" | "Transfer" | "Borrow" | "Lend";

const TRANSACTION_TABS: TransactionTab[] = ["Expense", "Income", "Transfer", "Borrow", "Lend"];

function tabToTransactionType(tab: TransactionTab): TransactionType {
  if (tab === "Lend") return "Borrow";
  return tab;
}

function getInitialDateTimeLocal() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

/**
 * TransactionForm
 * Implements Sprint 3.4 - Transaction UI Create Flows
 * Implements FR-TXN-001 to FR-TXN-004
 */
export function TransactionForm({
  accounts,
  expenseCategories,
  incomeCategories,
  counterparties,
  onSubmit,
  isSubmitting = false,
  defaultValues,
  disableTypeChange = false,
}: TransactionFormProps) {
  const initialType: TransactionType = defaultValues?.type ?? "Expense";

  const initialTab: TransactionTab =
    initialType === "Borrow"
      ? defaultValues &&
          "fromAccountId" in defaultValues &&
          defaultValues.fromAccountId
        ? "Lend"
        : "Borrow"
      : (initialType as TransactionTab);

  const [activeTab, setActiveTab] = useState<TransactionTab>(initialTab);
  const [borrowMode, setBorrowMode] = useState<"borrowing" | "lending">(() =>
    initialTab === "Lend" ? "lending" : "borrowing",
  );

  const form = useForm<CreateTransactionInput>({
    resolver: zodResolver(createTransactionSchema),
    defaultValues: {
      type: initialType,
      amount: 0,
      currency: accounts[0]?.currency ?? "VND",
      dateTime: getInitialDateTimeLocal(),
      details: "",
      ...defaultValues,
    } as CreateTransactionInput,
    mode: "onTouched",
  });

  const watchAmount = form.watch("amount");
  const watchDestinationAmount = form.watch("destinationAmount" as any);
  const watchFromAccountId = form.watch("fromAccountId");
  const watchToAccountId = form.watch("toAccountId");
  const watchType = form.watch("type");
  const isTransfer = (watchType as TransactionType) === "Transfer";

  async function handleSubmit(values: CreateTransactionInput) {
    await onSubmit(values);
  }

  function handleTabChange(value: string) {
    const nextTab = value as TransactionTab;
    const currentType = watchType as TransactionType;
    const nextType = tabToTransactionType(nextTab);

    if (disableTypeChange && nextType !== currentType) {
      return;
    }

    setActiveTab(nextTab);

    if (nextTab === "Borrow") {
      setBorrowMode("borrowing");
    } else if (nextTab === "Lend") {
      setBorrowMode("lending");
    }

    if (nextType === "Expense") {
      form.reset(
        {
          type: "Expense",
          amount: watchAmount || 0,
          currency: form.getValues("currency"),
          dateTime: form.getValues("dateTime"),
          details: form.getValues("details"),
        } as CreateTransactionInput,
        { keepDirty: false },
      );
    } else if (nextType === "Income") {
      form.reset(
        {
          type: "Income",
          amount: watchAmount || 0,
          currency: form.getValues("currency"),
          dateTime: form.getValues("dateTime"),
          details: form.getValues("details"),
        } as CreateTransactionInput,
        { keepDirty: false },
      );
    } else if (nextType === "Transfer") {
      form.reset(
        {
          type: "Transfer",
          amount: watchAmount || 0,
          currency: form.getValues("currency"),
          dateTime: form.getValues("dateTime"),
          details: form.getValues("details"),
        } as CreateTransactionInput,
        { keepDirty: false },
      );
    } else if (nextType === "Borrow") {
      form.reset(
        {
          type: "Borrow",
          amount: watchAmount || 0,
          currency: form.getValues("currency"),
          dateTime: form.getValues("dateTime"),
          details: form.getValues("details"),
        } as CreateTransactionInput,
        { keepDirty: false },
      );
    }

    form.setValue("type", nextType);
  }

  useEffect(() => {
    const currentTypeValue = watchType as TransactionType;

    function syncCurrencyFromAccount(accountId: string | undefined) {
      if (!accountId) return;
      const account = accounts.find((a) => a.id === accountId);
      if (account) {
        form.setValue(
          "currency",
          account.currency as CreateTransactionInput["currency"],
        );
      }
    }

    if (currentTypeValue === "Expense") {
      syncCurrencyFromAccount(watchFromAccountId);
    } else if (currentTypeValue === "Income") {
      syncCurrencyFromAccount(watchToAccountId);
    } else if (currentTypeValue === "Transfer") {
      syncCurrencyFromAccount(watchFromAccountId);
    } else if (currentTypeValue === "Borrow") {
      syncCurrencyFromAccount(watchToAccountId || watchFromAccountId);
    }
  }, [watchFromAccountId, watchToAccountId, watchType, accounts, form]);

  const fromAccount =
    (watchType as TransactionType) === "Transfer" && watchFromAccountId
      ? accounts.find((a) => a.id === watchFromAccountId) ?? null
      : null;

  const toAccount =
    (watchType as TransactionType) === "Transfer" && watchToAccountId
      ? accounts.find((a) => a.id === watchToAccountId) ?? null
      : null;

  const hasDifferentCurrencies =
    fromAccount && toAccount && fromAccount.currency !== toAccount.currency;

  const amountCurrencyLabel =
    (watchType as TransactionType) === "Expense"
      ? accounts.find((a) => a.id === watchFromAccountId)?.currency
      : (watchType as TransactionType) === "Income"
        ? accounts.find((a) => a.id === watchToAccountId)?.currency
        : (watchType as TransactionType) === "Transfer"
          ? fromAccount?.currency ?? toAccount?.currency
          : (watchType as TransactionType) === "Borrow"
            ? accounts.find((a) => a.id === (watchToAccountId || watchFromAccountId))?.currency
            : undefined;

  useEffect(() => {
    if ((watchType as TransactionType) !== "Transfer") return;
    if (!hasDifferentCurrencies) {
      form.setValue("vndExchange" as any, undefined);
      return;
    }

    if (!watchAmount || !watchDestinationAmount || watchAmount <= 0 || watchDestinationAmount <= 0) {
      return;
    }

    const rate = watchDestinationAmount / watchAmount;
    if (Number.isFinite(rate) && rate > 0) {
      form.setValue("vndExchange" as any, rate);
    }
  }, [
    watchType,
    hasDifferentCurrencies,
    watchAmount,
    watchDestinationAmount,
    form,
  ]);

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="grid w-full grid-cols-5">
          {TRANSACTION_TABS.map((tab) => {
            const tabType = tabToTransactionType(tab);
            const isDisabled =
              disableTypeChange && tabType !== (watchType as TransactionType);

            return (
              <TabsTrigger
                key={tab}
                value={tab}
                aria-disabled={isDisabled}
                className={isDisabled ? "pointer-events-none opacity-60" : ""}
              >
                {tab}
              </TabsTrigger>
            );
          })}
        </TabsList>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="dateTime">Date &amp; Time</Label>
            <Input
              id="dateTime"
              type="datetime-local"
              {...form.register("dateTime")}
            />
            {form.formState.errors.dateTime?.message ? (
              <p className="text-sm text-destructive">
                {form.formState.errors.dateTime.message}
              </p>
            ) : null}
          </div>

          {!isTransfer || !hasDifferentCurrencies ? (
            <div className="space-y-2">
              <Label htmlFor="amount">
                Amount ({amountCurrencyLabel ?? "Currency"})
              </Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                {...form.register("amount", { valueAsNumber: true })}
              />
              {form.formState.errors.amount?.message ? (
                <p className="text-sm text-destructive">
                  {form.formState.errors.amount.message}
                </p>
              ) : null}
            </div>
          ) : (
            <div />
          )}

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="details">Notes / Details</Label>
            <textarea
              id="details"
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              placeholder="Optional note about this transaction"
              {...form.register("details")}
            />
            {form.formState.errors.details?.message ? (
              <p className="text-sm text-destructive">
                {form.formState.errors.details.message}
              </p>
            ) : null}
          </div>
        </div>

        <TabsContent value="Expense" className="mt-4 space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="fromAccountId">From Account</Label>
              <Controller
                control={form.control}
                name="fromAccountId"
                render={({ field }) => (
                  <select
                    id="fromAccountId"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    onChange={field.onChange}
                    value={field.value ?? ""}
                  >
                    <option value="">Select account</option>
                    {accounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.name}
                      </option>
                    ))}
                  </select>
                )}
              />
              {(form.formState.errors as { fromAccountId?: { message?: string } }).fromAccountId
                ?.message ? (
                <p className="text-sm text-destructive">
                  {
                    (form.formState.errors as { fromAccountId?: { message?: string } })
                      .fromAccountId?.message
                  }
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label>Expense Category</Label>
              <CategorySelector
                control={form.control}
                name="expenseCategoryId"
                categories={expenseCategories}
                type="expense"
                placeholder="Select expense category"
              />
              {(form.formState.errors as { expenseCategoryId?: { message?: string } })
                .expenseCategoryId?.message ? (
                <p className="text-sm text-destructive">
                  {
                    (form.formState.errors as { expenseCategoryId?: { message?: string } })
                      .expenseCategoryId?.message
                  }
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label>Counterparty (optional)</Label>
              <CounterpartySelector
                control={form.control}
                name="counterpartyId"
                counterparties={counterparties}
                placeholder="Select counterparty"
                allowNone
              />
            </div>

            <div className="space-y-2">
              {/* Payment method selection is omitted in MVP.
                  Payment behavior is derived from the selected account type. */}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="Income" className="mt-4 space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="toAccountId">To Account</Label>
              <Controller
                control={form.control}
                name="toAccountId"
                render={({ field }) => (
                  <select
                    id="toAccountId"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    onChange={field.onChange}
                    value={field.value ?? ""}
                  >
                    <option value="">Select account</option>
                    {accounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.name}
                      </option>
                    ))}
                  </select>
                )}
              />
              {(form.formState.errors as { toAccountId?: { message?: string } }).toAccountId
                ?.message ? (
                <p className="text-sm text-destructive">
                  {
                    (form.formState.errors as { toAccountId?: { message?: string } })
                      .toAccountId?.message
                  }
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label>Income Category</Label>
              <CategorySelector
                control={form.control}
                name="incomeCategoryId"
                categories={incomeCategories}
                type="income"
                placeholder="Select income category"
              />
              {(form.formState.errors as { incomeCategoryId?: { message?: string } })
                .incomeCategoryId?.message ? (
                <p className="text-sm text-destructive">
                  {
                    (form.formState.errors as { incomeCategoryId?: { message?: string } })
                      .incomeCategoryId?.message
                  }
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label>Counterparty (optional)</Label>
              <CounterpartySelector
                control={form.control}
                name="counterpartyId"
                counterparties={counterparties}
                placeholder="Select counterparty"
                allowNone
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="Transfer" className="mt-4 space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="fromAccountId-transfer">From Account</Label>
              <Controller
                control={form.control}
                name="fromAccountId"
                render={({ field }) => (
                  <select
                    id="fromAccountId-transfer"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    onChange={field.onChange}
                    value={field.value ?? ""}
                  >
                    <option value="">Select account</option>
                    {accounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.name} ({account.currency})
                      </option>
                    ))}
                  </select>
                )}
              />
              {(form.formState.errors as { fromAccountId?: { message?: string } }).fromAccountId
                ?.message ? (
                <p className="text-sm text-destructive">
                  {
                    (form.formState.errors as { fromAccountId?: { message?: string } })
                      .fromAccountId?.message
                  }
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="toAccountId-transfer">To Account</Label>
              <Controller
                control={form.control}
                name="toAccountId"
                render={({ field }) => (
                  <select
                    id="toAccountId-transfer"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    onChange={field.onChange}
                    value={field.value ?? ""}
                  >
                    <option value="">Select account</option>
                    {accounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.name} ({account.currency})
                      </option>
                    ))}
                  </select>
                )}
              />
              {(form.formState.errors as { toAccountId?: { message?: string } }).toAccountId
                ?.message ? (
                <p className="text-sm text-destructive">
                  {
                    (form.formState.errors as { toAccountId?: { message?: string } })
                      .toAccountId?.message
                  }
                </p>
              ) : null}
            </div>

            {hasDifferentCurrencies && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="amount">
                    Amount ({fromAccount?.currency ?? "source currency"})
                  </Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    {...form.register("amount", { valueAsNumber: true })}
                  />
                  {form.formState.errors.amount?.message ? (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.amount.message}
                    </p>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="destinationAmount">
                    Amount ({toAccount?.currency ?? "destination currency"})
                  </Label>
                  <Input
                    id="destinationAmount"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    {...form.register("destinationAmount" as any, { valueAsNumber: true })}
                  />
                </div>

                <div className="space-y-1 md:col-span-2">
                  {watchAmount &&
                  watchDestinationAmount &&
                  watchAmount > 0 &&
                  watchDestinationAmount > 0 ? (
                    <p className="text-xs text-muted-foreground">
                      Exchange rate:{" "}
                      <span className="font-medium">
                        {(
                          watchDestinationAmount / watchAmount
                        ).toFixed(4)}{" "}
                        {toAccount?.currency ?? ""} per 1 {fromAccount?.currency ?? ""}
                      </span>
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Enter both amounts to see the exchange rate.
                    </p>
                  )}
                </div>
              </>
            )}

            {!hasDifferentCurrencies && (
              <div className="space-y-2 md:col-span-2">
                <p className="text-xs text-muted-foreground">
                  Accounts use the same currency, so only one amount is required.
                </p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="Borrow" className="mt-4 space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="borrow-account">
                To Account
              </Label>
              <Controller
                control={form.control}
                name="toAccountId"
                render={({ field }) => (
                  <select
                    id="borrow-account"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    onChange={field.onChange}
                    value={field.value ?? ""}
                  >
                    <option value="">Select account</option>
                    {accounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.name}
                      </option>
                    ))}
                  </select>
                )}
              />
              {(form.formState.errors as { fromAccountId?: { message?: string }; toAccountId?: { message?: string } })[
                "toAccountId"
              ]?.message ? (
                <p className="text-sm text-destructive">
                  {
                    (form.formState.errors as {
                      fromAccountId?: { message?: string };
                      toAccountId?: { message?: string };
                    })[borrowMode === "borrowing" ? "toAccountId" : "fromAccountId"]?.message
                  }
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount-borrow">
                Amount ({accounts.find((a) => a.id === watchToAccountId)?.currency ?? "Currency"})
              </Label>
              <Input
                id="amount-borrow"
                type="number"
                step="0.01"
                placeholder="0.00"
                {...form.register("amount", { valueAsNumber: true })}
              />
              {form.formState.errors.amount?.message ? (
                <p className="text-sm text-destructive">
                  {form.formState.errors.amount.message}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label>Counterparty</Label>
              <CounterpartySelector
                control={form.control}
                name="counterpartyId"
                counterparties={counterparties}
                placeholder="Select counterparty"
                allowNone={false}
              />
              {(form.formState.errors as { counterpartyId?: { message?: string } })
                .counterpartyId?.message ? (
                <p className="text-sm text-destructive">
                  {
                    (form.formState.errors as { counterpartyId?: { message?: string } })
                      .counterpartyId?.message
                  }
                </p>
              ) : null}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="Lend" className="mt-4 space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="lend-account">
                From Account
              </Label>
              <Controller
                control={form.control}
                name="fromAccountId"
                render={({ field }) => (
                  <select
                    id="lend-account"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    onChange={field.onChange}
                    value={field.value ?? ""}
                  >
                    <option value="">Select account</option>
                    {accounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.name}
                      </option>
                    ))}
                  </select>
                )}
              />
              {(form.formState.errors as { fromAccountId?: { message?: string }; toAccountId?: { message?: string } })[
                "fromAccountId"
              ]?.message ? (
                <p className="text-sm text-destructive">
                  {
                    (form.formState.errors as {
                      fromAccountId?: { message?: string };
                      toAccountId?: { message?: string };
                    })[borrowMode === "borrowing" ? "toAccountId" : "fromAccountId"]?.message
                  }
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount-lend">
                Amount ({accounts.find((a) => a.id === watchFromAccountId)?.currency ?? "Currency"})
              </Label>
              <Input
                id="amount-lend"
                type="number"
                step="0.01"
                placeholder="0.00"
                {...form.register("amount", { valueAsNumber: true })}
              />
              {form.formState.errors.amount?.message ? (
                <p className="text-sm text-destructive">
                  {form.formState.errors.amount.message}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label>Counterparty</Label>
              <CounterpartySelector
                control={form.control}
                name="counterpartyId"
                counterparties={counterparties}
                placeholder="Select counterparty"
                allowNone={false}
              />
              {(form.formState.errors as { counterpartyId?: { message?: string } })
                .counterpartyId?.message ? (
                <p className="text-sm text-destructive">
                  {
                    (form.formState.errors as { counterpartyId?: { message?: string } })
                      .counterpartyId?.message
                  }
                </p>
              ) : null}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <div className="pt-2">
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Save Transaction"}
        </Button>
      </div>
    </form>
  );
}

