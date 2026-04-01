"use client";

import { useMemo } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SearchableSelect, type SearchableSelectItem } from "@/components/ui/searchable-select";
import { SelectSeparator } from "@/components/ui/select";
import { useLocaleContext } from "@/components/providers/LocaleProvider";
import type { AccountWithBalance } from "@/types/account.types";
import type { Currency } from "@/types/account.types";
import { getCurrencyLabel } from "@/lib/utils/account.utils";

interface AccountSelectProps {
  id: string;
  value: string | undefined;
  onChange: (value: string) => void;
  accounts: AccountWithBalance[];
  placeholder?: string;
  /** When true, show currency code next to account name (e.g. transfers). */
  showCurrencyLabel?: boolean;
  mobileTitle?: string;
  onRequestCreate: () => void;
}

/**
 * Account picker for transaction forms with an inline entry to create a new account.
 */
export function AccountSelect({
  id,
  value,
  onChange,
  accounts,
  placeholder,
  showCurrencyLabel = false,
  mobileTitle,
  onRequestCreate,
}: AccountSelectProps) {
  const { messages: m } = useLocaleContext();
  const tf = m.transactionForm;
  const ph = placeholder ?? tf.phAccount;

  const items: SearchableSelectItem[] = useMemo(
    () =>
      accounts.map((account) => {
        const labelText = showCurrencyLabel
          ? `${account.name} (${getCurrencyLabel(account.currency as Currency)})`
          : account.name;
        return {
          value: account.id,
          label: labelText,
          searchText: `${account.name} ${getCurrencyLabel(account.currency as Currency)}`,
        };
      }),
    [accounts, showCurrencyLabel],
  );

  return (
    <SearchableSelect
      id={id}
      value={value}
      onChange={onChange}
      items={items}
      placeholder={ph}
      searchPlaceholder={tf.searchAccounts}
      mobileFullScreen
      mobileMaxWidth={1023}
      mobileTitle={mobileTitle ?? tf.phAccount}
      header={
        <>
          <div
            className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none"
            onPointerDown={(e) => e.preventDefault()}
          >
            <Button
              type="button"
              variant="ghost"
              className="h-8 w-full justify-start gap-2 px-2 font-normal text-primary"
              onClick={onRequestCreate}
            >
              <Plus className="h-4 w-4 shrink-0" aria-hidden />
              {tf.createAccount}
            </Button>
          </div>
          <SelectSeparator className="mt-0" />
        </>
      }
    />
  );
}
