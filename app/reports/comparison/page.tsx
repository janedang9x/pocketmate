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
  ComparisonOvertimeChart,
  DateRangePicker,
  FilterPanel,
  ReportSummaryCard,
} from "@/components/reports";
import {
  seriesLinearTrend,
  type ReportGroupBy,
  type TrendDirection,
} from "@/lib/utils/report.utils";
import type { ComparisonReportData } from "@/types/report.types";

type ComparisonReportResponse =
  | { success: true; data: ComparisonReportData }
  | { success: false; error: string; code: string };

function defaultRange(): { start: string; end: string } {
  const now = new Date();
  return {
    start: format(startOfMonth(now), "yyyy-MM-dd"),
    end: format(endOfMonth(now), "yyyy-MM-dd"),
  };
}

function formatAmount(value: number): string {
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function trendLabel(direction: TrendDirection, subject: string): string {
  if (direction === "up") return `${subject} trending up`;
  if (direction === "down") return `${subject} trending down`;
  return `${subject} is stable`;
}

/**
 * Expense vs income comparison dashboard (FR-RPT-003).
 */
export default function ComparisonReportPage() {
  const initial = useMemo(() => defaultRange(), []);
  const [startDate, setStartDate] = useState(initial.start);
  const [endDate, setEndDate] = useState(initial.end);
  const [groupBy, setGroupBy] = useState<ReportGroupBy>("month");

  const reportQuery = useQuery<ComparisonReportResponse>({
    queryKey: ["reports", "comparison", startDate, endDate, groupBy],
    queryFn: async () => {
      const token = localStorage.getItem("pm_token");
      const params = new URLSearchParams({ startDate, endDate, groupBy });
      const res = await fetch(`/api/reports/comparison?${params.toString()}`, {
        headers: { Authorization: token ? `Bearer ${token}` : "" },
      });
      const json = (await res.json()) as ComparisonReportResponse;
      if (!res.ok) {
        throw new Error(
          json.success === false ? json.error : "Failed to load comparison report",
        );
      }
      return json;
    },
    enabled: Boolean(startDate && endDate),
    placeholderData: keepPreviousData,
  });

  const report = reportQuery.data?.success === true ? reportQuery.data.data : null;

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

  const incomeTrend = seriesLinearTrend(report?.overtime.map((r) => r.income) ?? []);
  const expenseTrend = seriesLinearTrend(report?.overtime.map((r) => r.expense) ?? []);
  const netTrend = seriesLinearTrend(report?.overtime.map((r) => r.net) ?? []);

  const spentFromIncomePct =
    report && report.summary.totalIncome > 0
      ? (report.summary.totalExpense / report.summary.totalIncome) * 100
      : 0;
  const savingsRatePct = report?.summary.savingsRate ?? 0;

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
          <h1 className="text-3xl font-bold tracking-tight">Comparison report</h1>
          <p className="mt-1 text-muted-foreground">
            Compare income and expense trends over time
          </p>
        </div>
      </div>

      <FilterPanel title="Filters" description="Date range and chart grouping">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-3">
            <Label className="text-xs text-muted-foreground">Date range</Label>
            <DateRangePicker
              idPrefix="comparison-report"
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
        </div>
      </FilterPanel>

      {reportQuery.isError ? (
        <p className="text-sm text-destructive">{(reportQuery.error as Error).message}</p>
      ) : null}

      {reportQuery.isLoading && !report ? (
        <p className="text-sm text-muted-foreground">Loading report...</p>
      ) : null}

      {reportQuery.isFetching && report ? (
        <p className="text-sm text-muted-foreground">Refreshing report...</p>
      ) : null}

      {report ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <ReportSummaryCard
              title="Total income"
              value={formatAmount(report.summary.totalIncome)}
              valueClassName="text-emerald-600"
              description="Incoming amount in selected range"
              trend={{
                label: trendLabel(incomeTrend.direction, "Income"),
                direction: incomeTrend.direction,
              }}
            />
            <ReportSummaryCard
              title="Total expense"
              value={formatAmount(report.summary.totalExpense)}
              valueClassName="text-red-600"
              description="Outgoing amount in selected range"
              trend={{
                label: trendLabel(expenseTrend.direction, "Expense"),
                direction: expenseTrend.direction,
              }}
            />
            <ReportSummaryCard
              title="Net savings"
              value={formatAmount(report.summary.netSavings)}
              valueClassName="text-blue-600"
              description="Income minus expense"
              trend={{
                label: trendLabel(netTrend.direction, "Net"),
                direction: netTrend.direction,
              }}
            />
            <ReportSummaryCard
              title="Savings rate"
              value={`${report.summary.savingsRate.toFixed(1)}%`}
              description="Net savings as a share of income"
            />
          </div>

          <ComparisonOvertimeChart data={report.overtime} formatAmount={formatAmount} />

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-lg border bg-card p-4">
              <h2 className="text-lg font-semibold">Percentage breakdown</h2>
              <p className="mb-4 mt-1 text-sm text-muted-foreground">
                How income is split between spending and savings.
              </p>
              <div className="space-y-4">
                <div>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Spent from income</span>
                    <span className="font-medium">{spentFromIncomePct.toFixed(1)}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted">
                    <div
                      className="h-2 rounded-full bg-red-500"
                      style={{ width: `${Math.max(0, Math.min(100, spentFromIncomePct))}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Savings rate</span>
                    <span className="font-medium">{savingsRatePct.toFixed(1)}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted">
                    <div
                      className="h-2 rounded-full bg-blue-500"
                      style={{ width: `${Math.max(0, Math.min(100, savingsRatePct))}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-lg border bg-card p-4">
              <h2 className="text-lg font-semibold">Quick insights</h2>
              <p className="mb-4 mt-1 text-sm text-muted-foreground">
                Trend indicators for the selected date range.
              </p>
              <ul className="space-y-2 text-sm">
                <li className="rounded-md border px-3 py-2">
                  Income trend: <span className="font-medium">{incomeTrend.direction}</span>
                </li>
                <li className="rounded-md border px-3 py-2">
                  Expense trend: <span className="font-medium">{expenseTrend.direction}</span>
                </li>
                <li className="rounded-md border px-3 py-2">
                  Net trend: <span className="font-medium">{netTrend.direction}</span>
                </li>
              </ul>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
