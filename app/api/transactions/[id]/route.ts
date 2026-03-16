import { NextRequest } from "next/server";
import { ZodError } from "zod";
import { authenticateRequest, jsonError, jsonSuccess } from "@/lib/utils/api";
import { createSupabaseServerClient } from "@/lib/supabase";
import { updateTransactionSchema } from "@/lib/schemas/transaction.schema";
import type { Database } from "@/types/database.types";

type TransactionRow = Database["public"]["Tables"]["transaction"]["Row"];

/**
 * Get details of a specific transaction
 * Implements FR-TXN-005: View Transactions
 * @see docs/api-design.md#get-apitransactionsid
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await authenticateRequest(req);
    const { id } = await params;

    const accessToken =
      req.cookies.get("pm_access_token")?.value ||
      req.headers.get("Authorization")?.replace("Bearer ", "");
    const supabase = createSupabaseServerClient({ accessToken });

    const { data: transaction, error } = await supabase
      .from("transaction")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (error || !transaction) {
      return jsonError(404, "Transaction not found", "NOT_FOUND");
    }

    const typedTransaction = transaction as TransactionRow;

    return jsonSuccess({ transaction: typedTransaction });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return jsonError(401, "Authentication required", "UNAUTHORIZED");
    }

    console.error("GET /api/transactions/[id] error:", error);
    return jsonError(500, "Internal server error", "SERVER_ERROR");
  }
}

/**
 * Update an existing transaction
 * Implements FR-TXN-006: Edit Transaction
 * @see docs/api-design.md#put-apitransactionsid
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await authenticateRequest(req);
    const { id } = await params;

    const body = await req.json();
    const validatedData = updateTransactionSchema.parse(body);

    const accessToken =
      req.cookies.get("pm_access_token")?.value ||
      req.headers.get("Authorization")?.replace("Bearer ", "");
    const supabase = createSupabaseServerClient({ accessToken });

    // Ensure transaction exists and belongs to user
    const { data: existing, error: fetchError } = await supabase
      .from("transaction")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !existing) {
      return jsonError(404, "Transaction not found", "NOT_FOUND");
    }

    // Prevent changing transaction type explicitly even if provided
    const updatePayload: Partial<TransactionRow> = {
      amount:
        validatedData.amount !== undefined
          ? validatedData.amount
          : undefined,
      currency: validatedData.currency ?? undefined,
      date_time: validatedData.dateTime ?? undefined,
      details:
        validatedData.details !== undefined
          ? validatedData.details ?? null
          : undefined,
      from_account_id:
        validatedData.fromAccountId !== undefined
          ? validatedData.fromAccountId ?? null
          : undefined,
      to_account_id:
        validatedData.toAccountId !== undefined
          ? validatedData.toAccountId ?? null
          : undefined,
      expense_category_id:
        validatedData.expenseCategoryId !== undefined
          ? validatedData.expenseCategoryId ?? null
          : undefined,
      income_category_id:
        validatedData.incomeCategoryId !== undefined
          ? validatedData.incomeCategoryId ?? null
          : undefined,
      counterparty_id:
        validatedData.counterpartyId !== undefined
          ? validatedData.counterpartyId ?? null
          : undefined,
      payment_method:
        validatedData.paymentMethod !== undefined
          ? validatedData.paymentMethod ?? null
          : undefined,
      vnd_exchange:
        validatedData.vndExchange !== undefined
          ? validatedData.vndExchange ?? null
          : undefined,
    };

    const { data: updated, error: updateError } = await supabase
      .from("transaction")
      .update(updatePayload)
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (updateError || !updated) {
      console.error("Error updating transaction:", updateError);
      return jsonError(500, "Failed to update transaction", "SERVER_ERROR");
    }

    const typedTransaction = updated as TransactionRow;

    return jsonSuccess(
      { transaction: typedTransaction },
      "Transaction updated successfully",
    );
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return jsonError(401, "Authentication required", "UNAUTHORIZED");
    }

    if (error instanceof ZodError) {
      return jsonError(400, "Validation failed", "VALIDATION_ERROR");
    }

    console.error("PUT /api/transactions/[id] error:", error);
    return jsonError(500, "Internal server error", "SERVER_ERROR");
  }
}

/**
 * Delete a transaction
 * Implements FR-TXN-007: Delete Transaction
 * @see docs/api-design.md#delete-apitransactionsid
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await authenticateRequest(req);
    const { id } = await params;

    const accessToken =
      req.cookies.get("pm_access_token")?.value ||
      req.headers.get("Authorization")?.replace("Bearer ", "");
    const supabase = createSupabaseServerClient({ accessToken });

    // Ensure transaction exists and belongs to user
    const { data: existing, error: fetchError } = await supabase
      .from("transaction")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !existing) {
      return jsonError(404, "Transaction not found", "NOT_FOUND");
    }

    const { error: deleteError } = await supabase
      .from("transaction")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (deleteError) {
      console.error("Error deleting transaction:", deleteError);
      return jsonError(500, "Failed to delete transaction", "SERVER_ERROR");
    }

    return jsonSuccess(null, "Transaction deleted successfully");
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return jsonError(401, "Authentication required", "UNAUTHORIZED");
    }

    console.error("DELETE /api/transactions/[id] error:", error);
    return jsonError(500, "Internal server error", "SERVER_ERROR");
  }
}

