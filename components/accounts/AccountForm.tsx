"use client";

import { useMemo } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { buildCreateAccountSchema, buildUpdateAccountSchema } from "@/lib/i18n/zod/account-schemas";
import { accountTypeLabel } from "@/lib/i18n/labels";
import { useLocaleContext } from "@/components/providers/LocaleProvider";
import type { CreateAccountInput, UpdateAccountInput } from "@/lib/schemas/account.schema";
import { ACCOUNT_TYPES, CURRENCIES } from "@/types/account.types";
import { getCurrencyLabel } from "@/lib/utils/account.utils";

type AccountFormValues = CreateAccountInput | UpdateAccountInput;

interface AccountFormProps {
  onSubmit: (data: CreateAccountInput | UpdateAccountInput) => Promise<void>;
  defaultValues?: Partial<CreateAccountInput> | Partial<UpdateAccountInput>;
  isLoading?: boolean;
  /** "create" = full form; "edit" = name and type only (FR-ACC-003) */
  mode?: "create" | "edit";
  submitLabel?: string;
}

/**
 * Form component for creating/editing financial accounts
 * Implements FR-ACC-001: Create Financial Account, FR-ACC-003: Edit Financial Account
 */
export function AccountForm({
  onSubmit,
  defaultValues,
  isLoading = false,
  mode = "create",
  submitLabel,
}: AccountFormProps) {
  const { messages: m } = useLocaleContext();
  const a = m.accounts;
  const isEdit = mode === "edit";

  const createSchema = useMemo(
    () => buildCreateAccountSchema(m.validation.account),
    [m.validation.account],
  );
  const updateSchema = useMemo(
    () => buildUpdateAccountSchema(m.validation.account),
    [m.validation.account],
  );

  const form = useForm<AccountFormValues>({
    resolver: zodResolver(isEdit ? updateSchema : createSchema),
    defaultValues: isEdit
      ? {
          name: (defaultValues as Partial<UpdateAccountInput>)?.name ?? "",
          type: (defaultValues as Partial<UpdateAccountInput>)?.type ?? "Bank Account",
        }
      : {
          name: (defaultValues as Partial<CreateAccountInput>)?.name ?? "",
          type: (defaultValues as Partial<CreateAccountInput>)?.type ?? "Bank Account",
          currency: (defaultValues as Partial<CreateAccountInput>)?.currency ?? "VND",
          openingBalance: (defaultValues as Partial<CreateAccountInput>)?.openingBalance ?? 0,
        },
    mode: "onTouched",
  });

  async function handleSubmit(values: AccountFormValues) {
    await onSubmit(values as CreateAccountInput & UpdateAccountInput);
  }

  const buttonText =
    submitLabel ?? (isEdit ? a.saveChanges : a.createAccount);

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">{a.accountName}</Label>
        <Input id="name" placeholder={a.placeholders.name} {...form.register("name")} />
        {form.formState.errors.name?.message ? (
          <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="type">{a.accountType}</Label>
        <Controller
          control={form.control}
          name="type"
          render={({ field }) => (
            <Select onValueChange={field.onChange} value={field.value}>
              <SelectTrigger id="type">
                <SelectValue placeholder={a.placeholders.selectType} />
              </SelectTrigger>
              <SelectContent>
                {ACCOUNT_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {accountTypeLabel(type, m.accountTypes)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {form.formState.errors.type?.message ? (
          <p className="text-sm text-destructive">{form.formState.errors.type.message}</p>
        ) : null}
      </div>

      {!isEdit && (
        <>
          <div className="space-y-2">
            <Label htmlFor="currency">{a.currency}</Label>
            <Controller
              control={form.control}
              name="currency"
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger id="currency">
                    <SelectValue placeholder={a.placeholders.selectCurrency} />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map((currency) => (
                      <SelectItem key={currency} value={currency}>
                        {getCurrencyLabel(currency)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {(form.formState.errors as { currency?: { message?: string } }).currency?.message ? (
              <p className="text-sm text-destructive">
                {(form.formState.errors as { currency?: { message?: string } }).currency?.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="openingBalance">{a.openingBalance}</Label>
            <Input
              id="openingBalance"
              type="number"
              step="0.01"
              placeholder={a.placeholders.opening}
              {...form.register("openingBalance", { valueAsNumber: true })}
            />
            {(form.formState.errors as { openingBalance?: { message?: string } }).openingBalance
              ?.message ? (
              <p className="text-sm text-destructive">
                {
                  (form.formState.errors as { openingBalance?: { message?: string } })
                    .openingBalance?.message
                }
              </p>
            ) : null}
          </div>
        </>
      )}

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? m.common.saving : buttonText}
      </Button>
    </form>
  );
}
