"use client";

import { useMemo, useState } from "react";
import { ChevronDown, Tags } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useLocaleContext } from "@/components/providers/LocaleProvider";
import { localizedSeedCategoryName } from "@/lib/i18n/seed-category-labels";
import type { Locale } from "@/lib/i18n/types";
import { cn } from "@/lib/utils";
import type { IncomeCategory } from "@/types/category.types";

type IncomeCategoryWithFlags = IncomeCategory & { isDefault?: boolean };

export interface IncomeCategoryFilterDropdownProps {
  categories: IncomeCategoryWithFlags[];
  selectedIds: Set<string>;
  onSelectionChange: (next: Set<string>) => void;
  disabled?: boolean;
  className?: string;
}

function summarizeSelection(
  categories: IncomeCategoryWithFlags[],
  selected: Set<string>,
  locale: Locale,
  allLabel: string,
  selectedCountLabel: string,
): string {
  if (selected.size === 0) return allLabel;

  const names = categories
    .filter((c) => selected.has(c.id))
    .map((c) =>
      localizedSeedCategoryName(
        c.name,
        c.isDefault ?? c.user_id === null,
        locale,
        "income",
      ),
    );

  if (names.length === 0) return selectedCountLabel.replace("{n}", String(selected.size));
  if (names.length <= 2) return names.join(", ");
  return `${names.slice(0, 2).join(", ")} +${names.length - 2}`;
}

/**
 * Compact multi-select income category filter dropdown (FR-RPT-002).
 */
export function IncomeCategoryFilterDropdown({
  categories,
  selectedIds,
  onSelectionChange,
  disabled,
  className,
}: IncomeCategoryFilterDropdownProps) {
  const [open, setOpen] = useState(false);
  const { messages: m, locale } = useLocaleContext();
  const r = m.reports;

  const summary = useMemo(
    () =>
      summarizeSelection(
        categories,
        selectedIds,
        locale,
        r.filterAllCategoriesSummary,
        r.filterSelectedCount,
      ),
    [categories, selectedIds, locale, r.filterAllCategoriesSummary, r.filterSelectedCount],
  );

  function clearAll() {
    onSelectionChange(new Set());
  }

  function toggle(categoryId: string) {
    const next = new Set(selectedIds);
    if (next.has(categoryId)) next.delete(categoryId);
    else next.add(categoryId);
    onSelectionChange(next);
  }

  return (
    <div className={cn("space-y-2", className)}>
      <Label className="text-xs text-muted-foreground">{r.filterCategoriesLabel}</Label>
      <p className="text-xs text-muted-foreground">{r.filterIncomeHint}</p>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className="h-10 w-full justify-between font-normal sm:max-w-md"
            disabled={disabled}
            aria-expanded={open}
            aria-haspopup="dialog"
          >
            <span className="flex min-w-0 items-center gap-2">
              <Tags className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
              <span className="truncate text-left">{summary}</span>
            </span>
            <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-[min(100vw-2rem,22rem)] max-w-[22rem] p-0 sm:w-80"
          align="start"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <div className="flex items-center justify-between border-b px-3 py-2">
            <span className="text-xs font-medium text-muted-foreground">
              {r.filterIncomeListTitle}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={clearAll}
              disabled={selectedIds.size === 0}
            >
              {r.filterClear}
            </Button>
          </div>
          <div className="max-h-[min(320px,50vh)] overflow-y-auto p-2">
            {categories.length === 0 ? (
              <p className="px-2 py-4 text-center text-sm text-muted-foreground">
                {r.filterNoCategories}
              </p>
            ) : (
              <ul className="space-y-1" role="group" aria-label={r.filterIncomeListTitle}>
                {categories.map((cat) => (
                  <li key={cat.id}>
                    <div className="flex items-start gap-2 rounded-sm px-2 py-1.5 hover:bg-muted/60">
                      <Checkbox
                        id={`inc-cat-${cat.id}`}
                        checked={selectedIds.has(cat.id)}
                        onCheckedChange={() => toggle(cat.id)}
                        className="mt-0.5"
                        disabled={disabled}
                      />
                      <label
                        htmlFor={`inc-cat-${cat.id}`}
                        className="cursor-pointer text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {localizedSeedCategoryName(
                          cat.name,
                          cat.isDefault ?? cat.user_id === null,
                          locale,
                          "income",
                        )}
                      </label>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
