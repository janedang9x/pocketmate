import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import type { UpdateExpenseCategoryInput } from "@/lib/schemas/category.schema";
import type { ExpenseCategory, IncomeCategory } from "@/types/category.types";

type ExpenseCategoryRow = Database["public"]["Tables"]["expense_categories"]["Row"];
type IncomeCategoryRow = Database["public"]["Tables"]["income_categories"]["Row"];

export type CategoryKind = "expense" | "income";

const HIDDEN_TABLE_MISSING_MSG = "Missing required table user_hidden_default_categories. Please run latest database migrations.";

function isHiddenTableMissingErrorMessage(message: string | null | undefined): boolean {
  return Boolean(message && message.includes("user_hidden_default_categories"));
}

async function ensureHiddenDefaultTableAvailable(
  supabase: SupabaseClient<Database>,
  userId: string,
  kind: CategoryKind,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { error } = await supabase
    .from("user_hidden_default_categories")
    .select("category_id")
    .eq("user_id", userId)
    .eq("category_kind", kind)
    .limit(1);

  if (error && isHiddenTableMissingErrorMessage(error.message)) {
    return { ok: false, error: HIDDEN_TABLE_MISSING_MSG };
  }

  return { ok: true };
}

export async function fetchHiddenDefaultCategoryIds(
  supabase: SupabaseClient<Database>,
  userId: string,
  kind: CategoryKind,
): Promise<Set<string>> {
  const { data, error } = await supabase
    .from("user_hidden_default_categories")
    .select("category_id")
    .eq("user_id", userId)
    .eq("category_kind", kind);

  if (error || !data) {
    return new Set();
  }
  return new Set(data.map((r) => r.category_id));
}

export async function hideDefaultCategoryForUser(
  supabase: SupabaseClient<Database>,
  userId: string,
  categoryId: string,
  kind: CategoryKind,
): Promise<{ error: Error | null }> {
  const { error } = await supabase.from("user_hidden_default_categories").insert({
    user_id: userId,
    category_id: categoryId,
    category_kind: kind,
  });
  if (error?.code === "23505") {
    return { error: null };
  }
  return { error: error ? new Error(error.message) : null };
}

async function migrateExpenseTransactions(
  supabase: SupabaseClient<Database>,
  userId: string,
  fromId: string,
  toId: string,
) {
  await supabase
    .from("transaction")
    .update({ expense_category_id: toId })
    .eq("user_id", userId)
    .eq("expense_category_id", fromId);
}

async function migrateIncomeTransactions(
  supabase: SupabaseClient<Database>,
  userId: string,
  fromId: string,
  toId: string,
) {
  await supabase
    .from("transaction")
    .update({ income_category_id: toId })
    .eq("user_id", userId)
    .eq("income_category_id", fromId);
}

async function assertNoDuplicateExpenseNameAtLevel(
  supabase: SupabaseClient<Database>,
  userId: string,
  parentId: string | null,
  name: string,
  excludeCategoryIds: string[],
  hiddenIds: Set<string>,
): Promise<{ ok: true } | { ok: false }> {
  let q = supabase.from("expense_categories").select("id").eq("name", name.trim());
  if (parentId == null) {
    q = q.is("parent_category_id", null);
  } else {
    q = q.eq("parent_category_id", parentId);
  }
  q = q.or(`user_id.is.null,user_id.eq.${userId}`);
  const { data } = await q;
  const conflicting = (data ?? []).filter(
    (r) => !excludeCategoryIds.includes(r.id) && !hiddenIds.has(r.id),
  );
  if (conflicting.length > 0) {
    return { ok: false };
  }
  return { ok: true };
}

async function assertNoDuplicateIncomeName(
  supabase: SupabaseClient<Database>,
  userId: string,
  name: string,
  excludeCategoryIds: string[],
  hiddenIds: Set<string>,
): Promise<{ ok: true } | { ok: false }> {
  const { data } = await supabase
    .from("income_categories")
    .select("id")
    .eq("name", name.trim())
    .or(`user_id.is.null,user_id.eq.${userId}`);

  const conflicting = (data ?? []).filter(
    (r) => !excludeCategoryIds.includes(r.id) && !hiddenIds.has(r.id),
  );
  if (conflicting.length > 0) {
    return { ok: false };
  }
  return { ok: true };
}

