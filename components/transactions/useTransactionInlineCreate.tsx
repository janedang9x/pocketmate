"use client";

import { useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import type { UseFormReturn } from "react-hook-form";
import { useLocaleContext } from "@/components/providers/LocaleProvider";
import {
  buildCounterpartySchemaFromMessages,
  buildQuickExpenseCategorySchema,
  buildQuickIncomeCategorySchema,
} from "@/lib/i18n/zod/inline-schemas";
import { localizedSeedCategoryName } from "@/lib/i18n/seed-category-labels";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AccountForm } from "@/components/accounts/AccountForm";
import { CategoryIconSelect } from "@/components/categories/CategoryIconSelect";
import {
  createExpenseCategorySchema,
  createIncomeCategorySchema,
} from "@/lib/schemas/category.schema";
import type { CreateTransactionInput } from "@/lib/schemas/transaction.schema";
import type { ExpenseCategoryWithChildren } from "@/types/category.types";

export type TransactionAccountField = "fromAccountId" | "toAccountId";

type ApiErr = { success: false; error: string; code: string };

function authHeaders(): HeadersInit {
  const token = typeof window !== "undefined" ? localStorage.getItem("pm_token") : null;
  return {
    "Content-Type": "application/json",
    Authorization: token ? `Bearer ${token}` : "",
  };
}

type QuickExpenseCategoryForm = {
  name: string;
  parentCategoryId?: string;
  icon: string;
};

type QuickIncomeCategoryForm = {
  name: string;
  icon: string;
};

type QuickCounterpartyForm = {
  name: string;
};

interface UseTransactionInlineCreateArgs {
  form: UseFormReturn<CreateTransactionInput>;
  expenseCategories: ExpenseCategoryWithChildren[];
}

/**
 * Inline create flows for account, category, and counterparty from the transaction form.
 * Invalidates React Query caches and selects the new entity in the form.
 */
