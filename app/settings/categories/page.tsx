"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Edit2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CategoryIcon } from "@/components/categories/CategoryIcon";
import { CategoryIconSelect } from "@/components/categories/CategoryIconSelect";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocaleContext } from "@/components/providers/LocaleProvider";
import { incomeCategoryDisplayName } from "@/lib/i18n/category-display-name";
import { localizedSeedCategoryName } from "@/lib/i18n/seed-category-labels";
import { buildCategorySchemas } from "@/lib/i18n/zod/category-schemas";
import type { Locale } from "@/lib/i18n/types";
import type {
  CreateExpenseCategoryInput,
  UpdateExpenseCategoryInput,
  CreateIncomeCategoryInput,
  UpdateIncomeCategoryInput,
} from "@/lib/schemas/category.schema";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  ExpenseCategory,
  ExpenseCategoryWithChildren,
  IncomeCategory,
} from "@/types/category.types";

type ExpenseCategoriesResponse =
  | { success: true; data: { categories: ExpenseCategoryWithChildren[] } }
  | { success: false; error: string; code: string };

type IncomeCategoriesResponse =
  | { success: true; data: { categories: (IncomeCategory & { isDefault: boolean })[] } }
  | { success: false; error: string; code: string };

type ExpenseCategoryMutationResponse =
  | { success: true; data: { category: ExpenseCategory } }
  | { success: false; error: string; code: string };

type IncomeCategoryMutationResponse =
  | { success: true; data: { category: IncomeCategory } }
  | { success: false; error: string; code: string };