/**
 * Fork a shared default expense child into a user-owned row and hide the old one.
 */
export async function forkDefaultExpenseChild(
  supabase: SupabaseClient<Database>,
  userId: string,
  categoryRow: ExpenseCategoryRow,
  validatedData: UpdateExpenseCategoryInput,
  hiddenIds: Set<string>,
): Promise<{ category: ExpenseCategory | null; error: string | null }> {
  const tableCheck = await ensureHiddenDefaultTableAvailable(supabase, userId, "expense");
  if (!tableCheck.ok) {
    return { category: null, error: tableCheck.error };
  }

  const finalName =
    validatedData.name !== undefined ? validatedData.name.trim() : categoryRow.name;
  const finalParent =
    validatedData.parentCategoryId !== undefined
      ? validatedData.parentCategoryId
      : categoryRow.parent_category_id;

  if (validatedData.parentCategoryId !== undefined && validatedData.parentCategoryId !== null) {
    const { data: parentCategory, error: parentError } = await supabase
      .from("expense_categories")
      .select("*")
      .eq("id", validatedData.parentCategoryId)
      .or(`user_id.is.null,user_id.eq.${userId}`)
      .single();

    if (parentError || !parentCategory) {
      return { category: null, error: "Parent category not found" };
    }

    const parentRow = parentCategory as ExpenseCategoryRow;
    if (parentRow.parent_category_id !== null) {
      return {
        category: null,
        error: "Cannot move category under a child category",
      };
    }
    if (parentRow.id === categoryRow.id) {
      return {
        category: null,
        error: "Category cannot be its own parent",
      };
    }
  }

  const dup = await assertNoDuplicateExpenseNameAtLevel(
    supabase,
    userId,
    finalParent,
    finalName,
    [categoryRow.id],
    hiddenIds,
  );
  if (!dup.ok) {
    let existingQuery = supabase
      .from("expense_categories")
      .select("*")
      .eq("user_id", userId)
      .eq("name", finalName);
    existingQuery =
      finalParent != null
        ? existingQuery.eq("parent_category_id", finalParent)
        : existingQuery.is("parent_category_id", null);
    const { data: existingUserCategory } = await existingQuery.maybeSingle();

    if (existingUserCategory) {
      const existingRow = existingUserCategory as ExpenseCategoryRow;
      await migrateExpenseTransactions(supabase, userId, categoryRow.id, existingRow.id);
      const { error: hideErr } = await hideDefaultCategoryForUser(
        supabase,
        userId,
        categoryRow.id,
        "expense",
      );
      if (hideErr) {
        return { category: null, error: hideErr.message };
      }
      return { category: existingRow as ExpenseCategory, error: null };
    }

    return {
      category: null,
      error: "Category with this name already exists at this level",
    };
  }

  const { data: inserted, error: insertError } = await supabase
    .from("expense_categories")
    .insert({
      user_id: userId,
      name: finalName,
      parent_category_id: finalParent,
      icon: validatedData.icon ?? categoryRow.icon,
    })
    .select()
    .single();

  if (insertError || !inserted) {
    console.error("forkDefaultExpenseChild insert:", insertError);
    return { category: null, error: "Failed to create category" };
  }

  const insertedRow = inserted as ExpenseCategoryRow;
  await migrateExpenseTransactions(supabase, userId, categoryRow.id, insertedRow.id);

  const { error: hideErr } = await hideDefaultCategoryForUser(
    supabase,
    userId,
    categoryRow.id,
    "expense",
  );
  if (hideErr) {
    return { category: null, error: hideErr.message };
  }

  return { category: insertedRow as ExpenseCategory, error: null };
}

/**
 * Fork a shared default expense parent (and all default children) into user-owned rows.
 */
