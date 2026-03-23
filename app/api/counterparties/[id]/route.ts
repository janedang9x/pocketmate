import { NextRequest } from "next/server";
import { ZodError } from "zod";
import { authenticateRequest, jsonError, jsonSuccess } from "@/lib/utils/api";
import { updateCounterpartySchema } from "@/lib/schemas/counterparty.schema";
import { createSupabaseServerClient } from "@/lib/supabase";
import type { Counterparty } from "@/types/counterparty.types";
import type { Database } from "@/types/database.types";

type CounterpartyRow = Database["public"]["Tables"]["counterparty"]["Row"];

/**
 * Update a counterparty
 * Implements FR-CPT-003: Update Counterparty
 * @see docs/api-design.md#put-apicounterpartiesid
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await authenticateRequest(req);

    const { id } = await params;

    const body = await req.json();
    const validatedData = updateCounterpartySchema.parse(body);

    const accessToken =
      req.cookies.get("pm_access_token")?.value ||
      req.headers.get("Authorization")?.replace("Bearer ", "");
    const supabase = createSupabaseServerClient({ accessToken });

    const { data: existingCounterparty, error: fetchError } = await supabase
      .from("counterparty")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !existingCounterparty) {
      return jsonError(404, "Counterparty not found", "NOT_FOUND");
    }

    const counterpartyRow = existingCounterparty as CounterpartyRow;

    // Check for duplicate name if changing
    if (validatedData.name.trim() !== counterpartyRow.name) {
      const duplicateCheck = await supabase
        .from("counterparty")
        .select("*")
        .eq("name", validatedData.name.trim())
        .eq("user_id", user.id)
        .neq("id", id)
        .maybeSingle();

      if (duplicateCheck.data) {
        return jsonError(409, "Counterparty with this name already exists", "DUPLICATE_ERROR");
      }
    }

    const updateData: Partial<CounterpartyRow> = {
      name: validatedData.name.trim(),
    };

    const { data: updatedCounterparty, error: updateError } = await supabase
      .from("counterparty")
      .update(updateData)
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (updateError || !updatedCounterparty) {
      console.error("Error updating counterparty:", updateError);
      return jsonError(500, "Failed to update counterparty", "SERVER_ERROR");
    }

    const typedCounterparty = updatedCounterparty as Counterparty;

    return jsonSuccess({ counterparty: typedCounterparty }, "Counterparty updated successfully");
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return jsonError(401, "Authentication required", "UNAUTHORIZED");
    }

    if (error instanceof ZodError) {
      return jsonError(400, "Validation failed", "VALIDATION_ERROR");
    }

    console.error("PUT /api/counterparties/[id] error:", error);
    return jsonError(500, "Internal server error", "SERVER_ERROR");
  }
}

/**
 * Delete a counterparty
 * Implements FR-CPT-004: Delete Counterparty
 * @see docs/api-design.md#delete-apicounterpartiesid
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

    const { data: counterparty, error: fetchError } = await supabase
      .from("counterparty")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !counterparty) {
      return jsonError(404, "Counterparty not found", "NOT_FOUND");
    }

    const { count: transactionCount } = await supabase
      .from("transaction")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("counterparty_id", id);

    if (transactionCount && transactionCount > 0) {
      return jsonError(
        400,
        `Cannot delete counterparty: ${transactionCount} transaction(s) are using this counterparty`,
        "FOREIGN_KEY_ERROR",
      );
    }

    const { error: deleteError } = await supabase
      .from("counterparty")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (deleteError) {
      console.error("Error deleting counterparty:", deleteError);
      return jsonError(500, "Failed to delete counterparty", "SERVER_ERROR");
    }

    return jsonSuccess(null, "Counterparty deleted successfully");
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return jsonError(401, "Authentication required", "UNAUTHORIZED");
    }

    console.error("DELETE /api/counterparties/[id] error:", error);
    return jsonError(500, "Internal server error", "SERVER_ERROR");
  }
}
