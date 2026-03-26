"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ComparisonReportOvertimeRow } from "@/types/report.types";

export interface ComparisonOvertimeChartProps {
  data: ComparisonReportOvertimeRow[];
  title?: string;
  description?: string;
  formatAmount?: (value: number) => string;
  height?: number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    dataKey?: string | number;
    name?: string;
    value?: number | string;
    color?: string;
  }>;
  label?: string | number;
}

function buildTooltip(formatAmount: (value: number) => string) {
  return function ComparisonTooltip({
    active,
    payload,
    label,
  }: CustomTooltipProps) {
    if (!active || !payload?.length) return null;
    return (
      <div className="rounded-md border bg-popover px-3 py-2 text-sm text-popover-foreground shadow-md">
        <div className="mb-1 font-medium">{String(label ?? "")}</div>
        {payload.map((entry) => (
          <div key={String(entry.dataKey)} className="text-muted-foreground">
            <span style={{ color: entry.color }}>{entry.name}: </span>
            {formatAmount(Number(entry.value ?? 0))}
          </div>
        ))}
      </div>
    );
  };
}

/**
 * Dual-axis overtime chart for expense vs income comparison (FR-RPT-003).
 */
export function ComparisonOvertimeChart({
  data,
  title = "Income vs expense over time",
  description = "Income and expense are bars; net is the trend line.",
  formatAmount = (v) => v.toLocaleString(),
  height = 320,
}: ComparisonOvertimeChartProps) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className="flex min-h-[200px] items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground"
            style={{ height }}
          >
            No data for this range
          </div>
        </CardContent>
      </Card>
    );
  }

  const TooltipContent = buildTooltip(formatAmount);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="w-full min-w-0" style={{ height }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={data}
              margin={{ top: 8, right: 16, left: 0, bottom: 8 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="period" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis
                yAxisId="main"
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={formatAmount}
                width={56}
              />
              <YAxis
                yAxisId="net"
                orientation="right"
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={formatAmount}
                width={56}
              />
              <Tooltip content={TooltipContent} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar yAxisId="main" dataKey="income" name="Income" fill="#16a34a" radius={[4, 4, 0, 0]} />
              <Bar yAxisId="main" dataKey="expense" name="Expense" fill="#dc2626" radius={[4, 4, 0, 0]} />
              <Line
                yAxisId="net"
                type="monotone"
                dataKey="net"
                name="Net"
                stroke="#2563eb"
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
