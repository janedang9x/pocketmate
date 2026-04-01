import type { AppMessages } from "@/lib/i18n/catalog-en";
import type { Locale } from "@/lib/i18n/types";
import { localizedSeedCategoryName } from "@/lib/i18n/seed-category-labels";
import type { ExpenseCategory, ExpenseCategoryWithChildren, IncomeCategory } from "@/types/category.types";
import type {
  ExpenseReportCategoryRow,
  ExpenseReportSubcategory,
  IncomeReportCategoryRow,
} from "@/types/report.types";

const PARENT_GENERAL_SUFFIX_EN = " (general)";

function parseParentGeneralName(categoryName: string): string | null {
  if (!categoryName.endsWith(PARENT_GENERAL_SUFFIX_EN)) return null;
  return categoryName.slice(0, -PARENT_GENERAL_SUFFIX_EN.length);
}

export function formatExpenseCategoryBreadcrumb(
  parent: ExpenseCategoryWithChildren,
  child: ExpenseCategory | null,
  locale: Locale,
): string {
  const p = localizedSeedCategoryName(parent.name, parent.isDefault, locale, "expense");
  if (!child) return p;
  const c = localizedSeedCategoryName(child.name, child.user_id === null, locale, "expense");
  return `${p} › ${c}`;
}

export function incomeCategoryDisplayName(category: IncomeCategory, locale: Locale): string {
  const isSystem = category.user_id === null;
  return localizedSeedCategoryName(category.name, isSystem, locale, "income");
}

export function displayExpenseReportCategoryName(
  row: ExpenseReportCategoryRow,
  locale: Locale,
  messages: AppMessages,
): string {
  if (row.categoryName === "Unknown category") return messages.reports.unknownCategory;
  if (row.categoryName === "Uncategorized") return messages.reports.uncategorized;
  return localizedSeedCategoryName(
    row.categoryName,
    row.isSystemDefault ?? false,
    locale,
    "expense",
  );
}

export function displayExpenseReportSubcategoryName(
  sub: ExpenseReportSubcategory,
  locale: Locale,
  messages: AppMessages,
): string {
  if (sub.isParentGeneral) {
    const parentName = parseParentGeneralName(sub.categoryName);
    if (!parentName) return sub.categoryName;
    const base = localizedSeedCategoryName(
      parentName,
      sub.parentIsSystemDefault ?? false,
      locale,
      "expense",
    );
    return `${base}${messages.reports.categoryGeneralSuffix}`;
  }
  return localizedSeedCategoryName(
    sub.categoryName,
    sub.isSystemDefault ?? false,
    locale,
    "expense",
  );
}

export function displayIncomeReportCategoryName(
  row: IncomeReportCategoryRow,
  locale: Locale,
  messages: AppMessages,
): string {
  if (row.categoryName === "Unknown category") return messages.reports.unknownCategory;
  if (row.categoryName === "Uncategorized") return messages.reports.uncategorized;
  return localizedSeedCategoryName(
    row.categoryName,
    row.isSystemDefault ?? false,
    locale,
    "income",
  );
}
