"use client";

import {
  Bar,
  BarChart as RechartsBarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipContentProps,
} from "recharts";
import { cn } from "@/lib/utils";
import { chartColorAt } from "./chartColors";

export interface BarChartSeries {
  dataKey: string;
  name?: string;
  fill?: string;
  stackId?: string;
}

export interface BarChartDatum {
  [key: string]: string | number | undefined;
}

export interface BarChartProps {
  data: BarChartDatum[];
  xDataKey: string;
  series: BarChartSeries[];
  className?: string;
  height?: number;
  formatXAxisLabel?: (value: string) => string;
  formatYAxisTick?: (value: number) => string;
  formatTooltipValue?: (value: number, dataKey: string) => string;
  yAxisWidth?: number;
}

function buildBarTooltip(
  formatTooltipValue?: (value: number, dataKey: string) => string
) {
  return function BarTooltip({
    active,
    payload,
    label,
  }: TooltipContentProps) {
    if (!active || !payload?.length) return null;
    return (
      <div className="rounded-md border bg-popover px-3 py-2 text-sm text-popover-foreground shadow-md">
        <div className="mb-1 font-medium">{String(label ?? "")}</div>
        {payload.map((entry) => {
          const v =
            typeof entry.value === "number"
              ? entry.value
              : Number(entry.value);
          const text = formatTooltipValue
            ? formatTooltipValue(v, String(entry.dataKey ?? ""))
            : Number.isFinite(v)
              ? v.toLocaleString()
              : "—";
          return (
            <div key={String(entry.dataKey)} className="text-muted-foreground">
              <span style={{ color: entry.color }}>{entry.name}: </span>
              {text}
            </div>
          );
        })}
      </div>
    );
  };
}

/**
 * Responsive bar chart wrapper (Recharts).
 * Sprint 4.1 — Report Infrastructure
 */
export function BarChart({
  data,
  xDataKey,
  series,
  className,
  height = 300,
  formatXAxisLabel,
  formatYAxisTick,
  formatTooltipValue,
  yAxisWidth = 48,
}: BarChartProps) {
  if (!data.length) {
    return (
      <div
        className={cn(
          "flex min-h-[200px] items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground",
          className
        )}
        style={{ height }}
      >
        No data for this range
      </div>
    );
  }

  const TooltipContent = buildBarTooltip(formatTooltipValue);

  return (
    <div className={cn("w-full min-w-0", className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsBarChart
          data={data}
          margin={{ top: 8, right: 16, left: 0, bottom: 8 }}
        >
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis
            dataKey={xDataKey}
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={formatXAxisLabel}
          />
          <YAxis
            width={yAxisWidth}
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={formatYAxisTick}
          />
          <Tooltip content={TooltipContent} />
          {series.map((s, i) => (
            <Bar
              key={s.dataKey}
              dataKey={s.dataKey}
              name={s.name ?? s.dataKey}
              fill={s.fill ?? chartColorAt(i)}
              radius={[4, 4, 0, 0]}
              stackId={s.stackId}
            />
          ))}
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
}
