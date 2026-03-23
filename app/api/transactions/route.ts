import { NextRequest } from "next/server";
import { ZodError } from "zod";
import { authenticateRequest, jsonError, jsonSuccess } from "@/lib/utils/api";
import { createSupabaseServerClient } from "@/lib/supabase";
import {
  createTransactionSchema,
  transactionQuerySchema,
} from "@/lib/schemas/transaction.schema";
import type { Database } from "@/types/database.types";

type TransactionRow = Database["public"]["Tables"]["transaction"]["Row"];
type TransactionInsert = Database["public"]["Tables"]["transaction"]["Insert"];

/**
 * List transactions with filtering and pagination
 * Implements FR-TXN-005: View Transactions
 * @see docs/api-design.md#get-apitransactions
 * @see docs/specifications.md#fr-txn-005-view-transactions
 */
export async function GET(req: NextRequest) {
  try {
    const user = await authenticateRequest(req);

    const { searchParams } = new URL(req.url);
    const queryParams = {
      page: searchParams.get("page") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
      type: searchParams.get("type") ?? undefined,
      accountId: searchParams.get("accountId") ?? undefined,
      categoryId: searchParams.get("categoryId") ?? undefined,
      startDate: searchParams.get("startDate") ?? undefined,
      endDate: searchParams.get("endDate") ?? undefined,
      search: searchParams.get("search") ?? undefined,
    };

    const validatedQuery = transactionQuerySchema.parse(queryParams);
    const page = validatedQuery.page;
    const limit = validatedQuery.limit;
    const offset = (page - 1) * limit;

    const accessToken =
      req.cookies.get("pm_access_token")?.value ||
      req.headers.get("Authorization")?.replace("Bearer ", "");
    const supabase = createSupabaseServerClient({ accessToken });

    let query = supabase
      .from("transaction")
      .select("*", { count: "exact" })
      .eq("user_id", user.id);

    if (validatedQuery.type) {
      query = query.eq("type", validatedQuery.type);
    }

    if (validatedQuery.accountId) {
      query = query.or(
        `from_account_id.eq.${validatedQuery.accountId},to_account_id.eq.${validatedQuery.accountId}`,
      );
    }

    if (validatedQuery.categoryId) {
      query = query.or(
        `expense_category_id.eq.${validatedQuery.categoryId},income_category_id.eq.${validatedQuery.categoryId}`,
      );
    }

    if (validatedQuery.startDate) {
      query = query.gte("date_time", validatedQuery.startDate);
    }

    if (validatedQuery.endDate) {
      query = query.lte("date_time", validatedQuery.endDate);
    }

    if (validatedQuery.search) {
      query = query.ilike("details", `%${validatedQuery.search}%`);
    }

    const { data, error, count } = await query
      .order("date_time", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("Error fetching transactions:", error);
      return jsonError(500, "Failed to fetch transactions", "SERVER_ERROR");
    }

    const total = count ?? 0;
    const totalPages = total === 0 ? 0 : Math.ceil(total / limit);

    const transactions = (data ?? []) as TransactionRow[];

    return jsonSuccess({
      transactions,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return jsonError(401, "Authentication required", "UNAUTHORIZED");
    }

    if (error instanceof ZodError) {
      return jsonError(400, "Invalid query parameters", "VALIDATION_ERROR");
    }

    console.error("GET /api/transactions error:", error);
    return jsonError(500, "Internal server error", "SERVER_ERROR");
  }
}

/**
 * Create a new transaction
 * Implements FR-TXN-001 to FR-TXN-004: Create Transactions
 * @see docs/api-design.md#post-apitransactions
 */
export async function POST(req: NextRequest) {
  try {
    const user = await authenticateRequest(req);

    const body = await req.json();
    const validatedData = createTransactionSchema.parse(body);

    const accessToken =
      req.cookies.get("pm_access_token")?.value ||
      req.headers.get("Authorization")?.replace("Bearer ", "");
    const supabase = createSupabaseServerClient({ accessToken });

    // Build insert payload based on transaction type
    const basePayload: Partial<TransactionRow> = {
      user_id: user.id,
      type: validatedData.type,
      amount: validatedData.amount,
      currency: validatedData.currency,
      date_time: validatedData.dateTime,
      details: validatedData.details ?? null,
    };

    let payload: Partial<TransactionRow> = basePayload;

    if (validatedData.type === "Expense") {
      payload = {
        ...basePayload,
        from_account_id: validatedData.fromAccountId,
        expense_category_id: validatedData.expenseCategoryId,
        counterparty_id: validatedData.counterpartyId ?? null,
        payment_method: validatedData.paymentMethod ?? null,
      };
    } else if (validatedData.type === "Income") {
      payload = {
        ...basePayload,
        to_account_id: validatedData.toAccountId,
        income_category_id: validatedData.incomeCategoryId,
        counterparty_id: validatedData.counterpartyId ?? null,
      };
    } else if (validatedData.type === "Transfer") {
      payload = {
        ...basePayload,
        from_account_id: validatedData.fromAccountId,
        to_account_id: validatedData.toAccountId,
        vnd_exchange: validatedData.vndExchange ?? null,
      };
    } else if (validatedData.type === "Borrow") {
      payload = {
        ...basePayload,
        from_account_id: validatedData.fromAccountId ?? null,
        to_account_id: validatedData.toAccountId ?? null,
        counterparty_id: validatedData.counterpartyId,
      };
    }

    const { data: transaction, error } = await supabase
      .from("transaction")
      .insert(payload as TransactionInsert)
      .select()
      .single();

    if (error || !transaction) {
      console.error("Error creating transaction:", error);
      return jsonError(500, "Failed to create transaction", "SERVER_ERROR");
    }

    const typedTransaction = transaction as TransactionRow;

    return jsonSuccess(
      { transaction: typedTransaction },
      "Transaction created successfully",
      201,
    );
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return jsonError(401, "Authentication required", "UNAUTHORIZED");
    }

    if (error instanceof ZodError) {
      return jsonError(400, "Validation failed", "VALIDATION_ERROR");
    }

    console.error("POST /api/transactions error:", error);
    return jsonError(500, "Internal server error", "SERVER_ERROR");
  }
}

