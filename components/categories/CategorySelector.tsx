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
import { CategoryIcon } from "@/components/categories/CategoryIcon";
import { localizedSeedCategoryName } from "@/lib/i18n/seed-category-labels";
import type { Locale } from "@/lib/i18n/types";
import type { ExpenseCategoryWithChildren, IncomeCategory } from "@/types/category.types";

interface CategorySelectorProps<TFieldValues extends FieldValues> {
  control: Control<TFieldValues>;
  name: FieldPath<TFieldValues>;
  categories: ExpenseCategoryWithChildren[] | IncomeCategory[];
  type: "expense" | "income";
  placeholder?: string;
  /** Opens inline create flow (e.g. dialog) without leaving the transaction form. */
  onCreateNew?: () => void;
}

function buildExpenseItems(
  expenseCategories: ExpenseCategoryWithChildren[],
  locale: Locale,
): SearchableSelectItem[] {
  const out: SearchableSelectItem[] = [];
  for (const parent of expenseCategories) {
    const parentLabel = localizedSeedCategoryName(parent.name, parent.isDefault, locale, "expense");
    out.push({
      value: parent.id,
      label: (
        <span className="flex items-center gap-2 font-semibold">
          <CategoryIcon icon={parent.icon} name={parent.name} kind="expense" />
          {parentLabel}
        </span>
      ),
      searchText: `${parent.name} ${parentLabel}`,
    });
    for (const child of parent.children) {
      const childLabel = localizedSeedCategoryName(
        child.name,
        child.user_id === null,
        locale,
        "expense",
      );
      out.push({
        value: child.id,
        label: (
          <span className="flex items-center gap-2 pl-6">
            <CategoryIcon icon={child.icon} name={child.name} kind="expense" />
            {childLabel}
          </span>
        ),
        searchText: `${parent.name} ${child.name} ${parentLabel} ${childLabel}`,
      });
    }
  }
  return out;
}

/**
 * Hierarchical selector for expense categories (parent → child)
 * Flat selector for income categories
 * Used in transaction forms
 */
export function CategorySelector<TFieldValues extends FieldValues>({
  control,
  name,
  categories,
  type,
  placeholder = "Select category",
  onCreateNew,
}: CategorySelectorProps<TFieldValues>) {
  const { messages: m, locale } = useLocaleContext();
  const tf = m.transactionForm;

  const items: SearchableSelectItem[] = useMemo(() => {
    if (type === "expense") {
      return buildExpenseItems(categories as ExpenseCategoryWithChildren[], locale);
    }
    return (categories as IncomeCategory[]).map((category) => {
      const label = localizedSeedCategoryName(
        category.name,
        category.user_id === null,
        locale,
        "income",
      );
      return {
        value: category.id,
        label: (
          <span className="flex items-center gap-2">
            <CategoryIcon icon={category.icon} name={category.name} kind="income" />
            {label}
          </span>
        ),
        searchText: `${category.name} ${label}`,
      };
    });
  }, [categories, type, locale]);

  const searchPlaceholder =
    type === "expense" ? tf.searchExpenseCategories : tf.searchIncomeCategories;

  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <SearchableSelect
          value={field.value}
          onChange={field.onChange}
          items={items}
          placeholder={placeholder}
          searchPlaceholder={searchPlaceholder}
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
                    {tf.createNewCategory}
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
