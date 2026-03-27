"use client";

import { useMemo, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import Link from "next/link";
import {
  endOfMonth,
  endOfYear,
  format,
  startOfMonth,
  startOfYear,
} from "date-fns";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CategoryBreakdown,
  DateRangePicker,
  FilterPanel,
  IncomeCategoryFilterDropdown,
  OvertimeChart,
  ReportSummaryCard,
} from "@/components/reports";
import { formatCurrency } from "@/lib/utils/account.utils";
import type { IncomeCategory } from "@/types/category.types";
import type { IncomeReportData } from "@/types/report.types";
import type { ReportGroupBy } from "@/lib/utils/report.utils";

type IncomeCategoryWithFlags = IncomeCategory & { isDefault?: boolean };

type IncomeReportResponse =
  | { success: true; data: IncomeReportData }
  | { success: false; error: string; code: string };

type IncomeCategoriesResponse =
  | { success: true; data: { categories: IncomeCategoryWithFlags[] } }
  | { success: false; error: string; code: string };

function defaultRange(): { start: string; end: string } {
  const now = new Date();
  return {
    start: format(startOfMonth(now), "yyyy-MM-dd"),
    end: format(endOfMonth(now), "yyyy-MM-dd"),
  };
}

/**
 * Income report dashboard (FR-RPT-002).
 */
export default function IncomeReportPage() {
  const initial = useMemo(() => defaultRange(), []);
  const [startDate, setStartDate] = useState(initial.start);
  const [endDate, setEndDate] = useState(initial.end);
  const [groupBy, setGroupBy] = useState<ReportGroupBy>("month");
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<Set<string>>(
    () => new Set(),
  );

  const categoryIdsParam =
    selectedCategoryIds.size > 0
      ? [...selectedCategoryIds].sort().join(",")
      : "";

  const reportQuery = useQuery<IncomeReportResponse>({
    queryKey: ["reports", "income", startDate, endDate, groupBy, categoryIdsParam],
    queryFn: async () => {
      const token = localStorage.getItem("pm_token");
      const params = new URLSearchParams({
        startDate,
        endDate,
        groupBy,
      });
      if (categoryIdsParam) params.set("categoryIds", categoryIdsParam);
      const res = await fetch(`/api/reports/income?${params.toString()}`, {
        headers: { Authorization: token ? `Bearer ${token}` : "" },
      });
      const json = (await res.json()) as IncomeReportResponse;
      if (!res.ok) {
        throw new Error(
          json.success === false ? json.error : "Failed to load income report",
        );
      }
      return json;
    },
    enabled: Boolean(startDate && endDate),
    placeholderData: keepPreviousData,
  });

  const categoriesQuery = useQuery<IncomeCategoriesResponse>({
    queryKey: ["categories", "income", "for-income-report"],
    queryFn: async () => {
      const token = localStorage.getItem("pm_token");
      const res = await fetch("/api/categories/income", {
        headers: { Authorization: token ? `Bearer ${token}` : "" },
      });
      const json = (await res.json()) as IncomeCategoriesResponse;
      if (!res.ok) {
        throw new Error(json.success === false ? json.error : "Failed to load categories");
      }
      return json;
    },
  });

  const report = reportQuery.data?.success === true ? reportQuery.data.data : null;
  const incomeCategories =
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

  const formatAmount = (n: number) => formatCurrency(n, "VND");

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

  const chartVariant: "line" | "bar" =
    groupBy === "day" || groupBy === "week" ? "line" : "bar";

  const averagePerGroup =
    report && report.overtime.length > 0
      ? report.summary.totalIncome / report.overtime.length
      : 0;
  const multiCurrencyText = report
    ? `Multi-currency: ${formatCurrency(report.summary.originalTotalsByCurrency.VND, "VND")}, ${formatCurrency(report.summary.originalTotalsByCurrency.USD, "USD")}, ${formatCurrency(report.summary.originalTotalsByCurrency.mace, "mace")}`
    : "";

  function transactionHref(categoryId: string): string {
    const p = new URLSearchParams();
    p.set("type", "Income");
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
          <h1 className="text-3xl font-bold tracking-tight">Income report</h1>
          <p className="mt-1 text-muted-foreground">
            Totals, source mix, and income over time
          </p>
        </div>
      </div>

      <FilterPanel title="Filters" description="Date range, chart grouping, and categories">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-3">
            <Label className="text-xs text-muted-foreground">Date range</Label>
            <DateRangePicker
              idPrefix="income-report"
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
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Group by</Label>
              <Select
                value={groupBy}
                onValueChange={(v) => setGroupBy(v as ReportGroupBy)}
                disabled={reportQuery.isFetching}
              >
                <SelectTrigger className="h-9 w-full sm:w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">Day</SelectItem>
                  <SelectItem value="week">Week</SelectItem>
                  <SelectItem value="month">Month</SelectItem>
                  <SelectItem value="year">Year</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            {categoriesQuery.isLoading ? (
              <p className="text-sm text-muted-foreground">Loading categories…</p>
            ) : (
              <IncomeCategoryFilterDropdown
                categories={incomeCategories}
                selectedIds={selectedCategoryIds}
                onSelectionChange={setSelectedCategoryIds}
                disabled={reportQuery.isFetching}
              />
            )}
          </div>
        </div>
      </FilterPanel>

      {reportQuery.isError ? (
        <p className="text-sm text-destructive">{(reportQuery.error as Error).message}</p>
      ) : null}

      {reportQuery.isLoading && !report ? (
        <p className="text-sm text-muted-foreground">Loading report…</p>
      ) : null}

      {reportQuery.isFetching && report ? (
        <p className="text-sm text-muted-foreground">Refreshing report…</p>
      ) : null}

      {report ? (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <ReportSummaryCard
              title="Total income"
              value={formatAmount(report.summary.totalIncome)}
              description={multiCurrencyText}
            />
            <ReportSummaryCard
              title="Transactions"
              value={String(report.summary.transactionCount)}
              description="Income rows counted"
            />
            <ReportSummaryCard
              title={`Average income per ${groupBy}`}
              value={formatAmount(averagePerGroup)}
              description={`Average in each ${groupBy} bucket (VND)`}
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <CategoryBreakdown
              title="Category mix"
              description="Shares of total income by category"
              items={breakdownItems}
              formatAmount={formatAmount}
              showList
            />
            <div className="rounded-lg border bg-card p-4">
              <h2 className="text-lg font-semibold">Drill-down</h2>
              <p className="mb-4 mt-1 text-sm text-muted-foreground">
                Open filtered transactions for each income category.
              </p>
              {report.byCategory.length === 0 ? (
                <p className="text-sm text-muted-foreground">No categories in range</p>
              ) : (
                <ul className="space-y-2">
                  {report.byCategory.map((row) => (
                    <li
                      key={row.categoryId}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-md border px-3 py-2"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium">{row.categoryName}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatAmount(row.amount)} ({row.percentage.toFixed(1)}%) -{" "}
                          {row.transactionCount} transaction
                          {row.transactionCount === 1 ? "" : "s"}
                        </p>
                      </div>
                      <Button asChild size="sm" variant="outline">
                        <Link href={transactionHref(row.categoryId)}>View transactions</Link>
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <OvertimeChart
            title="Income over time"
            description="Sum of income amounts per period"
            data={overtimeData}
            variant={chartVariant}
            formatYAxis={(v) => formatAmount(v)}
            formatTooltip={(v) => formatAmount(v)}
          />
        </>
      ) : null}
    </div>
  );
}
