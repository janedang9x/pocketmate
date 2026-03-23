import { NextRequest } from "next/server";
import { ZodError } from "zod";
import { authenticateRequest, jsonError, jsonSuccess } from "@/lib/utils/api";
import { updateIncomeCategorySchema } from "@/lib/schemas/category.schema";
import { createSupabaseServerClient } from "@/lib/supabase";
import type { IncomeCategory } from "@/types/category.types";
import type { Database } from "@/types/database.types";

type IncomeCategoryRow = Database["public"]["Tables"]["income_categories"]["Row"];

/**
 * Update an income category
 * Implements FR-CAT-003: Edit Category
 * @see docs/api-design.md#put-apicategoriesincomeid
 * @see docs/specifications.md#fr-cat-003-edit-category
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    // Authenticate user
    const user = await authenticateRequest(req);

    // Get category ID from params
    const { id } = await params;

    // Parse and validate request body
    const body = await req.json();
    const validatedData = updateIncomeCategorySchema.parse(body);

    // Create Supabase client with user's access token
    const accessToken =
      req.cookies.get("pm_access_token")?.value ||
      req.headers.get("Authorization")?.replace("Bearer ", "");
    const supabase = createSupabaseServerClient({ accessToken });

    // Check if category exists and is accessible (default or user's custom)
    const { data: existingCategory, error: fetchError } = await supabase
      .from("income_categories")
      .select("*")
      .eq("id", id)
      .or(`user_id.is.null,user_id.eq.${user.id}`)
      .single();

    if (fetchError || !existingCategory) {
      return jsonError(404, "Category not found", "NOT_FOUND");
    }

    const categoryRow = existingCategory as IncomeCategoryRow;

    // Cannot edit default categories
    if (categoryRow.user_id === null) {
      return jsonError(403, "Cannot edit default categories", "FORBIDDEN");
    }

    // Check for duplicate name if name is being changed
    if (validatedData.name !== undefined && validatedData.name.trim() !== categoryRow.name) {
      const duplicateCheck = await supabase
        .from("income_categories")
        .select("*")
        .eq("name", validatedData.name.trim())
        .eq("user_id", user.id)
        .neq("id", id)
        .maybeSingle();

      if (duplicateCheck.data) {
        return jsonError(409, "Category with this name already exists", "DUPLICATE_ERROR");
      }
    }

    // Build update object
    const updateData: Partial<IncomeCategoryRow> = {};
    if (validatedData.name !== undefined) {
      updateData.name = validatedData.name.trim();
    }

    // Update category
    const { data: updatedCategory, error: updateError } = await supabase
      .from("income_categories")
      .update(updateData)
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (updateError || !updatedCategory) {
      console.error("Error updating income category:", updateError);
      return jsonError(500, "Failed to update category", "SERVER_ERROR");
    }

    const typedCategory = updatedCategory as IncomeCategory;

    return jsonSuccess({ category: typedCategory }, "Category updated successfully");
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return jsonError(401, "Authentication required", "UNAUTHORIZED");
    }

    if (error instanceof ZodError) {
      return jsonError(400, "Validation failed", "VALIDATION_ERROR");
    }

    console.error("PUT /api/categories/income/[id] error:", error);
    return jsonError(500, "Internal server error", "SERVER_ERROR");
  }
}

/**
 * Delete an income category
 * Implements FR-CAT-004: Delete Category
 * @see docs/api-design.md#delete-apicategoriesincomeid
 * @see docs/specifications.md#fr-cat-004-delete-category
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    // Authenticate user
    const user = await authenticateRequest(req);

    // Get category ID from params
    const { id } = await params;

    // Create Supabase client with user's access token
    const accessToken =
      req.cookies.get("pm_access_token")?.value ||
      req.headers.get("Authorization")?.replace("Bearer ", "");
    const supabase = createSupabaseServerClient({ accessToken });

    // Check if category exists and is accessible
    const { data: category, error: fetchError } = await supabase
      .from("income_categories")
      .select("*")
      .eq("id", id)
      .or(`user_id.is.null,user_id.eq.${user.id}`)
      .single();

    if (fetchError || !category) {
      return jsonError(404, "Category not found", "NOT_FOUND");
    }

    const deleteCategoryRow = category as IncomeCategoryRow;

    // Cannot delete default categories
    if (deleteCategoryRow.user_id === null) {
      return jsonError(403, "Cannot delete default categories", "FORBIDDEN");
    }

    // Check if category has transactions
    const { count: transactionCount } = await supabase
      .from("transaction")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("income_category_id", id);

    if (transactionCount && transactionCount > 0) {
      return jsonError(
        400,
        `Cannot delete category: ${transactionCount} transaction(s) are using this category`,
        "FOREIGN_KEY_ERROR",
      );
    }

    // Delete category
    const { error: deleteError } = await supabase
      .from("income_categories")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (deleteError) {
      console.error("Error deleting income category:", deleteError);
      return jsonError(500, "Failed to delete category", "SERVER_ERROR");
    }

    return jsonSuccess(null, "Category deleted successfully");
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return jsonError(401, "Authentication required", "UNAUTHORIZED");
    }

    console.error("DELETE /api/categories/income/[id] error:", error);
    return jsonError(500, "Internal server error", "SERVER_ERROR");
  }
}
