"use client";

import { useMemo, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CategoryBreakdown,
  DateRangePicker,
  ExpenseCategoryDrilldown,
  ExpenseCategoryFilterDropdown,
  FilterPanel,
  OvertimeChart,
  ReportSummaryCard,
} from "@/components/reports";
import { useLocaleContext } from "@/components/providers/LocaleProvider";
import { displayExpenseReportCategoryName } from "@/lib/i18n/category-display-name";
import { formatCurrency } from "@/lib/utils/account.utils";
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
  const { messages: m, locale } = useLocaleContext();
  const r = m.reports;

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
        throw new Error(json.success === false ? json.error : r.failedExpense);
      }
      return json;
    },
    enabled: Boolean(startDate && endDate),
    placeholderData: keepPreviousData,
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
        throw new Error(json.success === false ? json.error : r.failedCategories);
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

  const formatAmount = (n: number) => formatCurrency(n, "VND");

  const breakdownItems =
    report?.byCategory.map((c) => ({
      id: c.categoryId,
      name: displayExpenseReportCategoryName(c, locale, m),
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

  const groupByLabel =
    groupBy === "day"
      ? r.groupDay
      : groupBy === "week"
        ? r.groupWeek
        : groupBy === "month"
          ? r.groupMonth
          : r.groupYear;

  const averagePerGroup =
    report && report.overtime.length > 0
      ? report.summary.totalExpense / report.overtime.length
      : 0;
  const multiCurrencyText = report
    ? `${m.common.multiCurrency}: ${formatCurrency(report.summary.originalTotalsByCurrency.VND, "VND")}, ${formatCurrency(report.summary.originalTotalsByCurrency.USD, "USD")}, ${formatCurrency(report.summary.originalTotalsByCurrency.mace, "mace")}`
    : "";

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
              {r.backReports}
            </Link>
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">{r.cardExpenseTitle}</h1>
          <p className="mt-1 text-muted-foreground">{r.expensePageSubtitle}</p>
        </div>
      </div>

      <FilterPanel>
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-3">
            <Label className="text-xs text-muted-foreground">{r.dateRange}</Label>
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
                {r.thisMonth}
              </Button>
              <Button type="button" variant="secondary" size="sm" onClick={setPresetThisYear}>
                {r.thisYear}
              </Button>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">{r.groupBy}</Label>
              <Select
                value={groupBy}
                onValueChange={(v) => setGroupBy(v as ReportGroupBy)}
                disabled={reportQuery.isFetching}
              >
                <SelectTrigger className="h-9 w-full sm:w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">{r.groupDay}</SelectItem>
                  <SelectItem value="week">{r.groupWeek}</SelectItem>
                  <SelectItem value="month">{r.groupMonth}</SelectItem>
                  <SelectItem value="year">{r.groupYear}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            {categoriesQuery.isLoading ? (
              <p className="text-sm text-muted-foreground">{r.loadingCategories}</p>
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

      {reportQuery.isLoading && !report ? (
        <p className="text-sm text-muted-foreground">{r.loadingReport}</p>
      ) : null}

      {reportQuery.isFetching && report ? (
        <p className="text-sm text-muted-foreground">{r.refreshingReport}</p>
      ) : null}

      {report ? (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <ReportSummaryCard
              title={r.totalExpense}
              value={formatAmount(report.summary.totalExpense)}
              description={multiCurrencyText}
            />
            <ReportSummaryCard
              title={r.transactionsCount}
              value={String(report.summary.transactionCount)}
              description={r.expenseRowsCounted}
            />
            <ReportSummaryCard
              title={r.avgPerGroup.replace("{groupBy}", groupByLabel)}
              value={formatAmount(averagePerGroup)}
              description={r.avgInBucket.replace("{groupBy}", groupByLabel)}
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <CategoryBreakdown
              title={r.categoryMixTitle}
              description={r.categoryMixDesc}
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
            title={r.expenseOverTime}
            description={r.expenseOverTimeDesc}
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
