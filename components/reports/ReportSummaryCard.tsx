"use client";

import { TrendingDown, TrendingUp, Minus } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { TrendDirection } from "@/lib/utils/report.utils";

export interface ReportSummaryCardProps {
  title: string;
  /** Pre-formatted primary value (e.g. currency) */
  value: string;
  description?: string;
  trend?: {
    label: string;
    direction: TrendDirection;
  };
  className?: string;
}

function TrendIcon({ direction }: { direction: TrendDirection }) {
  const cls = "h-4 w-4 shrink-0";
  if (direction === "up") {
    return <TrendingUp className={cn(cls, "text-primary")} aria-hidden />;
  }
  if (direction === "down") {
    return <TrendingDown className={cn(cls, "text-destructive")} aria-hidden />;
  }
  return <Minus className={cn(cls, "text-muted-foreground")} aria-hidden />;
}

/**
 * Metric card for report dashboards (totals, averages, rates).
 * Sprint 4.1 — Report Infrastructure
 */
export function ReportSummaryCard({
  title,
  value,
  description,
  trend,
  className,
}: ReportSummaryCardProps) {
  return (
    <Card className={cn(className)}>
      <CardHeader className="pb-2">
        <CardDescription>{title}</CardDescription>
        <CardTitle className="text-2xl font-semibold tabular-nums tracking-tight">
          {value}
        </CardTitle>
      </CardHeader>
      {(description || trend) && (
        <CardContent className="space-y-2 pt-0">
          {description ? (
            <p className="text-sm text-muted-foreground">{description}</p>
          ) : null}
          {trend ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <TrendIcon direction={trend.direction} />
              <span>{trend.label}</span>
            </div>
          ) : null}
        </CardContent>
      )}
    </Card>
  );
}
