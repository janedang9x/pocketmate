import { NextRequest } from "next/server";
import { ZodError } from "zod";
import { authenticateRequest, jsonError, jsonSuccess } from "@/lib/utils/api";
import { createExpenseCategorySchema } from "@/lib/schemas/category.schema";
import { createSupabaseServerClient } from "@/lib/supabase";
import type { ExpenseCategory, ExpenseCategoryWithChildren } from "@/types/category.types";
import type { Database } from "@/types/database.types";

type ExpenseCategoryRow = Database["public"]["Tables"]["expense_categories"]["Row"];

/**
 * List all expense categories (default + user custom) in hierarchical structure
 * Implements FR-CAT-001: View Default Categories
 * @see docs/api-design.md#get-apicategoriesexpense
 * @see docs/specifications.md#fr-cat-001-view-default-categories
 */
export async function GET(req: NextRequest) {
  try {
    // Authenticate user
    const user = await authenticateRequest(req);

    // Create Supabase client with user's access token
    const accessToken =
      req.cookies.get("pm_access_token")?.value ||
      req.headers.get("Authorization")?.replace("Bearer ", "");
    const supabase = createSupabaseServerClient({ accessToken });

    // Fetch all categories: default (user_id IS NULL) + user's custom (user_id = user.id)
    const { data: categories, error } = await supabase
      .from("expense_categories")
      .select("*")
      .or(`user_id.is.null,user_id.eq.${user.id}`)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching expense categories:", error);
      return jsonError(500, "Failed to fetch categories", "SERVER_ERROR");
    }

    if (!categories || categories.length === 0) {
      return jsonSuccess({ categories: [] });
    }

    const typedCategories = categories as ExpenseCategoryRow[];

    // Build hierarchical structure: parent categories with children
    const parentCategories = typedCategories.filter((cat) => cat.parent_category_id === null);
    const childCategories = typedCategories.filter((cat) => cat.parent_category_id !== null);

    const categoriesWithChildren: ExpenseCategoryWithChildren[] = parentCategories.map((parent) => {
      const children = childCategories.filter(
        (child) => child.parent_category_id === parent.id,
      ) as ExpenseCategory[];

      return {
        ...parent,
        children,
        isDefault: parent.user_id === null,
      };
    });

    return jsonSuccess({ categories: categoriesWithChildren });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return jsonError(401, "Authentication required", "UNAUTHORIZED");
    }

    console.error("GET /api/categories/expense error:", error);
    return jsonError(500, "Internal server error", "SERVER_ERROR");
  }
}

/**
 * Create a custom expense category
 * Implements FR-CAT-002: Create Custom Category
 * @see docs/api-design.md#post-apicategoriesexpense
 * @see docs/specifications.md#fr-cat-002-create-custom-category
 */
export async function POST(req: NextRequest) {
  try {
    // Authenticate user
    const user = await authenticateRequest(req);

    // Parse and validate request body
    const body = await req.json();
    const validatedData = createExpenseCategorySchema.parse(body);

    // Create Supabase client with user's access token
    const accessToken =
      req.cookies.get("pm_access_token")?.value ||
      req.headers.get("Authorization")?.replace("Bearer ", "");
    const supabase = createSupabaseServerClient({ accessToken });

    // If parentCategoryId is provided, verify it exists and is accessible
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

      // Ensure parent category is actually a parent (has no parent itself)
      if (parentCategory.parent_category_id !== null) {
        return jsonError(400, "Cannot create child category under a child category", "VALIDATION_ERROR");
      }
    }

    // Check for duplicate name at the same level (same parent or both root)
    const duplicateCheck = await supabase
      .from("expense_categories")
      .select("*")
      .eq("name", validatedData.name.trim())
      .eq("user_id", user.id)
      .eq("parent_category_id", validatedData.parentCategoryId || null)
      .maybeSingle();

    if (duplicateCheck.data) {
      return jsonError(409, "Category with this name already exists at this level", "DUPLICATE_ERROR");
    }

    // Create category
    const { data: category, error: categoryError } = await supabase
      .from("expense_categories")
      .insert({
        user_id: user.id,
        name: validatedData.name.trim(),
        parent_category_id: validatedData.parentCategoryId || null,
      })
      .select()
      .single();

    if (categoryError || !category) {
      console.error("Error creating expense category:", categoryError);
      return jsonError(500, "Failed to create category", "SERVER_ERROR");
    }

    const typedCategory = category as ExpenseCategory;

    return jsonSuccess({ category: typedCategory }, "Category created successfully", 201);
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return jsonError(401, "Authentication required", "UNAUTHORIZED");
    }

    if (error instanceof ZodError) {
      return jsonError(400, "Validation failed", "VALIDATION_ERROR");
    }

    // Handle PostgreSQL unique constraint violation
    if (error && typeof error === "object" && "code" in error && error.code === "23505") {
      return jsonError(409, "Category with this name already exists", "DUPLICATE_ERROR");
    }

    console.error("POST /api/categories/expense error:", error);
    return jsonError(500, "Internal server error", "SERVER_ERROR");
  }
}
