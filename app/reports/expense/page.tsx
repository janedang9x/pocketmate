"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import {
  endOfMonth,
  format,
  startOfMonth,
  startOfYear,
  endOfYear,
} from "date-fns";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  CategoryBreakdown,
  DateRangePicker,
  ExpenseCategoryDrilldown,
  ExpenseCategoryFilterDropdown,
  FilterPanel,
  OvertimeChart,
  ReportSummaryCard,
} from "@/components/reports";
import type { ExpenseCategoryWithChildren } from "@/types/category.types";
import type { ExpenseReportData } from "@/types/report.types";
import type { ReportGroupBy } from "@/lib/utils/report.utils";

type ExpenseReportResponse =
  | { success: true; data: ExpenseReportData }
  | { success: false; error: string; code: string };

type ExpenseCategoriesResponse =
  | { success: true; data: { categories: ExpenseCategoryWithChildren[] } }
  | { success: false; error: string; code: string };

function defaultRange(): { start: string; end: string } {
  const now = new Date();
  return {
    start: format(startOfMonth(now), "yyyy-MM-dd"),
    end: format(endOfMonth(now), "yyyy-MM-dd"),
  };
}

/**
 * Expense report dashboard (FR-RPT-001).
 */
export default function ExpenseReportPage() {
  const initial = useMemo(() => defaultRange(), []);
  const [startDate, setStartDate] = useState(initial.start);
  const [endDate, setEndDate] = useState(initial.end);
  const [groupBy, setGroupBy] = useState<ReportGroupBy>("month");
  const [chartVariant, setChartVariant] = useState<"line" | "bar">("bar");
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<Set<string>>(
    () => new Set(),
  );

  const categoryIdsParam =
    selectedCategoryIds.size > 0
      ? [...selectedCategoryIds].sort().join(",")
      : "";

  const reportQuery = useQuery<ExpenseReportResponse>({
    queryKey: [
      "reports",
      "expense",
      startDate,
      endDate,
      groupBy,
      categoryIdsParam,
    ],
    queryFn: async () => {
      const token = localStorage.getItem("pm_token");
      const params = new URLSearchParams({
        startDate,
        endDate,
        groupBy,
      });
      if (categoryIdsParam) {
        params.set("categoryIds", categoryIdsParam);
      }
      const res = await fetch(`/api/reports/expense?${params}`, {
        headers: { Authorization: token ? `Bearer ${token}` : "" },
      });
      const json = (await res.json()) as ExpenseReportResponse;
      if (!res.ok) {
        throw new Error(
          json.success === false ? json.error : "Failed to load expense report",
        );
      }
      return json;
    },
    enabled: Boolean(startDate && endDate),
  });

  const categoriesQuery = useQuery<ExpenseCategoriesResponse>({
    queryKey: ["categories", "expense", "for-expense-report"],
    queryFn: async () => {
      const token = localStorage.getItem("pm_token");
      const res = await fetch("/api/categories/expense", {
        headers: { Authorization: token ? `Bearer ${token}` : "" },
      });
      const json = (await res.json()) as ExpenseCategoriesResponse;
      if (!res.ok) {
        throw new Error(
          json.success === false ? json.error : "Failed to load categories",
        );
      }
      return json;
    },
  });

  const report = reportQuery.data?.success === true ? reportQuery.data.data : null;

  const expenseCategories =
    categoriesQuery.data?.success === true ? categoriesQuery.data.data.categories : [];

  function setPresetThisMonth() {
    const now = new Date();
    setStartDate(format(startOfMonth(now), "yyyy-MM-dd"));
    setEndDate(format(endOfMonth(now), "yyyy-MM-dd"));
  }

  function setPresetThisYear() {
    const now = new Date();
    setStartDate(format(startOfYear(now), "yyyy-MM-dd"));
    setEndDate(format(endOfYear(now), "yyyy-MM-dd"));
  }

  const formatAmount = (n: number) =>
    n.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const breakdownItems =
    report?.byCategory.map((c) => ({
      id: c.categoryId,
      name: c.categoryName,
      amount: c.amount,
      percentage: c.percentage,
      transactionCount: c.transactionCount,
    })) ?? [];

  const overtimeData =
    report?.overtime.map((o) => ({
      period: o.period,
      amount: o.amount,
      count: o.transactionCount,
    })) ?? [];

  function transactionHref(categoryId: string): string {
    const p = new URLSearchParams();
    p.set("type", "Expense");
    p.set("categoryId", categoryId);
    if (startDate) p.set("startDate", startDate);
    if (endDate) p.set("endDate", endDate);
    return `/transactions?${p.toString()}`;
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Button variant="ghost" size="sm" className="mb-2 -ml-2 gap-1" asChild>
            <Link href="/reports">
              <ArrowLeft className="h-4 w-4" aria-hidden />
              Reports
            </Link>
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Expense report</h1>
          <p className="mt-1 text-muted-foreground">
            Totals, category mix, and spending over time
          </p>
        </div>
      </div>

      <FilterPanel title="Filters" description="Date range, chart grouping, and categories">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-3">
            <Label className="text-xs text-muted-foreground">Date range</Label>
            <DateRangePicker
              idPrefix="expense-report"
              startDate={startDate}
              endDate={endDate}
              onStartDateChange={setStartDate}
              onEndDateChange={setEndDate}
              disabled={reportQuery.isFetching}
            />
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="secondary" size="sm" onClick={setPresetThisMonth}>
                This month
              </Button>
              <Button type="button" variant="secondary" size="sm" onClick={setPresetThisYear}>
                This year
              </Button>
            </div>
          </div>

          <div>
            {categoriesQuery.isLoading ? (
              <p className="text-sm text-muted-foreground">Loading categories…</p>
            ) : (
              <ExpenseCategoryFilterDropdown
                categories={expenseCategories}
                selectedIds={selectedCategoryIds}
                onSelectionChange={setSelectedCategoryIds}
                disabled={reportQuery.isFetching}
              />
            )}
          </div>
        </div>
      </FilterPanel>

      {reportQuery.isError ? (
        <p className="text-sm text-destructive">
          {(reportQuery.error as Error).message}
        </p>
      ) : null}

      {reportQuery.isLoading || reportQuery.isFetching ? (
        <p className="text-sm text-muted-foreground">Loading report…</p>
      ) : null}

      {report ? (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <ReportSummaryCard
              title="Total expense"
              value={formatAmount(report.summary.totalExpense)}
              description="In selected range and filters"
            />
            <ReportSummaryCard
              title="Transactions"
              value={String(report.summary.transactionCount)}
              description="Expense rows counted"
            />
            <ReportSummaryCard
              title="Average expense"
              value={formatAmount(report.summary.averageExpense)}
              description="Per transaction"
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <CategoryBreakdown
              title="Category mix (parent groups)"
              description="Shares of total expense by parent category"
              items={breakdownItems}
              formatAmount={formatAmount}
              showList={false}
            />
            <ExpenseCategoryDrilldown
              categories={report.byCategory}
              buildTransactionHref={transactionHref}
              formatAmount={formatAmount}
            />
          </div>

          <OvertimeChart
            title="Expense over time"
            description="Sum of expense amounts per period"
            data={overtimeData}
            variant={chartVariant}
            onVariantChange={setChartVariant}
            groupBy={groupBy}
            onGroupByChange={setGroupBy}
            formatYAxis={(v) => formatAmount(v)}
            formatTooltip={(v) => formatAmount(v)}
          />
        </>
      ) : null}
    </div>
  );
}