export function useTransactionInlineCreate({
  form,
  expenseCategories,
}: UseTransactionInlineCreateArgs) {
  const queryClient = useQueryClient();
  const { messages, locale } = useLocaleContext();
  const ic = messages.inlineCreate;

  const quickExpenseCategoryFormSchema = useMemo(
    () => buildQuickExpenseCategorySchema(messages.validation.quick),
    [messages.validation.quick],
  );
  const quickIncomeCategoryFormSchema = useMemo(
    () => buildQuickIncomeCategorySchema(messages.validation.quick),
    [messages.validation.quick],
  );
  const quickCounterpartyFormSchema = useMemo(
    () => buildCounterpartySchemaFromMessages(messages.validation.counterparty),
    [messages.validation.counterparty],
  );

  const [accountOpen, setAccountOpen] = useState(false);
  const [accountKey, setAccountKey] = useState(0);
  const [pendingAccountField, setPendingAccountField] = useState<TransactionAccountField | null>(
    null,
  );
  const [accountSubmitError, setAccountSubmitError] = useState<string | null>(null);
  const [accountSaving, setAccountSaving] = useState(false);

  const [expenseCategoryOpen, setExpenseCategoryOpen] = useState(false);
  const [expenseCategorySubmitting, setExpenseCategorySubmitting] = useState(false);
  const [expenseCategoryError, setExpenseCategoryError] = useState<string | null>(null);

  const [incomeCategoryOpen, setIncomeCategoryOpen] = useState(false);
  const [incomeCategorySubmitting, setIncomeCategorySubmitting] = useState(false);
  const [incomeCategoryError, setIncomeCategoryError] = useState<string | null>(null);

  const [counterpartyOpen, setCounterpartyOpen] = useState(false);
  const [counterpartySubmitting, setCounterpartySubmitting] = useState(false);
  const [counterpartyError, setCounterpartyError] = useState<string | null>(null);

  const expenseCategoryForm = useForm<QuickExpenseCategoryForm>({
    resolver: zodResolver(quickExpenseCategoryFormSchema),
    defaultValues: { name: "", parentCategoryId: "__root__", icon: "tag" },
  });

  const incomeCategoryForm = useForm<QuickIncomeCategoryForm>({
    resolver: zodResolver(quickIncomeCategoryFormSchema),
    defaultValues: { name: "", icon: "tag" },
  });

  const counterpartyForm = useForm<QuickCounterpartyForm>({
    resolver: zodResolver(quickCounterpartyFormSchema),
    defaultValues: { name: "" },
  });

  function openCreateAccount(field: TransactionAccountField) {
    setPendingAccountField(field);
    setAccountSubmitError(null);
    setAccountKey((k) => k + 1);
    setAccountOpen(true);
  }

  function openCreateExpenseCategory() {
    setExpenseCategoryError(null);
    expenseCategoryForm.reset({ name: "", parentCategoryId: "__root__", icon: "tag" });
    setExpenseCategoryOpen(true);
  }

  function openCreateIncomeCategory() {
    setIncomeCategoryError(null);
    incomeCategoryForm.reset({ name: "", icon: "tag" });
    setIncomeCategoryOpen(true);
  }

  function openCreateCounterparty() {
    setCounterpartyError(null);
    counterpartyForm.reset({ name: "" });
    setCounterpartyOpen(true);
  }

  async function onExpenseCategorySubmit(values: QuickExpenseCategoryForm) {
    setExpenseCategorySubmitting(true);
    setExpenseCategoryError(null);
    try {
      const parentId =
        values.parentCategoryId && values.parentCategoryId !== "__root__"
          ? values.parentCategoryId.trim()
          : null;
      const body = createExpenseCategorySchema.parse({
        name: values.name,
        parentCategoryId: parentId,
        icon: values.icon,
      });
      const res = await fetch("/api/categories/expense", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(body),
      });
      const json = (await res.json()) as
        | { success: true; data: { category: { id: string } } }
        | ApiErr;
      if (!res.ok || json.success === false) {
        throw new Error(json.success === false ? json.error : ic.failedExpenseCat);
      }
      form.setValue("expenseCategoryId", json.data.category.id, { shouldValidate: true });
      await queryClient.invalidateQueries({ queryKey: ["categories", "expense"] });
      setExpenseCategoryOpen(false);
    } catch (e) {
      setExpenseCategoryError(e instanceof Error ? e.message : messages.common.somethingWrong);
    } finally {
      setExpenseCategorySubmitting(false);
    }
  }

  async function onIncomeCategorySubmit(values: QuickIncomeCategoryForm) {
    setIncomeCategorySubmitting(true);
    setIncomeCategoryError(null);
    try {
      const body = createIncomeCategorySchema.parse(values);
      const res = await fetch("/api/categories/income", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(body),
      });
      const json = (await res.json()) as
        | { success: true; data: { category: { id: string } } }
        | ApiErr;
      if (!res.ok || json.success === false) {
        throw new Error(json.success === false ? json.error : ic.failedIncomeCat);
      }
      form.setValue("incomeCategoryId", json.data.category.id, { shouldValidate: true });
      await queryClient.invalidateQueries({ queryKey: ["categories", "income"] });
      setIncomeCategoryOpen(false);
    } catch (e) {
      setIncomeCategoryError(e instanceof Error ? e.message : messages.common.somethingWrong);
    } finally {
      setIncomeCategorySubmitting(false);
    }
  }

  async function onCounterpartySubmit(values: QuickCounterpartyForm) {
    setCounterpartySubmitting(true);
    setCounterpartyError(null);
    try {
      const body = quickCounterpartyFormSchema.parse(values);
      const res = await fetch("/api/counterparties", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(body),
      });
      const json = (await res.json()) as
        | { success: true; data: { counterparty: { id: string } } }
        | ApiErr;
      if (!res.ok || json.success === false) {
        throw new Error(json.success === false ? json.error : ic.failedCounterparty);
      }
      form.setValue("counterpartyId", json.data.counterparty.id, { shouldValidate: true });
      await queryClient.invalidateQueries({ queryKey: ["counterparties"] });
      setCounterpartyOpen(false);
    } catch (e) {
      setCounterpartyError(e instanceof Error ? e.message : messages.common.somethingWrong);
    } finally {
      setCounterpartySubmitting(false);
    }
  }

  const dialogs = (
    <>
      <Dialog
        open={accountOpen}
        onOpenChange={(open) => {
          setAccountOpen(open);
          if (!open) {
            setPendingAccountField(null);
            setAccountSubmitError(null);
          }
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md" key={`account-${locale}`}>
          <DialogHeader>
            <DialogTitle>{ic.newAccountTitle}</DialogTitle>
            <DialogDescription>{ic.newAccountDesc}</DialogDescription>
          </DialogHeader>
          {accountSubmitError ? (
            <p className="text-sm text-destructive" role="alert">
              {accountSubmitError}
            </p>
          ) : null}
          <AccountForm
            key={accountKey}
            mode="create"
            submitLabel={ic.createAndUse}
            isLoading={accountSaving}
            onSubmit={async (data) => {
              setAccountSubmitError(null);
              setAccountSaving(true);
              try {
                const res = await fetch("/api/accounts", {
                  method: "POST",
                  headers: authHeaders(),
                  body: JSON.stringify(data),
                });
                const json = (await res.json()) as
                  | { success: true; data: { account: { id: string } } }
                  | ApiErr;
                if (!res.ok || json.success === false) {
                  throw new Error(json.success === false ? json.error : ic.failedAccount);
                }
                const field = pendingAccountField;
                if (field) {
                  form.setValue(field, json.data.account.id, { shouldValidate: true });
                }
                await queryClient.invalidateQueries({ queryKey: ["accounts"] });
                setAccountOpen(false);
                setPendingAccountField(null);
              } catch (e) {
                setAccountSubmitError(e instanceof Error ? e.message : messages.common.somethingWrong);
              } finally {
                setAccountSaving(false);
              }
            }}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={expenseCategoryOpen} onOpenChange={setExpenseCategoryOpen}>
        <DialogContent className="sm:max-w-md" key={`exp-cat-${locale}`}>
          <DialogHeader>
            <DialogTitle>{ic.expenseCatTitle}</DialogTitle>
            <DialogDescription>{ic.expenseCatLongDesc}</DialogDescription>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={expenseCategoryForm.handleSubmit(onExpenseCategorySubmit)}
          >
            <div className="space-y-2">
              <Label htmlFor="inline-expense-cat-name">{ic.categoryName}</Label>
              <Input
                id="inline-expense-cat-name"
                placeholder={ic.categoryNamePlaceholder}
                {...expenseCategoryForm.register("name")}
              />
              {expenseCategoryForm.formState.errors.name?.message ? (
                <p className="text-sm text-destructive">
                  {expenseCategoryForm.formState.errors.name.message}
                </p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="inline-expense-parent">{ic.parentOptional}</Label>
              <Controller
                control={expenseCategoryForm.control}
                name="parentCategoryId"
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value ?? "__root__"}>
                    <SelectTrigger id="inline-expense-parent">
                      <SelectValue placeholder={ic.topLevelPlaceholder} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__root__">{ic.rootCategory}</SelectItem>
                      {expenseCategories.map((parent) => (
                        <SelectItem key={parent.id} value={parent.id}>
                          {localizedSeedCategoryName(
                            parent.name,
                            parent.isDefault,
                            locale,
                            "expense",
                          )}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="inline-expense-icon">{ic.iconLabel}</Label>
              <Controller
                control={expenseCategoryForm.control}
                name="icon"
                render={({ field }) => (
                  <CategoryIconSelect
                    kind="expense"
                    value={field.value}
                    onChange={field.onChange}
                    placeholder={ic.iconPlaceholder}
                    triggerId="inline-expense-icon"
                  />
                )}
              />
            </div>
            {expenseCategoryError ? (
              <p className="text-sm text-destructive" role="alert">
                {expenseCategoryError}
              </p>
            ) : null}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setExpenseCategoryOpen(false)}>
                {messages.common.cancel}
              </Button>
              <Button type="submit" disabled={expenseCategorySubmitting}>
                {expenseCategorySubmitting ? ic.creating : ic.createAndUse}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={incomeCategoryOpen} onOpenChange={setIncomeCategoryOpen}>
        <DialogContent className="sm:max-w-md" key={`inc-cat-${locale}`}>
          <DialogHeader>
            <DialogTitle>{ic.incomeCatTitle}</DialogTitle>
            <DialogDescription>{ic.incomeCatLongDesc}</DialogDescription>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={incomeCategoryForm.handleSubmit(onIncomeCategorySubmit)}
          >
            <div className="space-y-2">
              <Label htmlFor="inline-income-cat-name">{ic.categoryName}</Label>
              <Input
                id="inline-income-cat-name"
                placeholder={ic.categoryNamePlaceholder}
                {...incomeCategoryForm.register("name")}
              />
              {incomeCategoryForm.formState.errors.name?.message ? (
                <p className="text-sm text-destructive">
                  {incomeCategoryForm.formState.errors.name.message}
                </p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="inline-income-icon">{ic.iconLabel}</Label>
              <Controller
                control={incomeCategoryForm.control}
                name="icon"
                render={({ field }) => (
                  <CategoryIconSelect
                    kind="income"
                    value={field.value}
                    onChange={field.onChange}
                    placeholder={ic.iconPlaceholder}
                    triggerId="inline-income-icon"
                  />
                )}
              />
            </div>
            {incomeCategoryError ? (
              <p className="text-sm text-destructive" role="alert">
                {incomeCategoryError}
              </p>
            ) : null}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIncomeCategoryOpen(false)}>
                {messages.common.cancel}
              </Button>
              <Button type="submit" disabled={incomeCategorySubmitting}>
                {incomeCategorySubmitting ? ic.creating : ic.createAndUse}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={counterpartyOpen} onOpenChange={setCounterpartyOpen}>
        <DialogContent className="sm:max-w-md" key={`cp-${locale}`}>
          <DialogHeader>
            <DialogTitle>{ic.counterpartyTitle}</DialogTitle>
            <DialogDescription>{ic.counterpartyLongDesc}</DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={counterpartyForm.handleSubmit(onCounterpartySubmit)}>
            <div className="space-y-2">
              <Label htmlFor="inline-cp-name">{ic.counterpartyName}</Label>
              <Input
                id="inline-cp-name"
                placeholder={ic.counterpartyNamePlaceholder}
                {...counterpartyForm.register("name")}
              />
              {counterpartyForm.formState.errors.name?.message ? (
                <p className="text-sm text-destructive">
                  {counterpartyForm.formState.errors.name.message}
                </p>
              ) : null}
            </div>
            {counterpartyError ? (
              <p className="text-sm text-destructive" role="alert">
                {counterpartyError}
              </p>
            ) : null}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCounterpartyOpen(false)}>
                {messages.common.cancel}
              </Button>
              <Button type="submit" disabled={counterpartySubmitting}>
                {counterpartySubmitting ? ic.creating : ic.createAndUse}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );

  return {
    openCreateAccount,
    openCreateExpenseCategory,
    openCreateIncomeCategory,
    openCreateCounterparty,
    dialogs,
  };
}
