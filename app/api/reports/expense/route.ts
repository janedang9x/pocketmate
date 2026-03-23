import { NextRequest } from "next/server";
import { ZodError } from "zod";
import { authenticateRequest, jsonError, jsonSuccess } from "@/lib/utils/api";
import { createSupabaseServerClient } from "@/lib/supabase";
import { expenseReportQuerySchema } from "@/lib/schemas/report.schema";
import {
  aggregateByPeriod,
  percentageOf,
  type ReportGroupBy,
} from "@/lib/utils/report.utils";
import type { Database } from "@/types/database.types";
import type {
  ExpenseReportCategoryRow,
  ExpenseReportOvertimeRow,
  ExpenseReportSubcategory,
} from "@/types/report.types";

type TransactionRow = Database["public"]["Tables"]["transaction"]["Row"];
type ExpenseCategoryRow = Database["public"]["Tables"]["expense_categories"]["Row"];

/**
 * Expense analytics for reports (FR-RPT-001).
 * @see docs/api-design.md#get-apireportsexpense
 */
export async function GET(req: NextRequest) {
  try {
    const user = await authenticateRequest(req);

    const { searchParams } = new URL(req.url);
    const parsed = expenseReportQuerySchema.parse({
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
          .from("expense_categories")
          .select("id, name, parent_category_id")
          .or(`user_id.is.null,user_id.eq.${user.id}`),
        supabase
          .from("transaction")
          .select("id, amount, date_time, expense_category_id")
          .eq("user_id", user.id)
          .eq("type", "Expense")
          .gte("date_time", parsed.startDate)
          .lte("date_time", parsed.endDate),
      ]);

    if (catError || txError) {
      console.error("Expense report fetch error:", catError ?? txError);
      return jsonError(500, "Failed to build expense report", "SERVER_ERROR");
    }

    const categoryList = (categories ?? []) as ExpenseCategoryRow[];
    const catById = new Map(categoryList.map((c) => [c.id, c]));

    const selectedIds = parsed.categoryIds;
    const hasCategoryFilter = selectedIds.length > 0;

    function matchesCategoryFilter(expenseCategoryId: string | null): boolean {
      if (!hasCategoryFilter) return true;
      if (!expenseCategoryId) return false;
      if (selectedIds.includes(expenseCategoryId)) return true;
      const cat = catById.get(expenseCategoryId);
      if (cat?.parent_category_id && selectedIds.includes(cat.parent_category_id)) {
        return true;
      }
      return false;
    }

    function rollupParentId(expenseCategoryId: string | null): string | null {
      if (!expenseCategoryId) return null;
      const c = catById.get(expenseCategoryId);
      if (!c) return expenseCategoryId;
      return c.parent_category_id ?? c.id;
    }

    const transactions = (txRows ?? []) as Pick<
      TransactionRow,
      "id" | "amount" | "date_time" | "expense_category_id"
    >[];

    const filtered = transactions.filter((t) => matchesCategoryFilter(t.expense_category_id));

    const totalExpense = filtered.reduce((s, t) => s + t.amount, 0);
    const transactionCount = filtered.length;
    const averageExpense = transactionCount > 0 ? totalExpense / transactionCount : 0;

    const UNCATEGORIZED_ID = "__uncategorized__";

    /** Direct category id -> bucket (leaf or parent-assigned) */
    const directBuckets = new Map<string, { amount: number; count: number }>();
    for (const t of filtered) {
      const cid = t.expense_category_id;
      const key = cid ?? UNCATEGORIZED_ID;
      const prev = directBuckets.get(key) ?? { amount: 0, count: 0 };
      prev.amount += t.amount;
      prev.count += 1;
      directBuckets.set(key, prev);
    }

    /** Parent rollup */
    const parentBuckets = new Map<string, { amount: number; count: number }>();
    for (const t of filtered) {
      const pid = rollupParentId(t.expense_category_id);
      const key = pid ?? UNCATEGORIZED_ID;
      const prev = parentBuckets.get(key) ?? { amount: 0, count: 0 };
      prev.amount += t.amount;
      prev.count += 1;
      parentBuckets.set(key, prev);
    }

    const parentIds = [...parentBuckets.keys()].filter((id) => id !== UNCATEGORIZED_ID);
    const byCategory: ExpenseReportCategoryRow[] = parentIds
      .map((parentId) => {
        const cat = catById.get(parentId);
        const name = cat?.name ?? "Unknown category";
        const bucket = parentBuckets.get(parentId)!;
        const children = categoryList.filter((c) => c.parent_category_id === parentId);
        const subcategories: ExpenseReportSubcategory[] = [];

        for (const child of children) {
          const b = directBuckets.get(child.id);
          if (!b || b.amount === 0) continue;
          subcategories.push({
            categoryId: child.id,
            categoryName: child.name,
            amount: b.amount,
            percentage: percentageOf(b.amount, bucket.amount),
            transactionCount: b.count,
          });
        }

        const directOnParent = directBuckets.get(parentId);
        if (directOnParent && directOnParent.amount > 0) {
          subcategories.push({
            categoryId: parentId,
            categoryName: `${name} (general)`,
            amount: directOnParent.amount,
            percentage: percentageOf(directOnParent.amount, bucket.amount),
            transactionCount: directOnParent.count,
          });
        }

        subcategories.sort((a, b) => b.amount - a.amount);

        return {
          categoryId: parentId,
          categoryName: name,
          amount: bucket.amount,
          percentage: percentageOf(bucket.amount, totalExpense),
          transactionCount: bucket.count,
          subcategories,
        };
      })
      .sort((a, b) => b.amount - a.amount);

    const uncatBucket = parentBuckets.get(UNCATEGORIZED_ID);
    if (uncatBucket && uncatBucket.amount > 0) {
      byCategory.push({
        categoryId: UNCATEGORIZED_ID,
        categoryName: "Uncategorized",
        amount: uncatBucket.amount,
        percentage: percentageOf(uncatBucket.amount, totalExpense),
        transactionCount: uncatBucket.count,
        subcategories: [],
      });
    }

    const overtime = aggregateByPeriod(
      filtered,
      (t) => t.date_time,
      (t) => t.amount,
      parsed.groupBy as ReportGroupBy,
    ).map(
      (row): ExpenseReportOvertimeRow => ({
        period: row.periodKey,
        amount: row.amount,
        transactionCount: row.count,
      }),
    );

    return jsonSuccess({
      summary: {
        totalExpense,
        transactionCount,
        averageExpense,
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

    console.error("GET /api/reports/expense error:", error);
    return jsonError(500, "Internal server error", "SERVER_ERROR");
  }
}
