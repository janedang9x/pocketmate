import { NextRequest } from "next/server";
import { ZodError } from "zod";
import { authenticateRequest, jsonError, jsonSuccess } from "@/lib/utils/api";
import { updateAccountSchema } from "@/lib/schemas/account.schema";
import { createSupabaseServerClient } from "@/lib/supabase";
import { calculateAccountBalance } from "@/lib/utils/account.utils";
import type { AccountDetails, AccountWithBalance } from "@/types/account.types";
import type { Database } from "@/types/database.types";

type FinancialAccount = Database["public"]["Tables"]["financial_account"]["Row"];

/**
 * Get details of a specific financial account
 * Implements FR-ACC-002: View Financial Accounts
 * @see docs/api-design.md#get-apicountsid
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    // Authenticate user
    const user = await authenticateRequest(req);

    // Get account ID from params
    const { id } = await params;

    // Create Supabase client with user's access token
    const accessToken =
      req.cookies.get("pm_access_token")?.value ||
      req.headers.get("Authorization")?.replace("Bearer ", "");
    const supabase = createSupabaseServerClient({ accessToken });

    // Fetch account
    const { data: account, error } = await supabase
      .from("financial_account")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (error || !account) {
      return jsonError(404, "Account not found", "NOT_FOUND");
    }

    const typedAccount = account as FinancialAccount;

    // Calculate balance
    const balance = await calculateAccountBalance(id, user.id, accessToken);

    // Count transactions
    const { count } = await supabase
      .from("transaction")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .or(`from_account_id.eq.${id},to_account_id.eq.${id}`);

    const accountDetails: AccountDetails = {
      ...typedAccount,
      balance,
      transactionCount: count ?? 0,
    };

    return jsonSuccess({ account: accountDetails });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return jsonError(401, "Authentication required", "UNAUTHORIZED");
    }

    console.error("GET /api/accounts/[id] error:", error);
    return jsonError(500, "Internal server error", "SERVER_ERROR");
  }
}

/**
 * Update an existing financial account
 * Implements FR-ACC-003: Edit Financial Account
 * @see docs/api-design.md#put-apicountsid
 * @see docs/specifications.md#fr-acc-003-edit-financial-account
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    // Authenticate user
    const user = await authenticateRequest(req);

    // Get account ID from params
    const { id } = await params;

    // Parse and validate request body
    const body = await req.json();
    const validatedData = updateAccountSchema.parse(body);

    // Create Supabase client with user's access token
    const accessToken =
      req.cookies.get("pm_access_token")?.value ||
      req.headers.get("Authorization")?.replace("Bearer ", "");
    const supabase = createSupabaseServerClient({ accessToken });

    // Check if account exists and belongs to user
    const { data: existingAccount, error: fetchError } = await supabase
      .from("financial_account")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !existingAccount) {
      return jsonError(404, "Account not found", "NOT_FOUND");
    }

    // Check if account has transactions
    const { count } = await supabase
      .from("transaction")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .or(`from_account_id.eq.${id},to_account_id.eq.${id}`);

    const hasTransactions = (count ?? 0) > 0;

    // Build update object
    const updateData: any = {};
    if (validatedData.name !== undefined) {
      updateData.name = validatedData.name;
    }
    if (validatedData.type !== undefined) {
      updateData.type = validatedData.type;
    }

    // Update account
    const { data: updatedAccount, error: updateError } = await supabase
      .from("financial_account")
      .update(updateData)
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (updateError || !updatedAccount) {
      console.error("Error updating account:", updateError);
      return jsonError(500, "Failed to update account", "SERVER_ERROR");
    }

    const typedUpdatedAccount = updatedAccount as FinancialAccount;

    // Calculate balance
    const balance = await calculateAccountBalance(id, user.id, accessToken);

    const accountWithBalance: AccountWithBalance = {
      ...typedUpdatedAccount,
      balance,
    };

    return jsonSuccess({ account: accountWithBalance }, "Account updated successfully");
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return jsonError(401, "Authentication required", "UNAUTHORIZED");
    }

    if (error instanceof ZodError) {
      return jsonError(400, "Validation failed", "VALIDATION_ERROR");
    }

    console.error("PUT /api/accounts/[id] error:", error);
    return jsonError(500, "Internal server error", "SERVER_ERROR");
  }
}

/**
 * Delete a financial account
 * Implements FR-ACC-004: Delete Financial Account
 * @see docs/api-design.md#delete-apicountsid
 * @see docs/specifications.md#fr-acc-004-delete-financial-account
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    // Authenticate user
    const user = await authenticateRequest(req);

    // Get account ID from params
    const { id } = await params;

    // Create Supabase client with user's access token
    const accessToken =
      req.cookies.get("pm_access_token")?.value ||
      req.headers.get("Authorization")?.replace("Bearer ", "");
    const supabase = createSupabaseServerClient({ accessToken });

    // Check if account exists and belongs to user
    const { data: account, error: fetchError } = await supabase
      .from("financial_account")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !account) {
      return jsonError(404, "Account not found", "NOT_FOUND");
    }

    // Check if account has transactions
    const { count } = await supabase
      .from("transaction")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .or(`from_account_id.eq.${id},to_account_id.eq.${id}`);

    const transactionCount = count ?? 0;

    // Delete all transactions associated with this account (cascade delete)
    if (transactionCount > 0) {
      const { error: deleteTransactionsError } = await supabase
        .from("transaction")
        .delete()
        .eq("user_id", user.id)
        .or(`from_account_id.eq.${id},to_account_id.eq.${id}`);

      if (deleteTransactionsError) {
        console.error("Error deleting transactions:", deleteTransactionsError);
        return jsonError(500, "Failed to delete associated transactions", "SERVER_ERROR");
      }
    }

    // Delete account
    const { error: deleteError } = await supabase
      .from("financial_account")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (deleteError) {
      console.error("Error deleting account:", deleteError);
      return jsonError(500, "Failed to delete account", "SERVER_ERROR");
    }

    return jsonSuccess(
      { transactionCount },
      transactionCount > 0
        ? `Account and ${transactionCount} associated transaction(s) deleted successfully`
        : "Account deleted successfully",
    );
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return jsonError(401, "Authentication required", "UNAUTHORIZED");
    }

    console.error("DELETE /api/accounts/[id] error:", error);
    return jsonError(500, "Internal server error", "SERVER_ERROR");
  }
}
