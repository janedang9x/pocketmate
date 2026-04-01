"use client";

import { useMemo } from "react";
import { Plus } from "lucide-react";
import {
  Controller,
  type Control,
  type FieldPath,
  type FieldValues,
} from "react-hook-form";
import { Button } from "@/components/ui/button";
import { SearchableSelect, type SearchableSelectItem } from "@/components/ui/searchable-select";
import { SelectSeparator } from "@/components/ui/select";
import { useLocaleContext } from "@/components/providers/LocaleProvider";
import type { Counterparty } from "@/types/counterparty.types";

interface CounterpartySelectorProps<TFieldValues extends FieldValues> {
  control: Control<TFieldValues>;
  name: FieldPath<TFieldValues>;
  counterparties: Counterparty[];
  placeholder?: string;
  allowNone?: boolean;
  /**
   * Opens inline create flow (e.g. dialog) without leaving the transaction form.
   * When `allowNone` is true, the counterparty field is optional; the new
   * counterparty is still selected after creation.
   */
  onCreateNew?: () => void;
}

/**
 * Selector for counterparties in transaction forms.
 * Used for expense, income, and borrow transactions.
 * Implements FR-CPT-002: List Counterparties
 */
export function CounterpartySelector<TFieldValues extends FieldValues>({
  control,
  name,
  counterparties,
  placeholder = "Select counterparty",
  allowNone = true,
  onCreateNew,
}: CounterpartySelectorProps<TFieldValues>) {
  const { messages: m } = useLocaleContext();
  const tf = m.transactionForm;

  const items: SearchableSelectItem[] = useMemo(() => {
    const base: SearchableSelectItem[] = allowNone
      ? [{ value: "__none__", label: "None", searchText: "none" }]
      : [];
    return [
      ...base,
      ...counterparties.map((c) => ({
        value: c.id,
        label: c.name,
        searchText: c.name,
      })),
    ];
  }, [allowNone, counterparties]);

  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <SearchableSelect
          value={field.value ?? (allowNone ? "__none__" : undefined)}
          onChange={(v) => field.onChange(v === "__none__" ? null : v)}
          items={items}
          placeholder={placeholder}
          searchPlaceholder={`${tf.counterparty}...`}
          mobileFullScreen
          mobileMaxWidth={1023}
          mobileTitle={tf.counterparty}
          header={
            onCreateNew ? (
              <>
                <div
                  className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none"
                  onPointerDown={(e) => e.preventDefault()}
                >
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-8 w-full justify-start gap-2 px-2 font-normal text-primary"
                    onClick={onCreateNew}
                  >
                    <Plus className="h-4 w-4 shrink-0" aria-hidden />
                    Create new counterparty
                  </Button>
                </div>
                <SelectSeparator className="mt-0" />
              </>
            ) : undefined
          }
        />
      )}
    />
  );
}
