import {
  format,
  isValid,
  parseISO,
  startOfWeek,
} from "date-fns";

/** Grouping granularity for overtime / trend series (FR-RPT). */
export type ReportGroupBy = "day" | "week" | "month" | "year";

/**
 * Returns a stable, sortable key for the calendar period containing `date`.
 */
export function getPeriodKey(date: Date, groupBy: ReportGroupBy): string {
  switch (groupBy) {
    case "day":
      return format(date, "yyyy-MM-dd");
    case "week": {
      const weekStart = startOfWeek(date, { weekStartsOn: 1 });
      return format(weekStart, "yyyy-MM-dd");
    }
    case "month":
      return format(date, "yyyy-MM");
    case "year":
      return format(date, "yyyy");
  }
}

function parsePeriodKeyToTime(key: string, groupBy: ReportGroupBy): number {
  if (groupBy === "month") {
    const d = parseISO(`${key}-01`);
    return isValid(d) ? d.getTime() : 0;
  }
  if (groupBy === "year") {
    const d = parseISO(`${key}-01-01`);
    return isValid(d) ? d.getTime() : 0;
  }
  const d = parseISO(key);
  return isValid(d) ? d.getTime() : 0;
}

/**
 * Sort comparator for period keys produced by {@link getPeriodKey}.
 */
export function comparePeriodKeys(
  a: string,
  b: string,
  groupBy: ReportGroupBy
): number {
  return parsePeriodKeyToTime(a, groupBy) - parsePeriodKeyToTime(b, groupBy);
}

/**
 * Percentage of `part` relative to `total`, 0 when total is not positive.
 */
export function percentageOf(
  part: number,
  total: number,
  decimals = 1
): number {
  if (!Number.isFinite(part) || !Number.isFinite(total) || total === 0) {
    return 0;
  }
  const raw = (part / total) * 100;
  const factor = 10 ** decimals;
  return Math.round(raw * factor) / factor;
}

export function safeDivide(numerator: number, denominator: number): number {
  if (!Number.isFinite(numerator) || !Number.isFinite(denominator)) {
    return 0;
  }
  if (denominator === 0) return 0;
  return numerator / denominator;
}

export interface AggregateBucket {
  sum: number;
  count: number;
}

/**
 * Groups rows by string key and accumulates sum + count.
 */
export function aggregateNumericByKey<T>(
  rows: T[],
  getKey: (row: T) => string | null | undefined,
  getValue: (row: T) => number
): Map<string, AggregateBucket> {
  const map = new Map<string, AggregateBucket>();
  for (const row of rows) {
    const key = getKey(row);
    if (key == null || key === "") continue;
    const value = getValue(row);
    if (!Number.isFinite(value)) continue;
    const prev = map.get(key) ?? { sum: 0, count: 0 };
    prev.sum += value;
    prev.count += 1;
    map.set(key, prev);
  }
  return map;
}

export interface PeriodAggregateRow {
  periodKey: string;
  amount: number;
  count: number;
}

/**
 * Buckets rows by calendar period for chart/API payloads.
 */
export function aggregateByPeriod<T>(
  rows: T[],
  getDate: (row: T) => Date | string | null | undefined,
  getAmount: (row: T) => number,
  groupBy: ReportGroupBy
): PeriodAggregateRow[] {
  const map = new Map<string, { amount: number; count: number }>();

  for (const row of rows) {
    const raw = getDate(row);
    const date =
      typeof raw === "string"
        ? parseISO(raw)
        : raw instanceof Date
          ? raw
          : null;
    if (!date || !isValid(date)) continue;

    const key = getPeriodKey(date, groupBy);
    const amount = getAmount(row);
    if (!Number.isFinite(amount)) continue;

    const prev = map.get(key) ?? { amount: 0, count: 0 };
    prev.amount += amount;
    prev.count += 1;
    map.set(key, prev);
  }

  return [...map.entries()]
    .map(([periodKey, v]) => ({ periodKey, ...v }))
    .sort((x, y) => comparePeriodKeys(x.periodKey, y.periodKey, groupBy));
}

export type TrendDirection = "up" | "down" | "flat";

export interface PeriodOverPeriodResult {
  delta: number;
  percentChange: number;
  direction: TrendDirection;
}

/**
 * Compares two totals (e.g. this month vs last month).
 */
export function periodOverPeriodChange(
  current: number,
  previous: number
): PeriodOverPeriodResult {
  const delta = current - previous;
  let direction: TrendDirection = "flat";
  if (delta > 1e-9) direction = "up";
  else if (delta < -1e-9) direction = "down";

  const percentChange =
    previous !== 0
      ? (delta / Math.abs(previous)) * 100
      : current !== 0
        ? 100
        : 0;

  return { delta, percentChange, direction };
}

export interface SeriesTrendResult {
  first: number;
  last: number;
  avgDeltaPerStep: number;
  direction: TrendDirection;
}

/**
 * Simple trend across an ordered series of amounts (e.g. daily totals).
 */
export function seriesLinearTrend(amounts: number[]): SeriesTrendResult {
  if (amounts.length === 0) {
    return { first: 0, last: 0, avgDeltaPerStep: 0, direction: "flat" };
  }
  if (amounts.length === 1) {
    const v = amounts[0];
    return { first: v, last: v, avgDeltaPerStep: 0, direction: "flat" };
  }

  const first = amounts[0];
  const last = amounts[amounts.length - 1];
  const avgDeltaPerStep = (last - first) / (amounts.length - 1);

  let direction: TrendDirection = "flat";
  if (avgDeltaPerStep > 1e-9) direction = "up";
  else if (avgDeltaPerStep < -1e-9) direction = "down";

  return { first, last, avgDeltaPerStep, direction };
}
