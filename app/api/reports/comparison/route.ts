import { NextRequest } from "next/server";
import { ZodError } from "zod";
import { authenticateRequest, jsonError, jsonSuccess } from "@/lib/utils/api";
import { createSupabaseServerClient } from "@/lib/supabase";
import { comparisonReportQuerySchema } from "@/lib/schemas/report.schema";
import {
  aggregateByPeriod,
  comparePeriodKeys,
  percentageOf,
  type ReportGroupBy,
} from "@/lib/utils/report.utils";
import type { Database } from "@/types/database.types";
import type { ComparisonReportOvertimeRow } from "@/types/report.types";

type TransactionRow = Database["public"]["Tables"]["transaction"]["Row"];

/**
 * Expense vs income analytics for reports (FR-RPT-003).
 * @see docs/api-design.md#get-apireportscomparison
 */
export async function GET(req: NextRequest) {
  try {
    const user = await authenticateRequest(req);

    const { searchParams } = new URL(req.url);
    const parsed = comparisonReportQuerySchema.parse({
      startDate: searchParams.get("startDate") ?? "",
      endDate: searchParams.get("endDate") ?? "",
      groupBy: searchParams.get("groupBy") ?? undefined,
    });

    const accessToken =
      req.cookies.get("pm_access_token")?.value ||
      req.headers.get("Authorization")?.replace("Bearer ", "");
    const supabase = createSupabaseServerClient({ accessToken });

    const { data: txRows, error: txError } = await supabase
      .from("transaction")
      .select("id, type, amount, date_time")
      .eq("user_id", user.id)
      .in("type", ["Income", "Expense"])
      .gte("date_time", parsed.startDate)
      .lte("date_time", parsed.endDate);

    if (txError) {
      console.error("Comparison report fetch error:", txError);
      return jsonError(500, "Failed to build comparison report", "SERVER_ERROR");
    }

    const transactions = (txRows ?? []) as Pick<
      TransactionRow,
      "id" | "type" | "amount" | "date_time"
    >[];

    const incomeTx = transactions.filter((t) => t.type === "Income");
    const expenseTx = transactions.filter((t) => t.type === "Expense");

    const totalIncome = incomeTx.reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = expenseTx.reduce((sum, t) => sum + t.amount, 0);
    const netSavings = totalIncome - totalExpense;
    const savingsRate = percentageOf(netSavings, totalIncome, 1);

    const groupBy = parsed.groupBy as ReportGroupBy;

    const incomeOvertime = aggregateByPeriod(
      incomeTx,
      (t) => t.date_time,
      (t) => t.amount,
      groupBy,
    );
    const expenseOvertime = aggregateByPeriod(
      expenseTx,
      (t) => t.date_time,
      (t) => t.amount,
      groupBy,
    );

    const incomeMap = new Map(incomeOvertime.map((r) => [r.periodKey, r.amount]));
    const expenseMap = new Map(expenseOvertime.map((r) => [r.periodKey, r.amount]));
    const periods = [...new Set([...incomeMap.keys(), ...expenseMap.keys()])].sort((a, b) =>
      comparePeriodKeys(a, b, groupBy),
    );

    const overtime: ComparisonReportOvertimeRow[] = periods.map((period) => {
      const income = incomeMap.get(period) ?? 0;
      const expense = expenseMap.get(period) ?? 0;
      return {
        period,
        income,
        expense,
        net: income - expense,
      };
    });

    return jsonSuccess({
      summary: {
        totalIncome,
        totalExpense,
        netSavings,
        savingsRate,
      },
      overtime,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return jsonError(401, "Authentication required", "UNAUTHORIZED");
    }

    if (error instanceof ZodError) {
      return jsonError(400, "Invalid query parameters", "VALIDATION_ERROR");
    }

    console.error("GET /api/reports/comparison error:", error);
    return jsonError(500, "Internal server error", "SERVER_ERROR");
  }
}
