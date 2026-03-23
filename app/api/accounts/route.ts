import { NextRequest } from "next/server";
import { ZodError } from "zod";
import { authenticateRequest, jsonError, jsonSuccess } from "@/lib/utils/api";
import { accountQuerySchema } from "@/lib/schemas/account.schema";
import { createSupabaseServerClient } from "@/lib/supabase";
import {
  calculateAccountBalances,
  addBalancesToAccounts,
} from "@/lib/utils/account.utils";
import type { AccountWithBalance } from "@/types/account.types";
import type { Database } from "@/types/database.types";

type FinancialAccount = Database["public"]["Tables"]["financial_account"]["Row"];

/**
 * List all financial accounts for the authenticated user
 * Implements FR-ACC-002: View Financial Accounts
 * @see docs/api-design.md#get-apicounts
 * @see docs/specifications.md#fr-acc-002-view-financial-accounts
 */
export async function GET(req: NextRequest) {
  try {
    // Authenticate user
    const user = await authenticateRequest(req);

    // Parse and validate query parameters
    const { searchParams } = new URL(req.url);
    const queryParams = {
      type: searchParams.get("type") || undefined,
      search: searchParams.get("search") || undefined,
    };

    const validatedQuery = accountQuerySchema.parse(queryParams);

    // Create Supabase client with user's access token
    const accessToken =
      req.cookies.get("pm_access_token")?.value ||
      req.headers.get("Authorization")?.replace("Bearer ", "");
    const supabase = createSupabaseServerClient({ accessToken });

    // Build query
    let query = supabase.from("financial_account").select("*").eq("user_id", user.id);

    // Apply filters
    if (validatedQuery.type) {
      query = query.eq("type", validatedQuery.type);
    }

    if (validatedQuery.search) {
      query = query.ilike("name", `%${validatedQuery.search}%`);
    }

    // Execute query
    const { data: accounts, error } = await query.order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching accounts:", error);
      return jsonError(500, "Failed to fetch accounts", "SERVER_ERROR");
    }

    if (!accounts || accounts.length === 0) {
      return jsonSuccess({ accounts: [] });
    }

    // Type cast accounts to FinancialAccount[]
    const typedAccounts = accounts as FinancialAccount[];

    // Calculate balances for all accounts
    const balances = await calculateAccountBalances(typedAccounts, user.id, accessToken);

    // Add balances to accounts
    const accountsWithBalance = addBalancesToAccounts(typedAccounts, balances) as AccountWithBalance[];

    return jsonSuccess({ accounts: accountsWithBalance });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return jsonError(401, "Authentication required", "UNAUTHORIZED");
    }

    if (error instanceof ZodError) {
      return jsonError(400, "Invalid query parameters", "VALIDATION_ERROR");
    }

    console.error("GET /api/accounts error:", error);
    return jsonError(500, "Internal server error", "SERVER_ERROR");
  }
}

/**
 * Create a new financial account
 * Implements FR-ACC-001: Create Financial Account
 * @see docs/api-design.md#post-apicounts
 * @see docs/specifications.md#fr-acc-001-create-financial-account
 */
export async function POST(req: NextRequest) {
  try {
    // Authenticate user
    const user = await authenticateRequest(req);

    // Parse and validate request body
    const body = await req.json();
    const { createAccountSchema } = await import("@/lib/schemas/account.schema");
    const validatedData = createAccountSchema.parse(body);

    // Create Supabase client with user's access token
    const accessToken =
      req.cookies.get("pm_access_token")?.value ||
      req.headers.get("Authorization")?.replace("Bearer ", "");
    const supabase = createSupabaseServerClient({ accessToken });

    // Create account
    const { data: account, error: accountError } = await supabase
      .from("financial_account")
      .insert({
        user_id: user.id,
        name: validatedData.name,
        type: validatedData.type,
        currency: validatedData.currency,
      })
      .select()
      .single();

    if (accountError || !account) {
      console.error("Error creating account:", accountError);

      // Surface CHECK constraint failures more clearly (e.g. missing 'Others' in DB constraint)
      if (accountError && "code" in accountError && accountError.code === "23514") {
        return jsonError(
          400,
          "Invalid account type for current database constraint. Make sure the financial_account.type CHECK constraint includes 'Others'.",
          "VALIDATION_ERROR",
        );
      }

      return jsonError(500, "Failed to create account", "SERVER_ERROR");
    }

    const typedAccount = account as FinancialAccount;

    // Create initial transaction for opening balance
    // This represents the opening balance as the first transaction
    if (validatedData.openingBalance !== 0) {
      const transactionType = validatedData.openingBalance > 0 ? "Income" : "Expense";
      const transactionData: any = {
        user_id: user.id,
        type: transactionType,
        amount: Math.abs(validatedData.openingBalance),
        currency: validatedData.currency,
        date_time: new Date().toISOString(),
        details: "Opening balance",
      };

      if (transactionType === "Income") {
        transactionData.to_account_id = typedAccount.id;
      } else {
        transactionData.from_account_id = typedAccount.id;
      }

      const { error: transactionError } = await supabase
        .from("transaction")
        .insert(transactionData);

      if (transactionError) {
        console.error("Error creating opening balance transaction:", transactionError);
        // Rollback account creation
        await supabase.from("financial_account").delete().eq("id", typedAccount.id);
        return jsonError(500, "Failed to create opening balance transaction", "SERVER_ERROR");
      }
    }

    // Calculate balance (should equal opening balance)
    const balance = await import("@/lib/utils/account.utils").then((m) =>
      m.calculateAccountBalance(typedAccount.id, user.id, accessToken),
    );

    const accountWithBalance: AccountWithBalance = {
      ...typedAccount,
      balance,
    };

    return jsonSuccess({ account: accountWithBalance }, "Account created successfully", 201);
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return jsonError(401, "Authentication required", "UNAUTHORIZED");
    }

    if (error instanceof ZodError) {
      return jsonError(400, "Validation failed", "VALIDATION_ERROR");
    }

    console.error("POST /api/accounts error:", error);
    return jsonError(500, "Internal server error", "SERVER_ERROR");
  }
}
