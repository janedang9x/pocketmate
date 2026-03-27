import { NextRequest } from "next/server";
import { ZodError } from "zod";
import { authenticateRequest, jsonError, jsonSuccess } from "@/lib/utils/api";
import { createSupabaseServerClient } from "@/lib/supabase";
import { incomeReportQuerySchema } from "@/lib/schemas/report.schema";
import {
  aggregateByPeriod,
  percentageOf,
  type ReportGroupBy,
} from "@/lib/utils/report.utils";
import { convertAmountToVnd, getLatestVndExchangeRates } from "@/lib/utils/exchange-rate.utils";
import type { Currency } from "@/types/account.types";
import type { Database } from "@/types/database.types";
import type {
  IncomeReportCategoryRow,
  IncomeReportOvertimeRow,
} from "@/types/report.types";

type TransactionRow = Database["public"]["Tables"]["transaction"]["Row"];
type IncomeCategoryRow = Database["public"]["Tables"]["income_categories"]["Row"];

/**
 * Income analytics for reports (FR-RPT-002).
 * @see docs/api-design.md#get-apireportsincome
 */
export async function GET(req: NextRequest) {
  try {
    const user = await authenticateRequest(req);

    const { searchParams } = new URL(req.url);
    const parsed = incomeReportQuerySchema.parse({
      startDate: searchParams.get("startDate") ?? "",
      endDate: searchParams.get("endDate") ?? "",
      categoryIds: searchParams.get("categoryIds") ?? undefined,
      groupBy: searchParams.get("groupBy") ?? undefined,
    });

    const accessToken =
      req.cookies.get("pm_access_token")?.value ||
      req.headers.get("Authorization")?.replace("Bearer ", "");
    const supabase = createSupabaseServerClient({ accessToken });

    const [{ data: categories, error: catError }, { data: txRows, error: txError }] =
      await Promise.all([
        supabase
          .from("income_categories")
          .select("id, name")
          .or(`user_id.is.null,user_id.eq.${user.id}`),
        supabase
          .from("transaction")
          .select("id, amount, currency, date_time, income_category_id")
          .eq("user_id", user.id)
          .eq("type", "Income")
          .gte("date_time", parsed.startDate)
          .lte("date_time", parsed.endDate),
      ]);

    if (catError || txError) {
      console.error("Income report fetch error:", catError ?? txError);
      return jsonError(500, "Failed to build income report", "SERVER_ERROR");
    }

    const categoryList = (categories ?? []) as Pick<IncomeCategoryRow, "id" | "name">[];
    const catById = new Map(categoryList.map((c) => [c.id, c]));
    const selectedIds = parsed.categoryIds;
    const hasCategoryFilter = selectedIds.length > 0;

    const transactions = (txRows ?? []) as Pick<
      TransactionRow,
      "id" | "amount" | "currency" | "date_time" | "income_category_id"
    >[];
    const exchangeRates = await getLatestVndExchangeRates().catch(() => null);

    const toVnd = (amount: number, currency: string): number => {
      if (!exchangeRates) return amount;
      return convertAmountToVnd(amount, currency as Currency, exchangeRates);
    };

    const filtered = hasCategoryFilter
      ? transactions.filter(
          (t) => t.income_category_id != null && selectedIds.includes(t.income_category_id),
        )
      : transactions;
    const originalTotalsByCurrency = { VND: 0, USD: 0, mace: 0 };
    for (const t of filtered) {
      const currency = t.currency as keyof typeof originalTotalsByCurrency;
      if (currency in originalTotalsByCurrency) {
        originalTotalsByCurrency[currency] += t.amount;
      }
    }

    const totalIncome = filtered.reduce((sum, t) => sum + toVnd(t.amount, t.currency), 0);
    const transactionCount = filtered.length;
    const averageIncome = transactionCount > 0 ? totalIncome / transactionCount : 0;

    const UNCATEGORIZED_ID = "__uncategorized__";
    const byCategoryMap = new Map<string, { amount: number; count: number }>();
    for (const tx of filtered) {
      const key = tx.income_category_id ?? UNCATEGORIZED_ID;
      const prev = byCategoryMap.get(key) ?? { amount: 0, count: 0 };
      prev.amount += toVnd(tx.amount, tx.currency);
      prev.count += 1;
      byCategoryMap.set(key, prev);
    }

    const byCategory: IncomeReportCategoryRow[] = [...byCategoryMap.entries()]
      .map(([categoryId, bucket]) => ({
        categoryId,
        categoryName:
          categoryId === UNCATEGORIZED_ID
            ? "Uncategorized"
            : catById.get(categoryId)?.name ?? "Unknown category",
        amount: bucket.amount,
        percentage: percentageOf(bucket.amount, totalIncome),
        transactionCount: bucket.count,
      }))
      .sort((a, b) => b.amount - a.amount);

    const overtime = aggregateByPeriod(
      filtered,
      (t) => t.date_time,
      (t) => toVnd(t.amount, t.currency),
      parsed.groupBy as ReportGroupBy,
    ).map(
      (row): IncomeReportOvertimeRow => ({
        period: row.periodKey,
        amount: row.amount,
        transactionCount: row.count,
      }),
    );

    return jsonSuccess({
      summary: {
        totalIncome,
        transactionCount,
        averageIncome,
        originalTotalsByCurrency,
      },
      byCategory,
      overtime,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return jsonError(401, "Authentication required", "UNAUTHORIZED");
    }

    if (error instanceof ZodError) {
      return jsonError(400, "Invalid query parameters", "VALIDATION_ERROR");
    }

    console.error("GET /api/reports/income error:", error);
    return jsonError(500, "Internal server error", "SERVER_ERROR");
  }
}
