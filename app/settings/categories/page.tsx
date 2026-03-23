"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Edit2, Trash2, AlertCircle } from "lucide-react";
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
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createExpenseCategorySchema,
  updateExpenseCategorySchema,
  createIncomeCategorySchema,
  updateIncomeCategorySchema,
  type CreateExpenseCategoryInput,
  type UpdateExpenseCategoryInput,
  type CreateIncomeCategoryInput,
  type UpdateIncomeCategoryInput,
} from "@/lib/schemas/category.schema";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CategoryBadge } from "@/components/categories/CategoryBadge";
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

/**
 * Category Management Page
 * Implements FR-CAT-001 through FR-CAT-004: Category Management
 * @see docs/specifications.md#fr-cat-001-view-default-categories
 */
export default function CategoriesPage() {
  const queryClient = useQueryClient();
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

  // Fetch expense categories
  const { data: expenseData, isLoading: expenseLoading } = useQuery<ExpenseCategoriesResponse>({
    queryKey: ["expense-categories"],
    queryFn: async () => {
      const token = localStorage.getItem("pm_token");
      const res = await fetch("/api/categories/expense", {
        headers: { Authorization: token ? `Bearer ${token}` : "" },
      });

      if (!res.ok) {
        const errorData = (await res.json().catch(() => null)) as ExpenseCategoriesResponse | null;
        throw new Error(
          errorData?.success === false ? errorData.error : "Failed to fetch expense categories",
        );
      }

      return (await res.json()) as ExpenseCategoriesResponse;
    },
  });

  // Fetch income categories
  const { data: incomeData, isLoading: incomeLoading } = useQuery<IncomeCategoriesResponse>({
    queryKey: ["income-categories"],
    queryFn: async () => {
      const token = localStorage.getItem("pm_token");
      const res = await fetch("/api/categories/income", {
        headers: { Authorization: token ? `Bearer ${token}` : "" },
      });

      if (!res.ok) {
        const errorData = (await res.json().catch(() => null)) as IncomeCategoriesResponse | null;
        throw new Error(
          errorData?.success === false ? errorData.error : "Failed to fetch income categories",
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
        throw new Error(result.success === false ? result.error : "Failed to create category");
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

      const result = (await res.json()) as ExpenseCategoriesResponse;

      if (!res.ok) {
        throw new Error(result.success === false ? result.error : "Failed to update category");
      }

      return result;
    },
    onSuccess: () => {
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
        throw new Error(result.success === false ? result.error : "Failed to delete category");
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
        throw new Error(result.success === false ? result.error : "Failed to create category");
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

      const result = (await res.json()) as IncomeCategoriesResponse;

      if (!res.ok) {
        throw new Error(result.success === false ? result.error : "Failed to update category");
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
        throw new Error(result.success === false ? result.error : "Failed to delete category");
      }

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["income-categories"] });
      setDeletingIncomeCategory(null);
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Category Management</h1>
          <p className="text-muted-foreground">
            Manage your expense and income categories. Default categories are read-only.
          </p>
        </div>
      </div>

      <Tabs defaultValue="expense" className="space-y-4">
        <TabsList>
          <TabsTrigger value="expense">Expense Categories</TabsTrigger>
          <TabsTrigger value="income">Income Categories</TabsTrigger>
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
                  Create Custom Category
                </Button>
              </DialogTrigger>
              <ExpenseCategoryDialog
                category={editingExpenseCategory}
                parentCategories={expenseCategories}
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

          {expenseLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-muted-foreground">Loading categories...</div>
            </div>
          ) : (
            <div className="space-y-4">
              {expenseCategories.map((parent) => (
                <Card key={parent.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CardTitle>{parent.name}</CardTitle>
                        {parent.isDefault && (
                          <CategoryBadge category={parent} isDefault variant="outline" />
                        )}
                      </div>
                    </div>
                    {parent.children.length > 0 && (
                      <CardDescription>
                        {parent.children.length} sub-categor{parent.children.length === 1 ? "y" : "ies"}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    {parent.children.length > 0 ? (
                      <div className="space-y-2">
                        {parent.children.map((child) => (
                          <div
                            key={child.id}
                            className="flex items-center justify-between rounded-lg border p-3"
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-sm">• {child.name}</span>
                              {child.user_id === null && (
                                <CategoryBadge category={child} isDefault variant="outline" />
                              )}
                            </div>
                            {child.user_id !== null && (
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
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No sub-categories</p>
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
                  Create Custom Category
                </Button>
              </DialogTrigger>
              <IncomeCategoryDialog
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

          {incomeLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-muted-foreground">Loading categories...</div>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {incomeCategories.map((category) => (
                <Card key={category.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{category.name}</span>
                        {category.isDefault && (
                          <CategoryBadge category={category} isDefault variant="outline" />
                        )}
                      </div>
                      {!category.isDefault && (
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
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Delete Expense Category Dialog */}
      <AlertDialog
        open={deletingExpenseCategory !== null}
        onOpenChange={(open) => !open && setDeletingExpenseCategory(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingExpenseCategory?.name}"? This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deletingExpenseCategory) {
                  deleteExpenseMutation.mutate(deletingExpenseCategory.id);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
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
            <AlertDialogTitle>Delete Category</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingIncomeCategory?.name}"? This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deletingIncomeCategory) {
                  deleteIncomeMutation.mutate(deletingIncomeCategory.id);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
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
  onSubmit,
  isLoading,
  onClose,
}: {
  category: ExpenseCategory | null;
  parentCategories: ExpenseCategoryWithChildren[];
  onSubmit: (data: CreateExpenseCategoryInput | UpdateExpenseCategoryInput) => Promise<void>;
  isLoading: boolean;
  onClose: () => void;
}) {
  const isEdit = category !== null;

  const form = useForm<CreateExpenseCategoryInput | UpdateExpenseCategoryInput>({
    resolver: zodResolver(isEdit ? updateExpenseCategorySchema : createExpenseCategorySchema),
    defaultValues: isEdit
      ? {
          name: category.name,
          parentCategoryId: category.parent_category_id || null,
        }
      : {
          name: "",
          parentCategoryId: null,
        },
  });

  async function handleSubmit(
    values: CreateExpenseCategoryInput | UpdateExpenseCategoryInput,
  ) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/c56f0928-d79a-49ad-9aae-38efc54ee0e6',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'c5492e'},body:JSON.stringify({sessionId:'c5492e',location:'categories/page.tsx:handleSubmit',message:'Form passed validation - values submitted',data:{values},timestamp:Date.now(),hypothesisId:'H-A,H-D'})}).catch(()=>{});
    // #endregion
    try {
      await onSubmit(values);
      form.reset();
    } catch (error) {
      // Error is handled by mutation
    }
  }

  // #region agent log
  function onInvalid(errors: any) {
    fetch('http://127.0.0.1:7242/ingest/c56f0928-d79a-49ad-9aae-38efc54ee0e6',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'c5492e'},body:JSON.stringify({sessionId:'c5492e',location:'categories/page.tsx:onInvalid',message:'Form FAILED validation - zod errors',data:{errors,parentCategoryIdError:errors?.parentCategoryId,currentFieldValue:form.getValues('parentCategoryId')},timestamp:Date.now(),hypothesisId:'H-A,H-D'})}).catch(()=>{});
  }
  // #endregion

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{isEdit ? "Edit Category" : "Create Custom Category"}</DialogTitle>
        <DialogDescription>
          {isEdit
            ? "Update the category name or move it to a different parent category."
            : "Create a new custom expense category. You can create a parent category or a child category under an existing parent."}
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={form.handleSubmit(handleSubmit, onInvalid)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Category Name</Label>
          <Input id="name" placeholder="e.g. Subscriptions" {...form.register("name")} />
          {form.formState.errors.name?.message && (
            <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="parentCategoryId">Parent Category (Optional)</Label>
          <Controller
            control={form.control}
            name="parentCategoryId"
            render={({ field }) => (
              <Select
                onValueChange={(value) => {
                  // #region agent log
                  fetch('http://127.0.0.1:7242/ingest/c56f0928-d79a-49ad-9aae-38efc54ee0e6',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'c5492e'},body:JSON.stringify({sessionId:'c5492e',location:'categories/page.tsx:Select.onValueChange',message:'Select value changed',data:{rawValue:value,typeofValue:typeof value,sentToField:value === "none" ? null : value},timestamp:Date.now(),hypothesisId:'H-B,H-C'})}).catch(()=>{});
                  // #endregion
                  field.onChange(value === "none" ? null : value);
                }}
                value={field.value || "none"}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select parent category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None (Top-level category)</SelectItem>
                  {parentCategories.map((parent) => (
                    <SelectItem key={parent.id} value={parent.id}>
                      {parent.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {form.formState.errors.parentCategoryId?.message && (
            <p className="text-sm text-destructive">
              {form.formState.errors.parentCategoryId.message}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Saving..." : isEdit ? "Save Changes" : "Create Category"}
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
  const isEdit = category !== null;

  const form = useForm<CreateIncomeCategoryInput | UpdateIncomeCategoryInput>({
    resolver: zodResolver(isEdit ? updateIncomeCategorySchema : createIncomeCategorySchema),
    defaultValues: isEdit
      ? {
          name: category.name,
        }
      : {
          name: "",
        },
  });

  async function handleSubmit(values: CreateIncomeCategoryInput | UpdateIncomeCategoryInput) {
    try {
      await onSubmit(values);
      form.reset();
    } catch (error) {
      // Error is handled by mutation
    }
  }

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{isEdit ? "Edit Category" : "Create Custom Category"}</DialogTitle>
        <DialogDescription>
          {isEdit
            ? "Update the category name."
            : "Create a new custom income category."}
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Category Name</Label>
          <Input id="name" placeholder="e.g. Bonus" {...form.register("name")} />
          {form.formState.errors.name?.message && (
            <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Saving..." : isEdit ? "Save Changes" : "Create Category"}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
