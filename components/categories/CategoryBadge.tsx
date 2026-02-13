import { Badge } from "@/components/ui/badge";
import type { ExpenseCategory, IncomeCategory } from "@/types/category.types";

interface CategoryBadgeProps {
  category: ExpenseCategory | IncomeCategory;
  isDefault?: boolean;
  variant?: "default" | "secondary" | "outline";
}

/**
 * Badge component for displaying category names
 * Implements FR-CAT-001: View Default Categories
 */
export function CategoryBadge({ category, isDefault = false, variant = "default" }: CategoryBadgeProps) {
  return (
    <Badge variant={variant} className={isDefault ? "opacity-75" : ""}>
      {category.name}
      {isDefault && <span className="ml-1 text-xs">(default)</span>}
    </Badge>
  );
}