function moveItem<T>(arr: T[], from: number, to: number): T[] {
  const next = [...arr];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

/**
 * Category Management Page
 * Implements FR-CAT-001 through FR-CAT-004: Category Management
 * @see docs/specifications.md#fr-cat-001-view-default-categories
 */
export default function CategoriesPage() {
  const queryClient = useQueryClient();
  const { messages: m, locale } = useLocaleContext();
  const sc = m.settings.categories;
  const [expenseDialogOpen, setExpenseDialogOpen] = useState(false);
  const [incomeDialogOpen, setIncomeDialogOpen] = useState(false);
  const [editingExpenseCategory, setEditingExpenseCategory] = useState<ExpenseCategory | null>(null);
  const [editingIncomeCategory, setEditingIncomeCategory] = useState<IncomeCategory | null>(null);
  const [deletingExpenseCategory, setDeletingExpenseCategory] = useState<ExpenseCategory | null>(
    null,
  );
  const [deletingIncomeCategory, setDeletingIncomeCategory] = useState<IncomeCategory | null>(
    null,
  );
  const [expenseParentOrder, setExpenseParentOrder] = useState<string[]>([]);
  const [expenseChildOrder, setExpenseChildOrder] = useState<Record<string, string[]>>({});
  const [draggingParentId, setDraggingParentId] = useState<string | null>(null);
  const [draggingChild, setDraggingChild] = useState<{ parentId: string; childId: string } | null>(
    null,
  );

  // Fetch expense categories
  const {
    data: expenseData,
    isLoading: expenseLoading,
    isFetching: expenseFetching,
  } = useQuery<ExpenseCategoriesResponse>({
    queryKey: ["expense-categories"],
    queryFn: async () => {
      const token = localStorage.getItem("pm_token");
      const res = await fetch("/api/categories/expense", {
        headers: { Authorization: token ? `Bearer ${token}` : "" },
      });

      if (!res.ok) {
        const errorData = (await res.json().catch(() => null)) as ExpenseCategoriesResponse | null;
        throw new Error(
          errorData?.success === false ? errorData.error : sc.fetchExpenseError,
        );
      }

      return (await res.json()) as ExpenseCategoriesResponse;
    },
  });

  // Fetch income categories
  const {
    data: incomeData,
    isLoading: incomeLoading,
    isFetching: incomeFetching,
  } = useQuery<IncomeCategoriesResponse>({
    queryKey: ["income-categories"],
    queryFn: async () => {
      const token = localStorage.getItem("pm_token");
      const res = await fetch("/api/categories/income", {
        headers: { Authorization: token ? `Bearer ${token}` : "" },
      });

      if (!res.ok) {
        const errorData = (await res.json().catch(() => null)) as IncomeCategoriesResponse | null;
        throw new Error(
          errorData?.success === false ? errorData.error : sc.fetchIncomeError,
        );
      }

      return (await res.json()) as IncomeCategoriesResponse;
    },
  });

  const expenseCategories = expenseData?.success === true ? expenseData.data.categories : [];
  const incomeCategories = incomeData?.success === true ? incomeData.data.categories : [];

  // Expense category mutations
  const createExpenseMutation = useMutation({
    mutationFn: async (data: CreateExpenseCategoryInput) => {
      const token = localStorage.getItem("pm_token");
      const res = await fetch("/api/categories/expense", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify(data),
      });

      const result = (await res.json()) as ExpenseCategoriesResponse;

      if (!res.ok) {
        throw new Error(result.success === false ? result.error : sc.createFailed);
      }

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expense-categories"] });
      setExpenseDialogOpen(false);
    },
  });

  const updateExpenseMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateExpenseCategoryInput }) => {
      const token = localStorage.getItem("pm_token");
      const res = await fetch(`/api/categories/expense/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify(data),
      });

      const result = (await res.json()) as ExpenseCategoryMutationResponse;

      if (!res.ok) {
        throw new Error(result.success === false ? result.error : sc.updateFailed);
      }

      return result;
    },
    onSuccess: (result) => {
      if (result.success && editingExpenseCategory && result.data.category.id !== editingExpenseCategory.id) {
        const oldId = editingExpenseCategory.id;
        const newId = result.data.category.id;

        if (editingExpenseCategory.parent_category_id === null) {
          setExpenseParentOrder((prev) => prev.map((id) => (id === oldId ? newId : id)));
        } else {
          const parentId = editingExpenseCategory.parent_category_id;
          if (parentId) {
            setExpenseChildOrder((prev) => ({
              ...prev,
              [parentId]: (prev[parentId] ?? []).map((id) => (id === oldId ? newId : id)),
            }));
          }
        }
      }
      queryClient.invalidateQueries({ queryKey: ["expense-categories"] });
      setEditingExpenseCategory(null);
      setExpenseDialogOpen(false);
    },
  });

  const deleteExpenseMutation = useMutation({
    mutationFn: async (id: string) => {
      const token = localStorage.getItem("pm_token");
      const res = await fetch(`/api/categories/expense/${id}`, {
        method: "DELETE",
        headers: { Authorization: token ? `Bearer ${token}` : "" },
      });

      const result = (await res.json()) as ExpenseCategoriesResponse;

      if (!res.ok) {
        throw new Error(result.success === false ? result.error : sc.deleteFailed);
      }

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expense-categories"] });
      setDeletingExpenseCategory(null);
    },
  });

  // Income category mutations
  const createIncomeMutation = useMutation({
    mutationFn: async (data: CreateIncomeCategoryInput) => {
      const token = localStorage.getItem("pm_token");
      const res = await fetch("/api/categories/income", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify(data),
      });

      const result = (await res.json()) as IncomeCategoriesResponse;

      if (!res.ok) {
        throw new Error(result.success === false ? result.error : sc.createFailed);
      }

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["income-categories"] });
      setIncomeDialogOpen(false);
    },
  });

  const updateIncomeMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateIncomeCategoryInput }) => {
      const token = localStorage.getItem("pm_token");
      const res = await fetch(`/api/categories/income/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify(data),
      });

      const result = (await res.json()) as IncomeCategoryMutationResponse;

      if (!res.ok) {
        throw new Error(result.success === false ? result.error : sc.updateFailed);
      }

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["income-categories"] });
      setEditingIncomeCategory(null);
      setIncomeDialogOpen(false);
    },
  });

  const deleteIncomeMutation = useMutation({
    mutationFn: async (id: string) => {
      const token = localStorage.getItem("pm_token");
      const res = await fetch(`/api/categories/income/${id}`, {
        method: "DELETE",
        headers: { Authorization: token ? `Bearer ${token}` : "" },
      });

      const result = (await res.json()) as IncomeCategoriesResponse;

      if (!res.ok) {
        throw new Error(result.success === false ? result.error : sc.deleteFailed);
      }

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["income-categories"] });
      setDeletingIncomeCategory(null);
    },
  });

  // Load persisted order preferences once
  useEffect(() => {
    try {
      const rawParent = localStorage.getItem("pm_expense_parent_order_v1");
      const rawChild = localStorage.getItem("pm_expense_child_order_v1");
      if (rawParent) {
        setExpenseParentOrder(JSON.parse(rawParent) as string[]);
      }
      if (rawChild) {
        setExpenseChildOrder(JSON.parse(rawChild) as Record<string, string[]>);
      }
    } catch {
      // ignore invalid persisted state
    }
  }, []);

  // Keep parent order stable as categories update
  useEffect(() => {
    if (expenseCategories.length === 0) return;
    const parentIds = expenseCategories.map((p) => p.id);
    setExpenseParentOrder((prev) => {
      const kept = prev.filter((id) => parentIds.includes(id));
      const missing = parentIds.filter((id) => !kept.includes(id));
      return [...kept, ...missing];
    });
  }, [expenseCategories]);

  // Keep child order stable as categories update
  useEffect(() => {
    if (expenseCategories.length === 0) return;
    setExpenseChildOrder((prev) => {
      const next: Record<string, string[]> = {};
      for (const parent of expenseCategories) {
        const childIds = parent.children.map((c) => c.id);
        const existing = prev[parent.id] ?? [];
        const kept = existing.filter((id) => childIds.includes(id));
        const missing = childIds.filter((id) => !kept.includes(id));
        next[parent.id] = [...kept, ...missing];
      }
      return next;
    });
  }, [expenseCategories]);

  // Persist order preferences
  useEffect(() => {
    localStorage.setItem("pm_expense_parent_order_v1", JSON.stringify(expenseParentOrder));
  }, [expenseParentOrder]);

  useEffect(() => {
    localStorage.setItem("pm_expense_child_order_v1", JSON.stringify(expenseChildOrder));
  }, [expenseChildOrder]);

  const orderedExpenseCategories = useMemo(() => {
    const indexById = new Map(expenseParentOrder.map((id, idx) => [id, idx]));
    return [...expenseCategories].sort(
      (a, b) => (indexById.get(a.id) ?? Number.MAX_SAFE_INTEGER) - (indexById.get(b.id) ?? Number.MAX_SAFE_INTEGER),
    );
  }, [expenseCategories, expenseParentOrder]);

  function orderedChildren(parent: ExpenseCategoryWithChildren): ExpenseCategory[] {
    const order = expenseChildOrder[parent.id] ?? [];
    const indexById = new Map(order.map((id, idx) => [id, idx]));
    return [...parent.children].sort(
      (a, b) => (indexById.get(a.id) ?? Number.MAX_SAFE_INTEGER) - (indexById.get(b.id) ?? Number.MAX_SAFE_INTEGER),
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{sc.title}</h1>
          <p className="text-muted-foreground">{sc.subtitle}</p>
        </div>
      </div>

      <Tabs defaultValue="expense" className="space-y-4">
        <TabsList>
          <TabsTrigger value="expense">{sc.tabExpense}</TabsTrigger>
          <TabsTrigger value="income">{sc.tabIncome}</TabsTrigger>
        </TabsList>

        {/* Expense Categories Tab */}
        <TabsContent value="expense" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={expenseDialogOpen} onOpenChange={setExpenseDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  onClick={() => {
                    setEditingExpenseCategory(null);
                    setExpenseDialogOpen(true);
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  {sc.createCustom}
                </Button>
              </DialogTrigger>
              <ExpenseCategoryDialog
                key={editingExpenseCategory?.id ?? "new-expense"}
                category={editingExpenseCategory}
                parentCategories={expenseCategories}
                locale={locale}
                onSubmit={async (data) => {
                  if (editingExpenseCategory) {
                    await updateExpenseMutation.mutateAsync({
                      id: editingExpenseCategory.id,
                      data,
                    });
                  } else {
                    await createExpenseMutation.mutateAsync(
                      data as CreateExpenseCategoryInput,
                    );
                  }
                }}
                isLoading={createExpenseMutation.isPending || updateExpenseMutation.isPending}
                onClose={() => {
                  setExpenseDialogOpen(false);
                  setEditingExpenseCategory(null);
                }}
              />
            </Dialog>
          </div>

          {expenseLoading && !expenseData ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-muted-foreground">{sc.loading}</div>
            </div>
          ) : (
            <div className="space-y-4">
              {orderedExpenseCategories.map((parent) => (
                <Card key={parent.id}>
                  <CardHeader
                    draggable
                    onDragStart={() => setDraggingParentId(parent.id)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => {
                      if (!draggingParentId || draggingParentId === parent.id) return;
                      const from = expenseParentOrder.indexOf(draggingParentId);
                      const to = expenseParentOrder.indexOf(parent.id);
                      if (from === -1 || to === -1) return;
                      setExpenseParentOrder((prev) => moveItem(prev, from, to));
                      setDraggingParentId(null);
                    }}
                    className="cursor-move"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <CardTitle>
                        <span className="flex items-center gap-2">
                          <CategoryIcon icon={parent.icon} name={parent.name} kind="expense" />
                          {localizedSeedCategoryName(
                            parent.name,
                            parent.isDefault,
                            locale,
                            "expense",
                          )}
                        </span>
                      </CardTitle>
                      <div className="flex shrink-0 gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingExpenseCategory(parent);
                            setExpenseDialogOpen(true);
                          }}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeletingExpenseCategory(parent)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                    {parent.children.length > 0 && (
                      <CardDescription>
                        {parent.children.length === 1
                          ? sc.subCountOne.replace("{n}", String(parent.children.length))
                          : sc.subCountMany.replace("{n}", String(parent.children.length))}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    {parent.children.length > 0 ? (
                      <div className="space-y-2">
                        {orderedChildren(parent).map((child) => (
                          <div
                            key={child.id}
                            className="flex items-center justify-between rounded-lg border p-3"
                            draggable
                            onDragStart={() =>
                              setDraggingChild({ parentId: parent.id, childId: child.id })
                            }
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={() => {
                              if (!draggingChild) return;
                              if (draggingChild.parentId !== parent.id) return;
                              if (draggingChild.childId === child.id) return;
                              const list = expenseChildOrder[parent.id] ?? [];
                              const from = list.indexOf(draggingChild.childId);
                              const to = list.indexOf(child.id);
                              if (from === -1 || to === -1) return;
                              setExpenseChildOrder((prev) => ({
                                ...prev,
                                [parent.id]: moveItem(prev[parent.id] ?? [], from, to),
                              }));
                              setDraggingChild(null);
                            }}
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-sm">
                                <span className="mr-2 align-middle">•</span>
                                <CategoryIcon
                                  icon={child.icon}
                                  name={child.name}
                                  kind="expense"
                                  className="mr-2 inline-block align-middle"
                                />
                                {localizedSeedCategoryName(
                                  child.name,
                                  child.user_id === null,
                                  locale,
                                  "expense",
                                )}
                              </span>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setEditingExpenseCategory(child);
                                  setExpenseDialogOpen(true);
                                }}
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setDeletingExpenseCategory(child)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">{sc.noSub}</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Income Categories Tab */}
        <TabsContent value="income" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={incomeDialogOpen} onOpenChange={setIncomeDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  onClick={() => {
                    setEditingIncomeCategory(null);
                    setIncomeDialogOpen(true);
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  {sc.createCustom}
                </Button>
              </DialogTrigger>
              <IncomeCategoryDialog
                key={editingIncomeCategory?.id ?? "new-income"}
                category={editingIncomeCategory}
                onSubmit={async (data) => {
                  if (editingIncomeCategory) {
                    await updateIncomeMutation.mutateAsync({
                      id: editingIncomeCategory.id,
                      data,
                    });
                  } else {
                    await createIncomeMutation.mutateAsync(
                      data as CreateIncomeCategoryInput,
                    );
                  }
                }}
                isLoading={createIncomeMutation.isPending || updateIncomeMutation.isPending}
                onClose={() => {
                  setIncomeDialogOpen(false);
                  setEditingIncomeCategory(null);
                }}
              />
            </Dialog>
          </div>

          {incomeLoading && !incomeData ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-muted-foreground">{sc.loading}</div>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {incomeCategories.map((category) => (
                <Card key={category.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">
                        <span className="flex items-center gap-2">
                          <CategoryIcon icon={category.icon} name={category.name} kind="income" />
                          {incomeCategoryDisplayName(category, locale)}
                        </span>
                      </span>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingIncomeCategory(category);
                            setIncomeDialogOpen(true);
                          }}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeletingIncomeCategory(category)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {(expenseFetching || incomeFetching) && (expenseData || incomeData) && (
        <p className="text-sm text-muted-foreground">{sc.refreshing}</p>
      )}

      {/* Delete Expense Category Dialog */}
      <AlertDialog
        open={deletingExpenseCategory !== null}
        onOpenChange={(open) => !open && setDeletingExpenseCategory(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{sc.deleteTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {sc.deleteConfirm.replace("{name}", deletingExpenseCategory?.name ?? "")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{m.common.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deletingExpenseCategory) {
                  deleteExpenseMutation.mutate(deletingExpenseCategory.id);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {m.common.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Income Category Dialog */}
      <AlertDialog
        open={deletingIncomeCategory !== null}
        onOpenChange={(open) => !open && setDeletingIncomeCategory(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{sc.deleteTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {sc.deleteConfirm.replace("{name}", deletingIncomeCategory?.name ?? "")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{m.common.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deletingIncomeCategory) {
                  deleteIncomeMutation.mutate(deletingIncomeCategory.id);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {m.common.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Expense Category Dialog Component
function ExpenseCategoryDialog({
  category,
  parentCategories,
  locale,
  onSubmit,
  isLoading,
  onClose,
}: {
  category: ExpenseCategory | null;
  parentCategories: ExpenseCategoryWithChildren[];
  locale: Locale;
  onSubmit: (data: CreateExpenseCategoryInput | UpdateExpenseCategoryInput) => Promise<void>;
  isLoading: boolean;
  onClose: () => void;
}) {
  const { messages: m } = useLocaleContext();
  const sc = m.settings.categories;
  const categorySchemas = useMemo(() => buildCategorySchemas(m), [m]);
  const isEdit = category !== null;
  const [submitError, setSubmitError] = useState<string | null>(null);

  const form = useForm<CreateExpenseCategoryInput | UpdateExpenseCategoryInput>({
    resolver: zodResolver(
      isEdit ? categorySchemas.updateExpense : categorySchemas.createExpense,
    ),
    defaultValues: isEdit
      ? {
          name: category.name,
          parentCategoryId: category.parent_category_id || null,
          icon: category.icon ?? undefined,
        }
      : {
          name: "",
          parentCategoryId: null,
          icon: "tag",
        },
  });

  async function handleSubmit(
    values: CreateExpenseCategoryInput | UpdateExpenseCategoryInput,
  ) {
    setSubmitError(null);
    try {
      await onSubmit(values);
      form.reset();
    } catch (error) {
      const message = error instanceof Error ? error.message : sc.updateFailed;
      setSubmitError(message);
    }
  }

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{isEdit ? sc.dialogEdit : sc.dialogCreate}</DialogTitle>
        <DialogDescription>
          {isEdit ? sc.expenseDialogEditDesc : sc.expenseDialogCreateDesc}
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        {submitError ? <p className="text-sm text-destructive">{submitError}</p> : null}
        <div className="space-y-2">
          <Label htmlFor="name">{sc.categoryName}</Label>
          <Input id="name" placeholder={sc.namePlaceholderExpense} {...form.register("name")} />
          {form.formState.errors.name?.message && (
            <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="icon">{sc.iconLabel}</Label>
          <Controller
            control={form.control}
            name="icon"
            render={({ field }) => (
              <CategoryIconSelect
                kind="expense"
                value={field.value}
                onChange={field.onChange}
                placeholder={sc.iconPlaceholder}
                triggerId="icon"
              />
            )}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="parentCategoryId">{sc.parentCategoryLabel}</Label>
          {isEdit && category.parent_category_id === null ? (
            <p className="text-sm text-muted-foreground" id="parentCategoryId">
              {sc.parentTopLevelNote}
            </p>
          ) : (
            <Controller
              control={form.control}
              name="parentCategoryId"
              render={({ field }) => (
                <Select
                  onValueChange={(value) => {
                    field.onChange(value === "none" ? null : value);
                  }}
                  value={field.value || "none"}
                >
                  <SelectTrigger id="parentCategoryId">
                    <SelectValue placeholder={sc.selectParentPlaceholder} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">{sc.parentNone}</SelectItem>
                    {parentCategories.map((parent) => (
                      <SelectItem key={parent.id} value={parent.id}>
                        {localizedSeedCategoryName(
                          parent.name,
                          parent.isDefault,
                          locale,
                          "expense",
                        )}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          )}
          {form.formState.errors.parentCategoryId?.message && (
            <p className="text-sm text-destructive">
              {form.formState.errors.parentCategoryId.message}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
            {m.common.cancel}
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading
              ? m.common.saving
              : isEdit
                ? m.accounts.saveChanges
                : sc.submitCreate}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}

// Income Category Dialog Component
function IncomeCategoryDialog({
  category,
  onSubmit,
  isLoading,
  onClose,
}: {
  category: IncomeCategory | null;
  onSubmit: (data: CreateIncomeCategoryInput | UpdateIncomeCategoryInput) => Promise<void>;
  isLoading: boolean;
  onClose: () => void;
}) {
  const { messages: m } = useLocaleContext();
  const sc = m.settings.categories;
  const categorySchemas = useMemo(() => buildCategorySchemas(m), [m]);
  const isEdit = category !== null;
  const [submitError, setSubmitError] = useState<string | null>(null);

  const form = useForm<CreateIncomeCategoryInput | UpdateIncomeCategoryInput>({
    resolver: zodResolver(
      isEdit ? categorySchemas.updateIncome : categorySchemas.createIncome,
    ),
    defaultValues: isEdit
      ? {
          name: category.name,
          icon: category.icon ?? undefined,
        }
      : {
          name: "",
          icon: "tag",
        },
  });

  async function handleSubmit(values: CreateIncomeCategoryInput | UpdateIncomeCategoryInput) {
    setSubmitError(null);
    try {
      await onSubmit(values);
      form.reset();
    } catch (error) {
      const message = error instanceof Error ? error.message : sc.updateFailed;
      setSubmitError(message);
    }
  }

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{isEdit ? sc.dialogEdit : sc.dialogCreate}</DialogTitle>
        <DialogDescription>
          {isEdit ? sc.incomeDialogEditDesc : sc.incomeDialogCreateDesc}
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        {submitError ? <p className="text-sm text-destructive">{submitError}</p> : null}
        <div className="space-y-2">
          <Label htmlFor="name">{sc.categoryName}</Label>
          <Input id="name" placeholder={sc.namePlaceholderIncome} {...form.register("name")} />
          {form.formState.errors.name?.message && (
            <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="income-icon">{sc.iconLabel}</Label>
          <Controller
            control={form.control}
            name="icon"
            render={({ field }) => (
              <CategoryIconSelect
                kind="income"
                value={field.value}
                onChange={field.onChange}
                placeholder={sc.iconPlaceholder}
                triggerId="income-icon"
              />
            )}
          />
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
            {m.common.cancel}
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading
              ? m.common.saving
              : isEdit
                ? m.accounts.saveChanges
                : sc.submitCreate}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
