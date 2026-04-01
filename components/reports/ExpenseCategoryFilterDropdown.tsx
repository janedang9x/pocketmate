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
import type { ExpenseCategoryWithChildren } from "@/types/category.types";

export interface ExpenseCategoryFilterDropdownProps {
  categories: ExpenseCategoryWithChildren[];
  selectedIds: Set<string>;
  onSelectionChange: (next: Set<string>) => void;
  disabled?: boolean;
  className?: string;
}

function toggleParentSelection(
  parent: ExpenseCategoryWithChildren,
  selected: Set<string>,
): Set<string> {
  const next = new Set(selected);
  const children = parent.children ?? [];
  const childIds = children.map((c) => c.id);

  if (childIds.length === 0) {
    if (next.has(parent.id)) next.delete(parent.id);
    else next.add(parent.id);
    return next;
  }

  const parentFullyCovered =
    next.has(parent.id) || childIds.every((id) => next.has(id));

  if (parentFullyCovered) {
    next.delete(parent.id);
    for (const id of childIds) next.delete(id);
  } else {
    next.add(parent.id);
    for (const id of childIds) next.delete(id);
  }
  return next;
}

function toggleChildSelection(
  parent: ExpenseCategoryWithChildren,
  childId: string,
  selected: Set<string>,
): Set<string> {
  const next = new Set(selected);
  const childIds = (parent.children ?? []).map((c) => c.id);

  if (next.has(parent.id)) {
    next.delete(parent.id);
    for (const id of childIds) {
      if (id !== childId) next.add(id);
    }
    return next;
  }

  if (next.has(childId)) next.delete(childId);
  else next.add(childId);
  return next;
}

function parentCheckboxState(
  parent: ExpenseCategoryWithChildren,
  selected: Set<string>,
): boolean | "indeterminate" {
  const childIds = (parent.children ?? []).map((c) => c.id);
  if (childIds.length === 0) {
    return selected.has(parent.id);
  }
  if (selected.has(parent.id)) return true;
  const selectedCount = childIds.filter((id) => selected.has(id)).length;
  if (selectedCount === 0) return false;
  if (selectedCount === childIds.length) return true;
  return "indeterminate";
}

function childCheckboxChecked(
  parent: ExpenseCategoryWithChildren,
  childId: string,
  selected: Set<string>,
): boolean {
  if (selected.has(parent.id)) return true;
  return selected.has(childId);
}

function summarizeSelection(
  categories: ExpenseCategoryWithChildren[],
  selected: Set<string>,
  locale: Locale,
  allLabel: string,
  selectedCountLabel: string,
): string {
  if (selected.size === 0) return allLabel;

  const names: string[] = [];
  for (const p of categories) {
    const pLabel = localizedSeedCategoryName(p.name, p.isDefault, locale, "expense");
    if (selected.has(p.id)) {
      names.push(pLabel);
      continue;
    }
    for (const c of p.children ?? []) {
      if (selected.has(c.id)) {
        const cLabel = localizedSeedCategoryName(c.name, c.user_id === null, locale, "expense");
        names.push(`${pLabel}: ${cLabel}`);
      }
    }
  }

  if (names.length === 0) return selectedCountLabel.replace("{n}", String(selected.size));
  if (names.length <= 2) return names.join(", ");
  return `${names.slice(0, 2).join(", ")} +${names.length - 2}`;
}

/**
 * Compact hierarchical expense category filter: parent row selects the whole group (API uses parent id);
 * children shown indented; indeterminate when partially selected.
 */
export function ExpenseCategoryFilterDropdown({
  categories,
  selectedIds,
  onSelectionChange,
  disabled,
  className,
}: ExpenseCategoryFilterDropdownProps) {
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

  return (
    <div className={cn("space-y-2", className)}>
      <Label className="text-xs text-muted-foreground">{r.filterCategoriesLabel}</Label>
      <p className="text-xs text-muted-foreground">{r.filterExpenseHint}</p>
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
            <ChevronDown className="h-4 w-4 shrink-0 opacity-50" aria-hidden />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-[min(100vw-2rem,22rem)] max-w-[22rem] p-0 sm:w-80"
          align="start"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <div className="flex items-center justify-between border-b px-3 py-2">
            <span className="text-xs font-medium text-muted-foreground">
              {r.filterExpenseListTitle}
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
              <ul className="space-y-1" role="group" aria-label={r.filterExpenseListTitle}>
                {categories.map((parent) => {
                  const pState = parentCheckboxState(parent, selectedIds);
                  const children = parent.children ?? [];
                  const parentLabel = localizedSeedCategoryName(
                    parent.name,
                    parent.isDefault,
                    locale,
                    "expense",
                  );

                  return (
                    <li key={parent.id} className="rounded-md">
                      <div className="flex items-start gap-2 rounded-sm px-2 py-1.5 hover:bg-muted/60">
                        <Checkbox
                          id={`exp-cat-parent-${parent.id}`}
                          checked={
                            pState === "indeterminate" ? "indeterminate" : pState
                          }
                          onCheckedChange={() =>
                            onSelectionChange(toggleParentSelection(parent, selectedIds))
                          }
                          className="mt-0.5"
                          disabled={disabled}
                        />
                        <label
                          htmlFor={`exp-cat-parent-${parent.id}`}
                          className="cursor-pointer text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {parentLabel}
                        </label>
                      </div>
                      {children.length > 0 ? (
                        <ul className="ml-2 border-l border-border pl-3" role="group">
                          {children.map((child) => (
                            <li key={child.id}>
                              <div className="flex items-start gap-2 rounded-sm px-2 py-1 hover:bg-muted/60">
                                <Checkbox
                                  id={`exp-cat-child-${child.id}`}
                                  checked={childCheckboxChecked(parent, child.id, selectedIds)}
                                  onCheckedChange={() =>
                                    onSelectionChange(
                                      toggleChildSelection(parent, child.id, selectedIds),
                                    )
                                  }
                                  className="mt-0.5"
                                  disabled={disabled}
                                />
                                <label
                                  htmlFor={`exp-cat-child-${child.id}`}
                                  className="cursor-pointer text-sm text-muted-foreground leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                  {localizedSeedCategoryName(
                                    child.name,
                                    child.user_id === null,
                                    locale,
                                    "expense",
                                  )}
                                </label>
                              </div>
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
