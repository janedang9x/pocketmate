"use client";

import { Controller } from "react-hook-form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ExpenseCategory, ExpenseCategoryWithChildren, IncomeCategory } from "@/types/category.types";

interface CategorySelectorProps {
  control: any;
  name: string;
  categories: ExpenseCategoryWithChildren[] | IncomeCategory[];
  type: "expense" | "income";
  placeholder?: string;
}

/**
 * Hierarchical selector for expense categories (parent → child)
 * Flat selector for income categories
 * Used in transaction forms
 */
export function CategorySelector({
  control,
  name,
  categories,
  type,
  placeholder = "Select category",
}: CategorySelectorProps) {
  if (type === "expense") {
    const expenseCategories = categories as ExpenseCategoryWithChildren[];

    return (
      <Controller
        control={control}
        name={name}
        render={({ field }) => (
          <Select onValueChange={field.onChange} value={field.value}>
            <SelectTrigger>
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
              {expenseCategories.map((parent) => (
                <div key={parent.id}>
                  <SelectItem value={parent.id} className="font-semibold">
                    {parent.name}
                  </SelectItem>
                  {parent.children.map((child) => (
                    <SelectItem key={child.id} value={child.id} className="pl-6">
                      {child.name}
                    </SelectItem>
                  ))}
                </div>
              ))}
            </SelectContent>
          </Select>
        )}
      />
    );
  }

  // Income categories (flat structure)
  const incomeCategories = categories as IncomeCategory[];

  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <Select onValueChange={field.onChange} value={field.value}>
          <SelectTrigger>
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            {incomeCategories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    />
  );
}
