"use client";

import { Badge } from "@/components/ui/badge";
import { useLocaleContext } from "@/components/providers/LocaleProvider";
import { localizedSeedCategoryName } from "@/lib/i18n/seed-category-labels";
import { CategoryIcon } from "@/components/categories/CategoryIcon";
import type { ExpenseCategory, IncomeCategory } from "@/types/category.types";

interface CategoryBadgeProps {
  category: ExpenseCategory | IncomeCategory;
  isDefault?: boolean;
  variant?: "default" | "secondary" | "outline";
  /** Use "expense" or "income" for seed label lookup when `isDefault` is true. */
  kind?: "expense" | "income";
}

/**
 * Badge component for displaying category names
 * Implements FR-CAT-001: View Default Categories
 */
export function CategoryBadge({
  category,
  isDefault = false,
  variant = "default",
  kind = "expense",
}: CategoryBadgeProps) {
  const { messages: m, locale } = useLocaleContext();
  const displayName = localizedSeedCategoryName(category.name, isDefault, locale, kind);

  return (
    <Badge variant={variant} className={isDefault ? "opacity-75" : ""}>
      <CategoryIcon icon={category.icon} name={category.name} kind={kind} className="mr-1 h-3.5 w-3.5" />
      {displayName}
      {isDefault && (
        <span className="ml-1 text-xs">{m.settings.categories.defaultBadge}</span>
      )}
    </Badge>
  );
}
