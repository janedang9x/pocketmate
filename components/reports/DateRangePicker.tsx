"use client";

import { Calendar } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useLocaleContext } from "@/components/providers/LocaleProvider";

export interface DateRangePickerProps {
  /** `YYYY-MM-DD` or empty */
  startDate: string;
  /** `YYYY-MM-DD` or empty */
  endDate: string;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
  className?: string;
  disabled?: boolean;
  idPrefix?: string;
}

/**
 * Controlled date range using native date inputs (matches transaction list filters).
 * Sprint 4.1 — Report Infrastructure
 */
export function DateRangePicker({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  className,
  disabled,
  idPrefix = "report",
}: DateRangePickerProps) {
  const { messages: m } = useLocaleContext();
  const startId = `${idPrefix}-start`;
  const endId = `${idPrefix}-end`;

  return (
    <div
      className={cn(
        "flex flex-col gap-2 sm:flex-row sm:items-end sm:gap-3",
        className,
      )}
    >
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <Label htmlFor={startId} className="text-xs text-muted-foreground">
          {m.common.from}
        </Label>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 shrink-0 text-muted-foreground" />
          <Input
            id={startId}
            type="date"
            value={startDate}
            onChange={(e) => onStartDateChange(e.target.value)}
            disabled={disabled}
            className="h-9"
          />
        </div>
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <Label htmlFor={endId} className="text-xs text-muted-foreground">
          {m.common.rangeTo}
        </Label>
        <Input
          id={endId}
          type="date"
          value={endDate}
          onChange={(e) => onEndDateChange(e.target.value)}
          disabled={disabled}
          className="h-9"
        />
      </div>
    </div>
  );
}
