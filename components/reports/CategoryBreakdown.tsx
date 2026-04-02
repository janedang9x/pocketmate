"use client";

import type { ReactNode } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { PieChart } from "@/components/charts/PieChart";
import { chartColorAt } from "@/components/charts/chartColors";

export interface CategoryBreakdownItem {
  id: string;
  name: string;
  amount: number;
  percentage: number;
  transactionCount?: number;
}

export interface CategoryBreakdownProps {
  title?: string;
  description?: string;
  headerAction?: ReactNode;
  items: CategoryBreakdownItem[];
  /** Show pie chart when there is at least one row */
  showChart?: boolean;
  /** When false, only the chart is shown (no scrollable list) */
  showList?: boolean;
  className?: string;
  formatAmount?: (amount: number) => string;
  /** Max height for the scrollable list */
  listMaxHeight?: string;
}

/**
 * Category list with optional pie chart for expense/income reports.
 * Sprint 4.1 — Report Infrastructure
 */
export function CategoryBreakdown({
  title = "By category",
  description,
  headerAction,
  items,
  showChart = true,
  showList = true,
  className,
  formatAmount = (n) =>
    n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
  listMaxHeight = "min(320px, 50vh)",
}: CategoryBreakdownProps) {
  const pieData = items.map((item) => ({
    name: item.name,
    value: Math.abs(item.amount),
  }));

  const totalAmount = items.reduce((s, i) => s + Math.abs(i.amount), 0);

  return (
    <Card className={cn(className)}>
      <CardHeader className="flex flex-row items-start justify-between gap-3">
        <div className="space-y-1">
          <CardTitle className="text-lg">{title}</CardTitle>
          {description ? <CardDescription>{description}</CardDescription> : null}
        </div>
        {headerAction ? <div className="shrink-0">{headerAction}</div> : null}
      </CardHeader>
      <CardContent className="space-y-6">
        {showChart && items.length > 0 ? (
          <PieChart data={pieData} height={260} innerRadius={48} />
        ) : null}

        {showList ? (
          <div
            className="space-y-3 overflow-y-auto pr-1"
            style={{ maxHeight: listMaxHeight }}
          >
            {items.length === 0 ? (
              <p className="text-sm text-muted-foreground">No categories in range</p>
            ) : (
              items.map((item, index) => {
                const widthPct = totalAmount > 0 ? (Math.abs(item.amount) / totalAmount) * 100 : 0;
                return (
                  <div key={item.id} className="space-y-1">
                    <div className="flex items-baseline justify-between gap-2 text-sm">
                      <span className="truncate font-medium">{item.name}</span>
                      <span className="shrink-0 tabular-nums text-muted-foreground">
                        {formatAmount(item.amount)}
                        <span className="ml-2 text-xs">
                          ({item.percentage.toFixed(1)}%)
                        </span>
                      </span>
                    </div>
                    {item.transactionCount != null ? (
                      <p className="text-xs text-muted-foreground">
                        {item.transactionCount} transaction
                        {item.transactionCount === 1 ? "" : "s"}
                      </p>
                    ) : null}
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full transition-[width]"
                        style={{
                          width: `${Math.min(100, widthPct)}%`,
                          backgroundColor: chartColorAt(index),
                        }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
