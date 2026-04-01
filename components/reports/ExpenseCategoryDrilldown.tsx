"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight, ExternalLink } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { chartColorAt } from "@/components/charts/chartColors";
import { useLocaleContext } from "@/components/providers/LocaleProvider";
import {
  displayExpenseReportCategoryName,
  displayExpenseReportSubcategoryName,
} from "@/lib/i18n/category-display-name";
import type { ExpenseReportCategoryRow } from "@/types/report.types";

const UNCATEGORIZED_ID = "__uncategorized__";

export interface ExpenseCategoryDrilldownProps {
  categories: ExpenseReportCategoryRow[];
  buildTransactionHref: (categoryId: string) => string;
  formatAmount: (amount: number) => string;
  className?: string;
}

/**
 * Parent expense categories with expand/collapse for child categories and links to filtered transactions.
 * FR-RPT-001
 */
export function ExpenseCategoryDrilldown({
  categories,
  buildTransactionHref,
  formatAmount,
  className,
}: ExpenseCategoryDrilldownProps) {
  const { messages: m, locale } = useLocaleContext();
  const r = m.reports;
  const [openId, setOpenId] = useState<string | null>(null);

  function txnLabel(count: number) {
    return `${count} ${count === 1 ? m.common.transaction : m.common.transactions}`;
  }

  return (
    <Card className={cn(className)}>
      <CardHeader>
        <CardTitle className="text-lg">{r.byCategoryTitle}</CardTitle>
        <CardDescription>{r.byCategoryDesc}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {categories.length === 0 ? (
          <p className="text-sm text-muted-foreground">{r.noCategoriesInRange}</p>
        ) : (
          categories.map((row, index) => {
            const hasChildren = row.subcategories.length > 0;
            const isOpen = openId === row.categoryId;
            /** Parent+children: use subcategory links; leaf parent or uncategorized handled below */
            const showParentTxLink =
              row.categoryId !== UNCATEGORIZED_ID && !hasChildren;

            return (
              <div
                key={row.categoryId}
                className="rounded-lg border bg-card/50 px-3 py-2"
              >
                <div className="flex items-start gap-2">
                  {hasChildren ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="mt-0.5 h-8 w-8 shrink-0"
                      aria-expanded={isOpen}
                      onClick={() => setOpenId(isOpen ? null : row.categoryId)}
                    >
                      {isOpen ? (
                        <ChevronDown className="h-4 w-4" aria-hidden />
                      ) : (
                        <ChevronRight className="h-4 w-4" aria-hidden />
                      )}
                    </Button>
                  ) : (
                    <span className="mt-0.5 inline-flex h-8 w-8 shrink-0" aria-hidden />
                  )}
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <span className="font-medium">
                        {displayExpenseReportCategoryName(row, locale, m)}
                      </span>
                      <span className="shrink-0 tabular-nums text-sm text-muted-foreground">
                        {formatAmount(row.amount)}
                        <span className="ml-2 text-xs">({row.percentage.toFixed(1)}%)</span>
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">{txnLabel(row.transactionCount)}</p>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.min(100, row.percentage)}%`,
                          backgroundColor: chartColorAt(index),
                        }}
                      />
                    </div>
                    {showParentTxLink ? (
                      <Link
                        href={buildTransactionHref(row.categoryId)}
                        className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                      >
                        <ExternalLink className="h-3 w-3" aria-hidden />
                        {r.viewTransactions}
                      </Link>
                    ) : null}
                  </div>
                </div>

                {hasChildren && isOpen ? (
                  <ul className="ml-10 mt-3 space-y-2 border-l pl-3">
                    {row.subcategories.map((sub) => (
                      <li key={sub.categoryId} className="text-sm">
                        <div className="flex flex-wrap items-baseline justify-between gap-2">
                          <span className="text-foreground">
                            {displayExpenseReportSubcategoryName(sub, locale, m)}
                          </span>
                          <span className="tabular-nums text-muted-foreground">
                            {formatAmount(sub.amount)}
                            <span className="ml-2 text-xs">
                              ({sub.percentage.toFixed(1)}% {r.percentOfParent})
                            </span>
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">{txnLabel(sub.transactionCount)}</p>
                        <Link
                          href={buildTransactionHref(sub.categoryId)}
                          className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                        >
                          <ExternalLink className="h-3 w-3" aria-hidden />
                          {r.viewTransactions}
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
