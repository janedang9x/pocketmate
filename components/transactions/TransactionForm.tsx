"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLocaleContext } from "@/components/providers/LocaleProvider";
import { transactionTabLabel } from "@/lib/i18n/labels";
import { buildCreateTransactionSchemas } from "@/lib/i18n/zod/transaction-schemas";
import { localizedSeedCategoryName } from "@/lib/i18n/seed-category-labels";
import type { CreateTransactionInput } from "@/lib/schemas/transaction.schema";
import type { AccountWithBalance } from "@/types/account.types";
import type { Currency } from "@/types/account.types";
import type { Counterparty } from "@/types/counterparty.types";
import type { ExpenseCategoryWithChildren, IncomeCategory } from "@/types/category.types";
import type { TransactionType } from "@/types/transaction.types";
import { CategorySelector } from "@/components/categories/CategorySelector";
import { CategoryIcon } from "@/components/categories/CategoryIcon";
import { CounterpartySelector } from "@/components/counterparties/CounterpartySelector";
import { AccountSelect } from "@/components/transactions/AccountSelect";
import { useTransactionInlineCreate } from "@/components/transactions/useTransactionInlineCreate";
import { getCurrencyLabel } from "@/lib/utils/account.utils";
import { getLatestVndExchangeRates, type VndExchangeRates } from "@/lib/utils/exchange-rate.utils";

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
  /**
   * Preferred account id from the latest transaction.
   * Used to auto-fill account selectors on create flow.
   */
  latestTransactionAccountId?: string;
  /**
   * Top expense category ids ordered by usage frequency (desc).
   * Used for quick-select chips in Expense tab.
   */
  mostUsedExpenseCategoryIds?: string[];
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

function normalizeAmountByCurrency(value: number, currency?: string): number {
  if (!Number.isFinite(value)) return 0;
  if (currency === "VND") return Math.round(value);
  return value;
}

function parseAmountInput(raw: string, currency?: string): number {
  const sanitized = raw.replace(/,/g, "").trim();
  if (!sanitized) return 0;
  const parsed = Number(sanitized);
  if (!Number.isFinite(parsed)) return 0;
  return normalizeAmountByCurrency(parsed, currency);
}

function formatAmountDisplay(value: number | undefined, currency?: string): string {
  if (value == null || !Number.isFinite(value) || value === 0) return "";
  const maxFractionDigits = currency === "VND" ? 0 : 2;
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: maxFractionDigits,
  });
}

interface FormattedAmountInputProps {
  id: string;
  value: number | undefined;
  onValueChange: (next: number) => void;
  currency?: string;
  onManualEdit?: () => void;
}

