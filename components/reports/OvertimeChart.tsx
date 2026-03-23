"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { BarChart } from "@/components/charts/BarChart";
import { LineChart } from "@/components/charts/LineChart";
import type { ReportGroupBy } from "@/lib/utils/report.utils";

export interface OvertimeDatum {
  period: string;
  amount: number;
  count?: number;
}

export interface OvertimeChartProps {
  title?: string;
  description?: string;
  data: OvertimeDatum[];
  variant: "line" | "bar";
  onVariantChange?: (variant: "line" | "bar") => void;
  /** When set with `onGroupByChange`, shows grouping selector */
  groupBy?: ReportGroupBy;
  onGroupByChange?: (groupBy: ReportGroupBy) => void;
  className?: string;
  height?: number;
  formatYAxis?: (value: number) => string;
  formatTooltip?: (value: number) => string;
}

const GROUP_OPTIONS: { value: ReportGroupBy; label: string }[] = [
  { value: "day", label: "Day" },
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
  { value: "year", label: "Year" },
];

/**
 * Overtime series visualization with line/bar toggle for report pages.
 * Sprint 4.1 — Report Infrastructure
 */
export function OvertimeChart({
  title = "Over time",
  description,
  data,
  variant,
  onVariantChange,
  groupBy,
  onGroupByChange,
  className,
  height = 300,
  formatYAxis = (v) => v.toLocaleString(),
  formatTooltip = (v) => v.toLocaleString(),
}: OvertimeChartProps) {
  const chartData = data.map((d) => ({
    period: d.period,
    amount: d.amount,
    ...(d.count != null ? { count: d.count } : {}),
  }));

  return (
    <Card className={cn(className)}>
      <CardHeader className="flex flex-col gap-4 space-y-0 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <CardTitle className="text-lg">{title}</CardTitle>
          {description ? <CardDescription>{description}</CardDescription> : null}
        </div>
        <div className="flex flex-col gap-3 sm:items-end">
          {onVariantChange ? (
            <div className="flex w-full flex-col gap-1.5 sm:w-[160px]">
              <Label className="text-xs text-muted-foreground">Chart type</Label>
              <Select
                value={variant}
                onValueChange={(v) =>
                  onVariantChange(v === "bar" ? "bar" : "line")
                }
              >
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="line">Line</SelectItem>
                  <SelectItem value="bar">Bar</SelectItem>
                </SelectContent>
              </Select>
            </div>
          ) : null}
          {groupBy != null && onGroupByChange ? (
            <div className="flex w-full flex-col gap-1.5 sm:w-[160px]">
              <Label className="text-xs text-muted-foreground">Group by</Label>
              <Select value={groupBy} onValueChange={(v) => onGroupByChange(v as ReportGroupBy)}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {GROUP_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {variant === "line" ? (
          <LineChart
            data={chartData}
            xDataKey="period"
            series={[{ dataKey: "amount", name: "Amount" }]}
            height={height}
            formatYAxisTick={formatYAxis}
            formatTooltipValue={(v) => formatTooltip(v)}
          />
        ) : (
          <BarChart
            data={chartData}
            xDataKey="period"
            series={[{ dataKey: "amount", name: "Amount" }]}
            height={height}
            formatYAxisTick={formatYAxis}
            formatTooltipValue={(v) => formatTooltip(v)}
          />
        )}
      </CardContent>
    </Card>
  );
}
