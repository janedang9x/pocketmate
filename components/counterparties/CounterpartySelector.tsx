"use client";

import { Controller } from "react-hook-form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Counterparty } from "@/types/counterparty.types";

interface CounterpartySelectorProps {
  control: any;
  name: string;
  counterparties: Counterparty[];
  placeholder?: string;
  allowNone?: boolean;
}

/**
 * Selector for counterparties in transaction forms.
 * Used for expense, income, and borrow transactions.
 * Implements FR-CPT-002: List Counterparties
 */
export function CounterpartySelector({
  control,
  name,
  counterparties,
  placeholder = "Select counterparty",
  allowNone = true,
}: CounterpartySelectorProps) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <Select
          onValueChange={(value) => field.onChange(value === "__none__" ? null : value)}
          value={field.value || (allowNone ? "__none__" : undefined)}
        >
          <SelectTrigger>
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            {allowNone && (
              <SelectItem value="__none__">None</SelectItem>
            )}
            {counterparties.map((counterparty) => (
              <SelectItem key={counterparty.id} value={counterparty.id}>
                {counterparty.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    />
  );
}
