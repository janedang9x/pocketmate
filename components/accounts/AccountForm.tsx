"use client";

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
import {
  createAccountSchema,
  type CreateAccountInput,
} from "@/lib/schemas/account.schema";
import { ACCOUNT_TYPES, CURRENCIES } from "@/types/account.types";

interface AccountFormProps {
  onSubmit: (data: CreateAccountInput) => Promise<void>;
  defaultValues?: Partial<CreateAccountInput>;
  isLoading?: boolean;
}

/**
 * Form component for creating/editing financial accounts
 * Implements FR-ACC-001: Create Financial Account
 */
export function AccountForm({
  onSubmit,
  defaultValues,
  isLoading = false,
}: AccountFormProps) {
  const form = useForm<CreateAccountInput>({
    resolver: zodResolver(createAccountSchema),
    defaultValues: {
      name: defaultValues?.name || "",
      type: defaultValues?.type || "Bank Account",
      currency: defaultValues?.currency || "VND",
      openingBalance: defaultValues?.openingBalance || 0,
    },
    mode: "onTouched",
  });

  async function handleSubmit(values: CreateAccountInput) {
    await onSubmit(values);
  }

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Account Name</Label>
        <Input
          id="name"
          placeholder="e.g. Main Checking Account"
          {...form.register("name")}
        />
        {form.formState.errors.name?.message ? (
          <p className="text-sm text-destructive">
            {form.formState.errors.name.message}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="type">Account Type</Label>
        <Controller
          control={form.control}
          name="type"
          render={({ field }) => (
            <Select onValueChange={field.onChange} value={field.value}>
              <SelectTrigger id="type">
                <SelectValue placeholder="Select account type" />
              </SelectTrigger>
              <SelectContent>
                {ACCOUNT_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {form.formState.errors.type?.message ? (
          <p className="text-sm text-destructive">
            {form.formState.errors.type.message}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="currency">Currency</Label>
        <Controller
          control={form.control}
          name="currency"
          render={({ field }) => (
            <Select onValueChange={field.onChange} value={field.value}>
              <SelectTrigger id="currency">
                <SelectValue placeholder="Select currency" />
              </SelectTrigger>
              <SelectContent>
                {CURRENCIES.map((currency) => (
                  <SelectItem key={currency} value={currency}>
                    {currency}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {form.formState.errors.currency?.message ? (
          <p className="text-sm text-destructive">
            {form.formState.errors.currency.message}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="openingBalance">Opening Balance</Label>
        <Input
          id="openingBalance"
          type="number"
          step="0.01"
          placeholder="0.00"
          {...form.register("openingBalance", { valueAsNumber: true })}
        />
        {form.formState.errors.openingBalance?.message ? (
          <p className="text-sm text-destructive">
            {form.formState.errors.openingBalance.message}
          </p>
        ) : null}
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Saving..." : "Create Account"}
      </Button>
    </form>
  );
}
