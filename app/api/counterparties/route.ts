import { NextRequest } from "next/server";
import { ZodError } from "zod";
import { authenticateRequest, jsonError, jsonSuccess } from "@/lib/utils/api";
import { createCounterpartySchema } from "@/lib/schemas/counterparty.schema";
import { createSupabaseServerClient } from "@/lib/supabase";
import type { Counterparty } from "@/types/counterparty.types";
import type { Database } from "@/types/database.types";

type CounterpartyRow = Database["public"]["Tables"]["counterparty"]["Row"];

/**
 * List all counterparties for the authenticated user with transaction counts
 * Implements FR-CPT-002: List Counterparties
 * @see docs/api-design.md#get-apicounterparties
 */
export async function GET(req: NextRequest) {
  try {
    const user = await authenticateRequest(req);
    const { searchParams } = new URL(req.url);
    const includeCounts = searchParams.get("includeCounts") !== "false";

    const accessToken =
      req.cookies.get("pm_access_token")?.value ||
      req.headers.get("Authorization")?.replace("Bearer ", "");
    const supabase = createSupabaseServerClient({ accessToken });

    const { data: counterparties, error } = await supabase
      .from("counterparty")
      .select("*")
      .eq("user_id", user.id)
      .order("name", { ascending: true });

    if (error) {
      console.error("Error fetching counterparties:", error);
      return jsonError(500, "Failed to fetch counterparties", "SERVER_ERROR");
    }

    if (!counterparties || counterparties.length === 0) {
      return jsonSuccess({ counterparties: [] });
    }

    const typedCounterparties = counterparties as CounterpartyRow[];

    if (!includeCounts) {
      return jsonSuccess({ counterparties: typedCounterparties });
    }

    // Get transaction count for each counterparty
    const counterpartiesWithCount = await Promise.all(
      typedCounterparties.map(async (cp) => {
        const { count } = await supabase
          .from("transaction")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("counterparty_id", cp.id);

        return {
          ...cp,
          transaction_count: count ?? 0,
        };
      }),
    );

    return jsonSuccess({ counterparties: counterpartiesWithCount });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return jsonError(401, "Authentication required", "UNAUTHORIZED");
    }

    console.error("GET /api/counterparties error:", error);
    return jsonError(500, "Internal server error", "SERVER_ERROR");
  }
}

/**
 * Create a new counterparty
 * Implements FR-CPT-001: Create Counterparty
 * @see docs/api-design.md#post-apicounterparties
 */
export async function POST(req: NextRequest) {
  try {
    const user = await authenticateRequest(req);

    const body = await req.json();
    const validatedData = createCounterpartySchema.parse(body);

    const accessToken =
      req.cookies.get("pm_access_token")?.value ||
      req.headers.get("Authorization")?.replace("Bearer ", "");
    const supabase = createSupabaseServerClient({ accessToken });

    // Check for duplicate name
    const duplicateCheck = await supabase
      .from("counterparty")
      .select("*")
      .eq("name", validatedData.name.trim())
      .eq("user_id", user.id)
      .maybeSingle();

    if (duplicateCheck.data) {
      return jsonError(409, "Counterparty with this name already exists", "DUPLICATE_ERROR");
    }

    const { data: counterparty, error } = await supabase
      .from("counterparty")
      .insert({
        user_id: user.id,
        name: validatedData.name.trim(),
      })
      .select()
      .single();

    if (error || !counterparty) {
      console.error("Error creating counterparty:", error);
      return jsonError(500, "Failed to create counterparty", "SERVER_ERROR");
    }

    const typedCounterparty = counterparty as Counterparty;

    return jsonSuccess({ counterparty: typedCounterparty }, "Counterparty created successfully", 201);
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return jsonError(401, "Authentication required", "UNAUTHORIZED");
    }

    if (error instanceof ZodError) {
      return jsonError(400, "Validation failed", "VALIDATION_ERROR");
    }

    if (error && typeof error === "object" && "code" in error && error.code === "23505") {
      return jsonError(409, "Counterparty with this name already exists", "DUPLICATE_ERROR");
    }

    console.error("POST /api/counterparties error:", error);
    return jsonError(500, "Internal server error", "SERVER_ERROR");
  }
}
