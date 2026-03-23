"use client";

import {
  Cell,
  Legend,
  Pie,
  PieChart as RechartsPieChart,
  ResponsiveContainer,
  Tooltip,
  type TooltipContentProps,
} from "recharts";
import { cn } from "@/lib/utils";
import { chartColorAt } from "./chartColors";

export interface PieChartDataItem {
  name: string;
  value: number;
  [key: string]: string | number | undefined;
}

export interface PieChartProps {
  data: PieChartDataItem[];
  className?: string;
  /** Chart height in pixels inside the responsive container */
  height?: number;
  /** Donut thickness; 0 for full pie */
  innerRadius?: number | string;
  outerRadius?: number | string;
  valueKey?: string;
  nameKey?: string;
  /** Show legend below chart */
  showLegend?: boolean;
}

const defaultTooltip = ({ active, payload }: TooltipContentProps) => {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  const name = String(item.name ?? "");
  const value = typeof item.value === "number" ? item.value : Number(item.value);
  return (
    <div className="rounded-md border bg-popover px-3 py-2 text-sm text-popover-foreground shadow-md">
      <div className="font-medium">{name}</div>
      <div className="text-muted-foreground">{Number.isFinite(value) ? value.toLocaleString() : "—"}</div>
    </div>
  );
};

/**
 * Responsive pie / donut chart wrapper (Recharts).
 * Sprint 4.1 — Report Infrastructure
 */
export function PieChart({
  data,
  className,
  height = 280,
  innerRadius = 0,
  outerRadius = "80%",
  valueKey = "value",
  nameKey = "name",
  showLegend = true,
}: PieChartProps) {
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

  return (
    <div className={cn("w-full min-w-0", className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsPieChart margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
          <Tooltip content={defaultTooltip} />
          {showLegend ? (
            <Legend
              verticalAlign="bottom"
              height={36}
              wrapperStyle={{ fontSize: 12 }}
            />
          ) : null}
          <Pie
            data={data}
            dataKey={valueKey}
            nameKey={nameKey}
            cx="50%"
            cy="50%"
            innerRadius={innerRadius}
            outerRadius={outerRadius}
            paddingAngle={1}
            labelLine={false}
          >
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={chartColorAt(index)} />
            ))}
          </Pie>
        </RechartsPieChart>
      </ResponsiveContainer>
    </div>
  );
}
