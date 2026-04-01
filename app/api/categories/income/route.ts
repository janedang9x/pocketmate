import { NextRequest } from "next/server";
import { ZodError } from "zod";
import { authenticateRequest, jsonError, jsonSuccess } from "@/lib/utils/api";
import { createIncomeCategorySchema } from "@/lib/schemas/category.schema";
import { createSupabaseServerClient } from "@/lib/supabase";
import { fetchHiddenDefaultCategoryIds } from "@/lib/category-defaults";
import type { IncomeCategory } from "@/types/category.types";
import type { Database } from "@/types/database.types";

type IncomeCategoryRow = Database["public"]["Tables"]["income_categories"]["Row"];

/**
 * List all income categories (default + user custom)
 * Implements FR-CAT-001: View Default Categories
 * @see docs/api-design.md#get-apicategoriesincome
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
      .from("income_categories")
      .select("*")
      .or(`user_id.is.null,user_id.eq.${user.id}`)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching income categories:", error);
      return jsonError(500, "Failed to fetch categories", "SERVER_ERROR");
    }

    if (!categories || categories.length === 0) {
      return jsonSuccess({ categories: [] });
    }

    const hiddenIds = await fetchHiddenDefaultCategoryIds(supabase, user.id, "income");
    const typedCategories = (categories as IncomeCategoryRow[]).filter(
      (c) => !hiddenIds.has(c.id),
    );

    // Add isDefault flag to each category
    const categoriesWithFlags = typedCategories.map((cat) => ({
      ...cat,
      isDefault: cat.user_id === null,
    }));

    return jsonSuccess({ categories: categoriesWithFlags });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return jsonError(401, "Authentication required", "UNAUTHORIZED");
    }

    console.error("GET /api/categories/income error:", error);
    return jsonError(500, "Internal server error", "SERVER_ERROR");
  }
}

/**
 * Create a custom income category
 * Implements FR-CAT-002: Create Custom Category
 * @see docs/api-design.md#post-apicategoriesincome
 * @see docs/specifications.md#fr-cat-002-create-custom-category
 */
export async function POST(req: NextRequest) {
  try {
    // Authenticate user
    const user = await authenticateRequest(req);

    // Parse and validate request body
    const body = await req.json();
    const validatedData = createIncomeCategorySchema.parse(body);

    // Create Supabase client with user's access token
    const accessToken =
      req.cookies.get("pm_access_token")?.value ||
      req.headers.get("Authorization")?.replace("Bearer ", "");
    const supabase = createSupabaseServerClient({ accessToken });

    // Check for duplicate name
    const duplicateCheck = await supabase
      .from("income_categories")
      .select("*")
      .eq("name", validatedData.name.trim())
      .eq("user_id", user.id)
      .maybeSingle();

    if (duplicateCheck.data) {
      return jsonError(409, "Category with this name already exists", "DUPLICATE_ERROR");
    }

    // Create category
    const { data: category, error: categoryError } = await supabase
      .from("income_categories")
      .insert({
        user_id: user.id,
        name: validatedData.name.trim(),
        icon: validatedData.icon ?? null,
      })
      .select()
      .single();

    if (categoryError || !category) {
      console.error("Error creating income category:", categoryError);
      return jsonError(500, "Failed to create category", "SERVER_ERROR");
    }

    const typedCategory = category as IncomeCategory;

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

    console.error("POST /api/categories/income error:", error);
    return jsonError(500, "Internal server error", "SERVER_ERROR");
  }
}
