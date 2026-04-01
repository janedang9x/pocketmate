import { NextRequest } from "next/server";
import { ZodError } from "zod";
import { authenticateRequest, jsonError, jsonSuccess } from "@/lib/utils/api";
import { updateExpenseCategorySchema } from "@/lib/schemas/category.schema";
import { createSupabaseServerClient } from "@/lib/supabase";
import {
  deleteExpenseCategoryByHidingDefault,
  fetchHiddenDefaultCategoryIds,
  forkDefaultExpenseChild,
  forkDefaultExpenseParent,
} from "@/lib/category-defaults";
import type { ExpenseCategory } from "@/types/category.types";
import type { Database } from "@/types/database.types";

type ExpenseCategoryRow = Database["public"]["Tables"]["expense_categories"]["Row"];

/**
 * Update an expense category
 * Implements FR-CAT-003: Edit Category
 * @see docs/api-design.md#put-apicategoriesexpenseid
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
    const validatedData = updateExpenseCategorySchema.parse(body);

    // Create Supabase client with user's access token
    const accessToken =
      req.cookies.get("pm_access_token")?.value ||
      req.headers.get("Authorization")?.replace("Bearer ", "");
    const supabase = createSupabaseServerClient({ accessToken });

    // Check if category exists and is accessible (default or user's custom)
    const { data: existingCategory, error: fetchError } = await supabase
      .from("expense_categories")
      .select("*")
      .eq("id", id)
      .or(`user_id.is.null,user_id.eq.${user.id}`)
      .single();

    if (fetchError || !existingCategory) {
      return jsonError(404, "Category not found", "NOT_FOUND");
    }

    const categoryRow = existingCategory as ExpenseCategoryRow;

    if (categoryRow.user_id === null) {
      const hiddenIds = await fetchHiddenDefaultCategoryIds(supabase, user.id, "expense");
      const forkResult =
        categoryRow.parent_category_id === null
          ? await forkDefaultExpenseParent(
              supabase,
              user.id,
              categoryRow,
              validatedData,
              hiddenIds,
            )
          : await forkDefaultExpenseChild(
              supabase,
              user.id,
              categoryRow,
              validatedData,
              hiddenIds,
            );


      if (forkResult.error || !forkResult.category) {
        const msg = forkResult.error ?? "Failed to update category";
        const code =
          msg.includes("already exists") || msg.includes("duplicate")
            ? "DUPLICATE_ERROR"
            : msg.includes("Missing required table user_hidden_default_categories")
              ? "SERVER_ERROR"
            : msg === "Parent category not found"
              ? "NOT_FOUND"
              : msg.includes("Cannot ")
                ? "VALIDATION_ERROR"
                : "SERVER_ERROR";
        const status =
          code === "DUPLICATE_ERROR"
            ? 409
            : code === "NOT_FOUND"
              ? 404
              : code === "VALIDATION_ERROR"
                ? 400
                : 500;
        return jsonError(status, msg, code);
      }

      return jsonSuccess({ category: forkResult.category }, "Category updated successfully");
    }

    // If parentCategoryId is being changed, verify it exists and is accessible
    if (validatedData.parentCategoryId !== undefined && validatedData.parentCategoryId !== categoryRow.parent_category_id) {
      if (validatedData.parentCategoryId) {
        const { data: parentCategory, error: parentError } = await supabase
          .from("expense_categories")
          .select("*")
          .eq("id", validatedData.parentCategoryId)
          .or(`user_id.is.null,user_id.eq.${user.id}`)
          .single();

        if (parentError || !parentCategory) {
          return jsonError(404, "Parent category not found", "NOT_FOUND");
        }

        const parentRow = parentCategory as ExpenseCategoryRow;

        // Ensure parent category is actually a parent
        if (parentRow.parent_category_id !== null) {
          return jsonError(400, "Cannot move category under a child category", "VALIDATION_ERROR");
        }

        // Prevent circular reference (cannot be its own parent)
        if (parentRow.id === id) {
          return jsonError(400, "Category cannot be its own parent", "VALIDATION_ERROR");
        }
      }
    }

    // Check for duplicate name at the same level if name is being changed
    if (validatedData.name !== undefined && validatedData.name.trim() !== categoryRow.name) {
      const newParentId = validatedData.parentCategoryId !== undefined 
        ? validatedData.parentCategoryId 
        : categoryRow.parent_category_id;

      let duplicateQuery = supabase
        .from("expense_categories")
        .select("*")
        .eq("name", validatedData.name.trim())
        .eq("user_id", user.id)
        .neq("id", id);
      duplicateQuery =
        newParentId != null
          ? duplicateQuery.eq("parent_category_id", newParentId)
          : duplicateQuery.is("parent_category_id", null);

      const duplicateCheck = await duplicateQuery.maybeSingle();

      if (duplicateCheck.data) {
        return jsonError(409, "Category with this name already exists at this level", "DUPLICATE_ERROR");
      }
    }

    // Build update object
    const updateData: Partial<ExpenseCategoryRow> = {};
    if (validatedData.name !== undefined) {
      updateData.name = validatedData.name.trim();
    }
    if (validatedData.parentCategoryId !== undefined) {
      updateData.parent_category_id = validatedData.parentCategoryId;
    }
    if (validatedData.icon !== undefined) {
      updateData.icon = validatedData.icon;
    }

    // Update category
    const { data: updatedCategory, error: updateError } = await supabase
      .from("expense_categories")
      .update(updateData)
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (updateError || !updatedCategory) {
      console.error("Error updating expense category:", updateError);
      return jsonError(500, "Failed to update category", "SERVER_ERROR");
    }

    const typedCategory = updatedCategory as ExpenseCategory;

    return jsonSuccess({ category: typedCategory }, "Category updated successfully");
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return jsonError(401, "Authentication required", "UNAUTHORIZED");
    }

    if (error instanceof ZodError) {
      return jsonError(400, "Validation failed", "VALIDATION_ERROR");
    }

    console.error("PUT /api/categories/expense/[id] error:", error);
    return jsonError(500, "Internal server error", "SERVER_ERROR");
  }
}

/**
 * Delete an expense category
 * Implements FR-CAT-004: Delete Category
 * @see docs/api-design.md#delete-apicategoriesexpenseid
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
      .from("expense_categories")
      .select("*")
      .eq("id", id)
      .or(`user_id.is.null,user_id.eq.${user.id}`)
      .single();

    if (fetchError || !category) {
      return jsonError(404, "Category not found", "NOT_FOUND");
    }

    const deleteCategoryRow = category as ExpenseCategoryRow;

    if (deleteCategoryRow.user_id === null) {
      const del = await deleteExpenseCategoryByHidingDefault(supabase, user.id, deleteCategoryRow);
      if (del.error) {
        const code =
          del.error.includes("transaction(s)") || del.error.includes("sub-categor")
            ? del.error.includes("sub-categor")
              ? "FOREIGN_KEY_ERROR"
              : "FOREIGN_KEY_ERROR"
            : "SERVER_ERROR";
        const status = code === "FOREIGN_KEY_ERROR" ? 400 : 500;
        return jsonError(status, del.error, code);
      }
      return jsonSuccess(null, "Category deleted successfully");
    }

    // Check if category has transactions
    const { count: transactionCount } = await supabase
      .from("transaction")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("expense_category_id", id);

    if (transactionCount && transactionCount > 0) {
      return jsonError(
        400,
        `Cannot delete category: ${transactionCount} transaction(s) are using this category`,
        "FOREIGN_KEY_ERROR",
      );
    }

    // Check if category has child categories (any owner — default or custom)
    const { count: childCount } = await supabase
      .from("expense_categories")
      .select("*", { count: "exact", head: true })
      .eq("parent_category_id", id);

    if (childCount && childCount > 0) {
      return jsonError(
        400,
        `Cannot delete category: ${childCount} child categor(ies) exist. Please delete or reassign them first`,
        "FOREIGN_KEY_ERROR",
      );
    }

    // Delete category
    const { error: deleteError } = await supabase
      .from("expense_categories")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (deleteError) {
      console.error("Error deleting expense category:", deleteError);
      return jsonError(500, "Failed to delete category", "SERVER_ERROR");
    }

    return jsonSuccess(null, "Category deleted successfully");
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return jsonError(401, "Authentication required", "UNAUTHORIZED");
    }

    console.error("DELETE /api/categories/expense/[id] error:", error);
    return jsonError(500, "Internal server error", "SERVER_ERROR");
  }
}