export async function forkDefaultExpenseParent(
  supabase: SupabaseClient<Database>,
  userId: string,
  categoryRow: ExpenseCategoryRow,
  validatedData: UpdateExpenseCategoryInput,
  hiddenIds: Set<string>,
): Promise<{ category: ExpenseCategory | null; error: string | null }> {
  const tableCheck = await ensureHiddenDefaultTableAvailable(supabase, userId, "expense");
  if (!tableCheck.ok) {
    return { category: null, error: tableCheck.error };
  }

  if (categoryRow.parent_category_id !== null) {
    return { category: null, error: "Not a top-level category" };
  }

  if (
    validatedData.parentCategoryId !== undefined &&
    validatedData.parentCategoryId !== null
  ) {
    return {
      category: null,
      error: "Category cannot be its own parent",
    };
  }

  const finalName =
    validatedData.name !== undefined ? validatedData.name.trim() : categoryRow.name;

  const dup = await assertNoDuplicateExpenseNameAtLevel(
    supabase,
    userId,
    null,
    finalName,
    [categoryRow.id],
    hiddenIds,
  );
  if (!dup.ok) {
    return {
      category: null,
      error: "Category with this name already exists at this level",
    };
  }

  const { data: newParent, error: parentInsertError } = await supabase
    .from("expense_categories")
    .insert({
      user_id: userId,
      name: finalName,
      parent_category_id: null,
      icon: validatedData.icon ?? categoryRow.icon,
    })
    .select()
    .single();

  if (parentInsertError || !newParent) {
    console.error("forkDefaultExpenseParent parent insert:", parentInsertError);
    return { category: null, error: "Failed to create category" };
  }

  const newParentRow = newParent as ExpenseCategoryRow;

  const { data: childrenRows } = await supabase
    .from("expense_categories")
    .select("*")
    .eq("parent_category_id", categoryRow.id);

  const children = (childrenRows ?? []) as ExpenseCategoryRow[];

  for (const ch of children) {
    if (ch.user_id === null) {
      const childDup = await assertNoDuplicateExpenseNameAtLevel(
        supabase,
        userId,
        newParentRow.id,
        ch.name,
        [ch.id],
        hiddenIds,
      );
      if (!childDup.ok) {
        return {
          category: null,
          error: `Cannot fork: "${ch.name}" would duplicate an existing category under the new parent`,
        };
      }

      const { data: newChild, error: childInsertError } = await supabase
        .from("expense_categories")
        .insert({
          user_id: userId,
          name: ch.name,
          parent_category_id: newParentRow.id,
          icon: ch.icon,
        })
        .select()
        .single();

      if (childInsertError || !newChild) {
        console.error("forkDefaultExpenseParent child insert:", childInsertError);
        return { category: null, error: "Failed to create category" };
      }

      const newChildRow = newChild as ExpenseCategoryRow;
      await migrateExpenseTransactions(supabase, userId, ch.id, newChildRow.id);

      const { error: hideChildErr } = await hideDefaultCategoryForUser(
        supabase,
        userId,
        ch.id,
        "expense",
      );
      if (hideChildErr) {
        return { category: null, error: hideChildErr.message };
      }
    } else if (ch.user_id === userId) {
      const { error: updErr } = await supabase
        .from("expense_categories")
        .update({ parent_category_id: newParentRow.id })
        .eq("id", ch.id)
        .eq("user_id", userId);

      if (updErr) {
        console.error("forkDefaultExpenseParent reparent custom child:", updErr);
        return { category: null, error: "Failed to update category" };
      }
    }
  }

  const { error: hideParentErr } = await hideDefaultCategoryForUser(
    supabase,
    userId,
    categoryRow.id,
    "expense",
  );
  if (hideParentErr) {
    return { category: null, error: hideParentErr.message };
  }

  return { category: newParentRow as ExpenseCategory, error: null };
}