function FormattedAmountInput({
  id,
  value,
  onValueChange,
  currency,
  onManualEdit,
}: FormattedAmountInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [editingValue, setEditingValue] = useState("");

  useEffect(() => {
    if (isFocused) return;
    setEditingValue(formatAmountDisplay(value, currency));
  }, [isFocused, value, currency]);

  const displayValue = isFocused
    ? editingValue
    : formatAmountDisplay(value, currency);

  return (
    <Input
      id={id}
      type="text"
      inputMode="decimal"
      placeholder={currency === "VND" ? "0" : "0.00"}
      value={displayValue}
      onFocus={() => {
        setIsFocused(true);
        const raw =
          value == null || !Number.isFinite(value) || value === 0
            ? ""
            : String(value);
        setEditingValue(raw);
      }}
      onBlur={() => {
        const parsed = parseAmountInput(editingValue, currency);
        onValueChange(parsed);
        setEditingValue(formatAmountDisplay(parsed, currency));
        setIsFocused(false);
      }}
      onChange={(event) => {
        const raw = event.target.value;
        const normalizedRaw = raw.replace(/[^0-9.,]/g, "");
        setEditingValue(normalizedRaw);
        const parsed = parseAmountInput(normalizedRaw, currency);
        onValueChange(parsed);
        onManualEdit?.();
      }}
    />
  );
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
  latestTransactionAccountId,
  mostUsedExpenseCategoryIds = [],
}: TransactionFormProps) {
  const { messages: m, locale } = useLocaleContext();
  const tf = m.transactionForm;

  const transactionSchemas = useMemo(
    () => buildCreateTransactionSchemas(m.validation.transaction),
    [m.validation.transaction],
  );

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
  const [cachedRates, setCachedRates] = useState<VndExchangeRates | null>(null);
  const [hasManualTransferOverride, setHasManualTransferOverride] = useState(false);
  const [autoFilledSide, setAutoFilledSide] = useState<"source" | "destination" | null>(null);
  const autoFilledSideRef = useRef<"source" | "destination" | null>(null);

  const form = useForm<CreateTransactionInput>({
    resolver: zodResolver(transactionSchemas.createTransactionSchema),
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

  const preferredAutoAccountId = useMemo(() => {
    if (accounts.length === 0) return undefined;
    if (accounts.length === 1) return accounts[0]?.id;
    return latestTransactionAccountId;
  }, [accounts, latestTransactionAccountId]);

  const inlineCreate = useTransactionInlineCreate({
    form,
    expenseCategories,
  });

  const watchAmount = form.watch("amount");
  const watchDestinationAmount = form.watch("destinationAmount" as any);
  const watchFromAccountId = form.watch("fromAccountId");
  const watchToAccountId = form.watch("toAccountId");
  const watchType = form.watch("type");
  const watchExpenseCategoryId = form.watch("expenseCategoryId" as any);
  const isTransfer = (watchType as TransactionType) === "Transfer";

  const expenseCategoryLookup = useMemo(() => {
    const entries = expenseCategories.flatMap((parent) => {
      const parentLabel = localizedSeedCategoryName(parent.name, parent.isDefault, locale, "expense");
      const parentEntry = [
        parent.id,
        {
          id: parent.id,
          name: parentLabel,
          icon: parent.icon,
        },
      ] as const;
      const childEntries = parent.children.map((child) => {
        const childLabel = localizedSeedCategoryName(
          child.name,
          child.user_id === null,
          locale,
          "expense",
        );
        return [
          child.id,
          {
            id: child.id,
            name: childLabel,
            icon: child.icon,
          },
        ] as const;
      });
      return [parentEntry, ...childEntries];
    });
    return new Map(entries);
  }, [expenseCategories, locale]);

  const mostUsedExpenseCategories = useMemo(() => {
    const fromMostUsed = mostUsedExpenseCategoryIds
      .map((id) => expenseCategoryLookup.get(id))
      .filter((category): category is { id: string; name: string; icon?: string | null } => Boolean(category))
      .slice(0, 4);

    const selectedIds = new Set(fromMostUsed.map((category) => category.id));
    const fallbackNames = ["Groceries", "Household Supplies", "Fuel"];

    const fallbackCategories = fallbackNames
      .map((fallbackName) =>
        expenseCategories
          .flatMap((parent) => [parent, ...parent.children])
          .find((category) => category.name === fallbackName),
      )
      .filter((category): category is { id: string; name: string; icon?: string | null; user_id?: string | null } =>
        Boolean(category),
      )
      .map((category) => expenseCategoryLookup.get(category.id))
      .filter((category): category is { id: string; name: string; icon?: string | null } => Boolean(category))
      .filter((category) => !selectedIds.has(category.id));

    return [...fromMostUsed, ...fallbackCategories].slice(0, 4);
  }, [mostUsedExpenseCategoryIds, expenseCategoryLookup, expenseCategories]);

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
    let active = true;
    getLatestVndExchangeRates()
      .then((rates) => {
        if (active) setCachedRates(rates);
      })
      .catch((error) => {
        console.error("Failed to load cached exchange rates:", error);
      });
    return () => {
      active = false;
    };
  }, []);

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

  useEffect(() => {
    // Keep edit forms untouched; auto-fill is for create flow.
    if (defaultValues) return;
    if (!preferredAutoAccountId) return;

    const currentType = watchType as TransactionType;

    const setIfEmpty = (field: "fromAccountId" | "toAccountId") => {
      const currentValue = form.getValues(field);
      if (!currentValue) {
        form.setValue(field, preferredAutoAccountId, {
          shouldDirty: false,
          shouldTouch: false,
          shouldValidate: false,
        });
      }
    };

    if (currentType === "Income" || (currentType === "Borrow" && activeTab === "Borrow")) {
      setIfEmpty("toAccountId");
      return;
    }

    if (
      currentType === "Expense" ||
      currentType === "Transfer" ||
      (currentType === "Borrow" && activeTab === "Lend")
    ) {
      setIfEmpty("fromAccountId");
    }
  }, [activeTab, watchType, preferredAutoAccountId, defaultValues, form]);

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

  function getPairRate(
    from: Currency,
    to: Currency,
    rates: VndExchangeRates | null,
  ): number | null {
    if (!rates) return null;
    if (from === to) return 1;

    const toVnd = (currency: Currency) => {
      if (currency === "VND") return 1;
      if (currency === "USD") return rates.usdToVnd;
      return rates.maceToVnd;
    };

    const fromToVnd = toVnd(from);
    const toToVnd = toVnd(to);
    if (!fromToVnd || !toToVnd) return null;
    return fromToVnd / toToVnd;
  }

  const cachedPairRate =
    fromAccount && toAccount && hasDifferentCurrencies
      ? getPairRate(fromAccount.currency as Currency, toAccount.currency as Currency, cachedRates)
      : null;

  function getPreferredExchangeDirection(
    from: Currency,
    to: Currency,
  ): { base: Currency; quote: Currency } {
    if (from === "mace" || to === "mace") {
      return { base: "mace", quote: from === "mace" ? to : from };
    }
    if (from === "USD" || to === "USD") {
      return { base: "USD", quote: from === "USD" ? to : from };
    }
    return { base: from, quote: to };
  }

  const effectiveFromToRate =
    watchAmount && watchDestinationAmount && watchAmount > 0 && watchDestinationAmount > 0
      ? watchDestinationAmount / watchAmount
      : cachedPairRate;

  const preferredDirection =
    fromAccount && toAccount && hasDifferentCurrencies
      ? getPreferredExchangeDirection(fromAccount.currency as Currency, toAccount.currency as Currency)
      : null;

  const preferredDirectionRate =
    preferredDirection &&
    fromAccount &&
    toAccount &&
    effectiveFromToRate &&
    effectiveFromToRate > 0
      ? preferredDirection.base === (fromAccount.currency as Currency)
        ? effectiveFromToRate
        : 1 / effectiveFromToRate
      : null;

  const amountCurrencyLabel =
    (watchType as TransactionType) === "Expense"
      ? accounts.find((a) => a.id === watchFromAccountId)?.currency
      : (watchType as TransactionType) === "Income"
        ? accounts.find((a) => a.id === watchToAccountId)?.currency
        : (watchType as TransactionType) === "Transfer"
          ? fromAccount?.currency ?? toAccount?.currency
          : (watchType as TransactionType) === "Borrow"
            ? activeTab === "Lend"
              ? accounts.find((a) => a.id === watchFromAccountId)?.currency
              : accounts.find((a) => a.id === watchToAccountId)?.currency
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

  useEffect(() => {
    autoFilledSideRef.current = autoFilledSide;
  }, [autoFilledSide]);

  useEffect(() => {
    if (!isTransfer || !hasDifferentCurrencies) {
      setHasManualTransferOverride(false);
      setAutoFilledSide(null);
      return;
    }
    setHasManualTransferOverride(false);
    setAutoFilledSide(null);
  }, [isTransfer, hasDifferentCurrencies, watchFromAccountId, watchToAccountId]);

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
                {transactionTabLabel(tab, tf.tabs)}
              </TabsTrigger>
            );
          })}
        </TabsList>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="dateTime">{tf.dateTime}</Label>
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
                {amountCurrencyLabel
                  ? tf.amountWithCurrency.replace(
                      "{currency}",
                      getCurrencyLabel(amountCurrencyLabel as Currency),
                    )
                  : tf.amount}
              </Label>
              <Controller
                control={form.control}
                name="amount"
                render={({ field }) => {
                  const normalizedValue = normalizeAmountByCurrency(Number(field.value ?? 0), amountCurrencyLabel);
                  return (
                    <FormattedAmountInput
                      id="amount"
                      value={Number.isFinite(normalizedValue) ? normalizedValue : 0}
                      currency={amountCurrencyLabel}
                      onValueChange={(next) => field.onChange(next)}
                    />
                  );
                }}
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

        </div>

        <TabsContent value="Expense" className="mt-4 space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="fromAccountId">{tf.fromAccount}</Label>
              <Controller
                control={form.control}
                name="fromAccountId"
                render={({ field }) => (
                  <AccountSelect
                    id="fromAccountId"
                    value={field.value}
                    onChange={field.onChange}
                    accounts={accounts}
                    onRequestCreate={() => inlineCreate.openCreateAccount("fromAccountId")}
                  />
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
              <Label>{tf.expenseCategory}</Label>
              <CategorySelector
                control={form.control}
                name="expenseCategoryId"
                categories={expenseCategories}
                type="expense"
                placeholder={tf.phExpenseCategory}
                onCreateNew={inlineCreate.openCreateExpenseCategory}
              />
              {mostUsedExpenseCategories.length > 0 ? (
                <div className="space-y-2 pt-1">
                  <p className="text-xs text-muted-foreground">{tf.mostUsedExpenseCategories}</p>
                  <div className="flex flex-wrap gap-2">
                    {mostUsedExpenseCategories.map((category) => {
                      const isSelected = watchExpenseCategoryId === category.id;
                      return (
                        <Button
                          key={category.id}
                          type="button"
                          variant={isSelected ? "default" : "outline"}
                          size="sm"
                          className="h-8 gap-1.5"
                          onClick={() =>
                            form.setValue("expenseCategoryId" as any, category.id, {
                              shouldDirty: true,
                              shouldTouch: true,
                              shouldValidate: true,
                            })
                          }
                        >
                          <CategoryIcon icon={category.icon} name={category.name} kind="expense" />
                          <span className="max-w-[180px] truncate">{category.name}</span>
                        </Button>
                      );
                    })}
                  </div>
                </div>
              ) : null}
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
              <Label>{tf.counterpartyOptional}</Label>
              <CounterpartySelector
                control={form.control}
                name="counterpartyId"
                counterparties={counterparties}
                placeholder={tf.phCounterparty}
                allowNone
                onCreateNew={inlineCreate.openCreateCounterparty}
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
              <Label htmlFor="toAccountId">{tf.toAccount}</Label>
              <Controller
                control={form.control}
                name="toAccountId"
                render={({ field }) => (
                  <AccountSelect
                    id="toAccountId"
                    value={field.value}
                    onChange={field.onChange}
                    accounts={accounts}
                    onRequestCreate={() => inlineCreate.openCreateAccount("toAccountId")}
                  />
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
              <Label>{tf.incomeCategory}</Label>
              <CategorySelector
                control={form.control}
                name="incomeCategoryId"
                categories={incomeCategories}
                type="income"
                placeholder={tf.phIncomeCategory}
                onCreateNew={inlineCreate.openCreateIncomeCategory}
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
              <Label>{tf.counterpartyOptional}</Label>
              <CounterpartySelector
                control={form.control}
                name="counterpartyId"
                counterparties={counterparties}
                placeholder={tf.phCounterparty}
                allowNone
                onCreateNew={inlineCreate.openCreateCounterparty}
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="Transfer" className="mt-4 space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="fromAccountId-transfer">{tf.fromAccount}</Label>
              <Controller
                control={form.control}
                name="fromAccountId"
                render={({ field }) => (
                  <AccountSelect
                    id="fromAccountId-transfer"
                    value={field.value}
                    onChange={field.onChange}
                    accounts={accounts}
                    showCurrencyLabel
                    onRequestCreate={() => inlineCreate.openCreateAccount("fromAccountId")}
                  />
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
              <Label htmlFor="toAccountId-transfer">{tf.toAccount}</Label>
              <Controller
                control={form.control}
                name="toAccountId"
                render={({ field }) => (
                  <AccountSelect
                    id="toAccountId-transfer"
                    value={field.value}
                    onChange={field.onChange}
                    accounts={accounts}
                    showCurrencyLabel
                    onRequestCreate={() => inlineCreate.openCreateAccount("toAccountId")}
                  />
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
                    {tf.amountWithCurrency.replace(
                      "{currency}",
                      fromAccount
                        ? getCurrencyLabel(fromAccount.currency as Currency)
                        : tf.sourceCurrency,
                    )}
                  </Label>
                  <Controller
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                      <FormattedAmountInput
                        id="amount"
                        value={normalizeAmountByCurrency(Number(field.value ?? 0), fromAccount?.currency as string) ?? 0}
                        currency={fromAccount?.currency as string}
                        onValueChange={(next) => {
                          field.onChange(next);

                          if (
                            !hasManualTransferOverride &&
                            autoFilledSide !== "source" &&
                            cachedPairRate &&
                            cachedPairRate > 0 &&
                            hasDifferentCurrencies
                          ) {
                            const autoDestination = normalizeAmountByCurrency(
                              next * cachedPairRate,
                              toAccount?.currency as string,
                            );
                            form.setValue("destinationAmount" as any, autoDestination, {
                              shouldDirty: true,
                            });
                            setAutoFilledSide("destination");
                          }
                        }}
                        onManualEdit={() => {
                          if (autoFilledSideRef.current === "source") {
                            setHasManualTransferOverride(true);
                          }
                        }}
                      />
                    )}
                  />
                  {form.formState.errors.amount?.message ? (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.amount.message}
                    </p>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="destinationAmount">
                    {tf.amountWithCurrency.replace(
                      "{currency}",
                      toAccount
                        ? getCurrencyLabel(toAccount.currency as Currency)
                        : tf.destinationCurrency,
                    )}
                  </Label>
                  <Controller
                    control={form.control}
                    name={"destinationAmount" as any}
                    render={({ field }) => (
                      <FormattedAmountInput
                        id="destinationAmount"
                        value={normalizeAmountByCurrency(Number(field.value ?? 0), toAccount?.currency as string) ?? 0}
                        currency={toAccount?.currency as string}
                        onValueChange={(next) => {
                          field.onChange(next);

                          if (
                            !hasManualTransferOverride &&
                            autoFilledSide !== "destination" &&
                            cachedPairRate &&
                            cachedPairRate > 0 &&
                            hasDifferentCurrencies
                          ) {
                            const autoSource = normalizeAmountByCurrency(
                              next / cachedPairRate,
                              fromAccount?.currency as string,
                            );
                            form.setValue("amount", autoSource, {
                              shouldDirty: true,
                            });
                            setAutoFilledSide("source");
                          }
                        }}
                        onManualEdit={() => {
                          if (autoFilledSideRef.current === "destination") {
                            setHasManualTransferOverride(true);
                          }
                        }}
                      />
                    )}
                  />
                </div>

                <div className="space-y-1 md:col-span-2">
                  {preferredDirection && preferredDirectionRate && preferredDirectionRate > 0 ? (
                    <p className="text-xs text-muted-foreground">
                      {tf.exchangeRateLine}{" "}
                      <span className="font-medium">
                        1 {getCurrencyLabel(preferredDirection.base)} ={" "}
                        {preferredDirectionRate.toFixed(4)}{" "}
                        {getCurrencyLabel(preferredDirection.quote)}
                      </span>
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground">{tf.enterAmountForRate}</p>
                  )}
                </div>
              </>
            )}

            {!hasDifferentCurrencies && (
              <div className="space-y-2 md:col-span-2">
                <p className="text-xs text-muted-foreground">{tf.sameCurrencyHint}</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="Borrow" className="mt-4 space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="borrow-account">{tf.toAccount}</Label>
              <Controller
                control={form.control}
                name="toAccountId"
                render={({ field }) => (
                  <AccountSelect
                    id="borrow-account"
                    value={field.value}
                    onChange={field.onChange}
                    accounts={accounts}
                    onRequestCreate={() => inlineCreate.openCreateAccount("toAccountId")}
                  />
                )}
              />
              {(form.formState.errors as { toAccountId?: { message?: string } })["toAccountId"]?.message ? (
                <p className="text-sm text-destructive">
                  {
                    (form.formState.errors as { toAccountId?: { message?: string } })["toAccountId"]?.message
                  }
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label>{tf.counterparty}</Label>
              <CounterpartySelector
                control={form.control}
                name="counterpartyId"
                counterparties={counterparties}
                placeholder={tf.phCounterparty}
                allowNone={false}
                onCreateNew={inlineCreate.openCreateCounterparty}
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
              <Label htmlFor="lend-account">{tf.fromAccount}</Label>
              <Controller
                control={form.control}
                name="fromAccountId"
                render={({ field }) => (
                  <AccountSelect
                    id="lend-account"
                    value={field.value}
                    onChange={field.onChange}
                    accounts={accounts}
                    onRequestCreate={() => inlineCreate.openCreateAccount("fromAccountId")}
                  />
                )}
              />
              {(form.formState.errors as { fromAccountId?: { message?: string } })["fromAccountId"]?.message ? (
                <p className="text-sm text-destructive">
                  {
                    (form.formState.errors as { fromAccountId?: { message?: string } })["fromAccountId"]?.message
                  }
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label>{tf.counterparty}</Label>
              <CounterpartySelector
                control={form.control}
                name="counterpartyId"
                counterparties={counterparties}
                placeholder={tf.phCounterparty}
                allowNone={false}
                onCreateNew={inlineCreate.openCreateCounterparty}
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

      <div className="space-y-2">
        <Label htmlFor="details">{tf.notesDetails}</Label>
        <textarea
          id="details"
          className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          placeholder={tf.notesPlaceholder}
          {...form.register("details")}
        />
        {form.formState.errors.details?.message ? (
          <p className="text-sm text-destructive">
            {form.formState.errors.details.message}
          </p>
        ) : null}
      </div>

      <div className="pt-2">
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? tf.saving : tf.saveTransaction}
        </Button>
      </div>

      {inlineCreate.dialogs}
    </form>
  );
}

