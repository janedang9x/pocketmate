import { NextRequest } from "next/server";
import { authenticateRequest, jsonError, jsonSuccess } from "@/lib/utils/api";
import { createSupabaseServerClient } from "@/lib/supabase";
import {
  addBalancesToAccounts,
  calculateAccountBalances,
} from "@/lib/utils/account.utils";
import type { Database } from "@/types/database.types";
import type {
  FinancialStatementAccountRow,
  FinancialStatementCounterpartyRow,
} from "@/types/report.types";

type FinancialAccountRow = Database["public"]["Tables"]["financial_account"]["Row"];
type TransactionRow = Database["public"]["Tables"]["transaction"]["Row"];
type CounterpartyRow = Database["public"]["Tables"]["counterparty"]["Row"];

/**
 * Financial statement report (FR-RPT-004).
 * @see docs/api-design.md#get-apireportsstatement
 */
export async function GET(req: NextRequest) {
  try {
    const user = await authenticateRequest(req);

    const accessToken =
      req.cookies.get("pm_access_token")?.value ||
      req.headers.get("Authorization")?.replace("Bearer ", "");
    const supabase = createSupabaseServerClient({ accessToken });

    const [{ data: accounts, error: accountsError }, { data: counterparties, error: cpError }] =
      await Promise.all([
        supabase.from("financial_account").select("*").eq("user_id", user.id),
        supabase.from("counterparty").select("id, name").eq("user_id", user.id),
      ]);

    if (accountsError || cpError) {
      console.error("Financial statement base fetch error:", accountsError ?? cpError);
      return jsonError(500, "Failed to build financial statement", "SERVER_ERROR");
    }

    const typedAccounts = (accounts ?? []) as FinancialAccountRow[];
    const balanceMap = await calculateAccountBalances(typedAccounts, user.id, accessToken);
    const accountsWithBalance = addBalancesToAccounts(typedAccounts, balanceMap);

    const accountRows: FinancialStatementAccountRow[] = accountsWithBalance.map((account) => ({
      id: account.id,
      name: account.name,
      type: account.type,
      balance: account.balance,
      currency: account.currency,
    }));

    const totalAssets = accountRows.reduce((sum, row) => sum + row.balance, 0);

    const { data: borrowTransactions, error: borrowError } = await supabase
      .from("transaction")
      .select("counterparty_id, from_account_id, to_account_id, amount")
      .eq("user_id", user.id)
      .eq("type", "Borrow")
      .not("counterparty_id", "is", null);

    if (borrowError) {
      console.error("Financial statement borrow fetch error:", borrowError);
      return jsonError(500, "Failed to build financial statement", "SERVER_ERROR");
    }

    const cpMap = new Map(
      ((counterparties ?? []) as Pick<CounterpartyRow, "id" | "name">[]).map((cp) => [cp.id, cp]),
    );
    const borrowedBuckets = new Map<string, number>();
    const lentBuckets = new Map<string, number>();

    for (const tx of (borrowTransactions ?? []) as Pick<
      TransactionRow,
      "counterparty_id" | "from_account_id" | "to_account_id" | "amount"
    >[]) {
      if (!tx.counterparty_id) continue;

      if (tx.to_account_id) {
        const prev = borrowedBuckets.get(tx.counterparty_id) ?? 0;
        borrowedBuckets.set(tx.counterparty_id, prev + tx.amount);
      }

      if (tx.from_account_id) {
        const prev = lentBuckets.get(tx.counterparty_id) ?? 0;
        lentBuckets.set(tx.counterparty_id, prev + tx.amount);
      }
    }

    function buildCounterpartyRows(
      buckets: Map<string, number>,
    ): FinancialStatementCounterpartyRow[] {
      return [...buckets.entries()]
        .map(([counterpartyId, amount]) => ({
          counterpartyId,
          counterpartyName: cpMap.get(counterpartyId)?.name ?? "Unknown counterparty",
          amount,
        }))
        .sort((a, b) => b.amount - a.amount);
    }

    const borrowedFrom = buildCounterpartyRows(borrowedBuckets);
    const lentTo = buildCounterpartyRows(lentBuckets);
    const totalBorrowed = borrowedFrom.reduce((sum, row) => sum + row.amount, 0);
    const totalLent = lentTo.reduce((sum, row) => sum + row.amount, 0);
    const totalLiabilities = totalBorrowed - totalLent;
    const netWorth = totalAssets - totalLiabilities;

    return jsonSuccess({
      assets: {
        accounts: accountRows.sort((a, b) => b.balance - a.balance),
        totalAssets,
      },
      liabilities: {
        borrowedFrom,
        lentTo,
        totalLiabilities,
      },
      netWorth,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return jsonError(401, "Authentication required", "UNAUTHORIZED");
    }

    console.error("GET /api/reports/statement error:", error);
    return jsonError(500, "Internal server error", "SERVER_ERROR");
  }
}