export async function forkDefaultIncomeCategory(
  supabase: SupabaseClient<Database>,
  userId: string,
  categoryRow: IncomeCategoryRow,
  name: string,
  icon: string | undefined,
  hiddenIds: Set<string>,
): Promise<{ category: IncomeCategory | null; error: string | null }> {
  const tableCheck = await ensureHiddenDefaultTableAvailable(supabase, userId, "income");
  if (!tableCheck.ok) {
    return { category: null, error: tableCheck.error };
  }

  const finalName = name.trim();

  const dup = await assertNoDuplicateIncomeName(supabase, userId, finalName, [categoryRow.id], hiddenIds);
  if (!dup.ok) {
    const { data: existingUserCategory } = await supabase
      .from("income_categories")
      .select("*")
      .eq("user_id", userId)
      .eq("name", finalName)
      .maybeSingle();

    if (existingUserCategory) {
      const existingRow = existingUserCategory as IncomeCategoryRow;
      await migrateIncomeTransactions(supabase, userId, categoryRow.id, existingRow.id);
      const { error: hideErr } = await hideDefaultCategoryForUser(
        supabase,
        userId,
        categoryRow.id,
        "income",
      );
      if (hideErr) {
        return { category: null, error: hideErr.message };
      }
      return { category: existingRow as IncomeCategory, error: null };
    }

    return {
      category: null,
      error: "Category with this name already exists",
    };
  }

  const { data: inserted, error: insertError } = await supabase
    .from("income_categories")
    .insert({
      user_id: userId,
      name: finalName,
      icon: icon ?? categoryRow.icon,
    })
    .select()
    .single();

  if (insertError || !inserted) {
    console.error("forkDefaultIncomeCategory insert:", insertError);
    return { category: null, error: "Failed to create category" };
  }

  const insertedIncome = inserted as IncomeCategoryRow;
  await migrateIncomeTransactions(supabase, userId, categoryRow.id, insertedIncome.id);

  const { error: hideErr } = await hideDefaultCategoryForUser(
    supabase,
    userId,
    categoryRow.id,
    "income",
  );
  if (hideErr) {
    return { category: null, error: hideErr.message };
  }

  return { category: insertedIncome as IncomeCategory, error: null };
}

export async function deleteExpenseCategoryByHidingDefault(
  supabase: SupabaseClient<Database>,
  userId: string,
  categoryRow: ExpenseCategoryRow,
): Promise<{ error: string | null }> {
  const tableCheck = await ensureHiddenDefaultTableAvailable(supabase, userId, "expense");
  if (!tableCheck.ok) {
    return { error: tableCheck.error };
  }

  const { count: transactionCount } = await supabase
    .from("transaction")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("expense_category_id", categoryRow.id);

  if (transactionCount && transactionCount > 0) {
    return {
      error: `Cannot delete category: ${transactionCount} transaction(s) are using this category`,
    };
  }

  if (categoryRow.parent_category_id === null) {
    const { data: childRows } = await supabase
      .from("expense_categories")
      .select("*")
      .eq("parent_category_id", categoryRow.id);

    const children = (childRows ?? []) as ExpenseCategoryRow[];

    const customChildren = children.filter((c) => c.user_id === userId);
    if (customChildren.length > 0) {
      return {
        error:
          "Cannot delete this category while custom sub-categories exist. Move or delete them first.",
      };
    }

    for (const ch of children) {
      if (ch.user_id !== null) continue;

      const { count: txChild } = await supabase
        .from("transaction")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("expense_category_id", ch.id);

      if (txChild && txChild > 0) {
        return {
          error: `Cannot delete category: ${txChild} transaction(s) are using sub-category "${ch.name}"`,
        };
      }
    }

    for (const ch of children) {
      if (ch.user_id === null) {
        const { error } = await hideDefaultCategoryForUser(supabase, userId, ch.id, "expense");
        if (error) {
          return { error: error.message };
        }
      }
    }
  }

  const { error: hideErr } = await hideDefaultCategoryForUser(
    supabase,
    userId,
    categoryRow.id,
    "expense",
  );
  if (hideErr) {
    return { error: hideErr.message };
  }

  return { error: null };
}

export async function deleteIncomeCategoryByHidingDefault(
  supabase: SupabaseClient<Database>,
  userId: string,
  categoryRow: IncomeCategoryRow,
): Promise<{ error: string | null }> {
  const tableCheck = await ensureHiddenDefaultTableAvailable(supabase, userId, "income");
  if (!tableCheck.ok) {
    return { error: tableCheck.error };
  }

  const { count: transactionCount } = await supabase
    .from("transaction")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("income_category_id", categoryRow.id);

  if (transactionCount && transactionCount > 0) {
    return {
      error: `Cannot delete category: ${transactionCount} transaction(s) are using this category`,
    };
  }

  const { error: hideErr } = await hideDefaultCategoryForUser(
    supabase,
    userId,
    categoryRow.id,
    "income",
  );
  if (hideErr) {
    return { error: hideErr.message };
  }

  return { error: null };
}
