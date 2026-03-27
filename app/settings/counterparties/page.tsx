"use client";

import { useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createCounterpartySchema,
  updateCounterpartySchema,
  type CreateCounterpartyInput,
  type UpdateCounterpartyInput,
} from "@/lib/schemas/counterparty.schema";
import type { CounterpartyWithTransactionCount } from "@/types/counterparty.types";

type CounterpartiesResponse =
  | { success: true; data: { counterparties: CounterpartyWithTransactionCount[] } }
  | { success: false; error: string; code: string };

/**
 * Counterparty Management Page
 * Implements FR-CPT-001 through FR-CPT-004: Counterparty Management
 */
export default function CounterpartiesPage() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCounterparty, setEditingCounterparty] =
    useState<CounterpartyWithTransactionCount | null>(null);
  const [deletingCounterparty, setDeletingCounterparty] =
    useState<CounterpartyWithTransactionCount | null>(null);

  const { data, isLoading, isFetching } = useQuery<CounterpartiesResponse>({
    queryKey: ["counterparties"],
    queryFn: async () => {
      const token = localStorage.getItem("pm_token");
      const res = await fetch("/api/counterparties", {
        headers: { Authorization: token ? `Bearer ${token}` : "" },
      });

      if (!res.ok) {
        const errorData = (await res.json().catch(() => null)) as CounterpartiesResponse | null;
        throw new Error(
          errorData?.success === false ? errorData.error : "Failed to fetch counterparties",
        );
      }

      return (await res.json()) as CounterpartiesResponse;
    },
  });

  const counterparties = data?.success === true ? data.data.counterparties : [];

  const createMutation = useMutation({
    mutationFn: async (input: CreateCounterpartyInput) => {
      const token = localStorage.getItem("pm_token");
      const res = await fetch("/api/counterparties", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify(input),
      });

      const result = (await res.json()) as CounterpartiesResponse;

      if (!res.ok) {
        throw new Error(result.success === false ? result.error : "Failed to create counterparty");
      }

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["counterparties"] });
      setDialogOpen(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      data: input,
    }: {
      id: string;
      data: UpdateCounterpartyInput;
    }) => {
      const token = localStorage.getItem("pm_token");
      const res = await fetch(`/api/counterparties/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify(input),
      });

      const result = (await res.json()) as CounterpartiesResponse;

      if (!res.ok) {
        throw new Error(result.success === false ? result.error : "Failed to update counterparty");
      }

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["counterparties"] });
      setEditingCounterparty(null);
      setDialogOpen(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const token = localStorage.getItem("pm_token");
      const res = await fetch(`/api/counterparties/${id}`, {
        method: "DELETE",
        headers: { Authorization: token ? `Bearer ${token}` : "" },
      });

      const result = (await res.json()) as CounterpartiesResponse;

      if (!res.ok) {
        throw new Error(result.success === false ? result.error : "Failed to delete counterparty");
      }

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["counterparties"] });
      setDeletingCounterparty(null);
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Counterparty Management</h1>
          <p className="text-muted-foreground">
            Manage people and organizations you transact with (e.g., for borrow/lend or expense
            tracking).
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setEditingCounterparty(null);
                setDialogOpen(true);
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Counterparty
            </Button>
          </DialogTrigger>
          <CounterpartyDialog
            counterparty={editingCounterparty}
            onSubmit={async (input) => {
              if (editingCounterparty) {
                await updateMutation.mutateAsync({ id: editingCounterparty.id, data: input });
              } else {
                await createMutation.mutateAsync(input);
              }
            }}
            isLoading={createMutation.isPending || updateMutation.isPending}
            onClose={() => {
              setDialogOpen(false);
              setEditingCounterparty(null);
            }}
          />
        </Dialog>
      </div>

      {isLoading && !data ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">Loading counterparties...</div>
        </div>
      ) : counterparties.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-4">No counterparties yet.</p>
            <p className="text-sm text-muted-foreground mb-4">
              Add people or organizations you transact with (e.g., friends you borrow from, stores,
              employers).
            </p>
            <Button
              onClick={() => {
                setEditingCounterparty(null);
                setDialogOpen(true);
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Counterparty
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {counterparties.map((counterparty) => (
            <Card key={counterparty.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{counterparty.name}</CardTitle>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingCounterparty(counterparty);
                        setDialogOpen(true);
                      }}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeletingCounterparty(counterparty)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <CardDescription>
                  {counterparty.transaction_count}{" "}
                  {counterparty.transaction_count === 1 ? "transaction" : "transactions"}
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}

      {isFetching && data && (
        <p className="text-sm text-muted-foreground">Refreshing counterparties...</p>
      )}

      <AlertDialog
        open={deletingCounterparty !== null}
        onOpenChange={(open) => !open && setDeletingCounterparty(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Counterparty</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deletingCounterparty?.name}&quot;? This action
              cannot be undone.
              {deletingCounterparty?.transaction_count &&
                deletingCounterparty.transaction_count > 0 && (
                  <span className="mt-2 block text-destructive">
                    This counterparty has {deletingCounterparty.transaction_count} transaction(s).
                    You must remove or reassign those transactions before deleting.
                  </span>
                )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deletingCounterparty) {
                  deleteMutation.mutate(deletingCounterparty.id);
                }
              }}
              disabled={
                (deletingCounterparty?.transaction_count ?? 0) > 0 ||
                deleteMutation.isPending
              }
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

function CounterpartyDialog({
  counterparty,
  onSubmit,
  isLoading,
  onClose,
}: {
  counterparty: CounterpartyWithTransactionCount | null;
  onSubmit: (data: CreateCounterpartyInput | UpdateCounterpartyInput) => Promise<void>;
  isLoading: boolean;
  onClose: () => void;
}) {
  const isEdit = counterparty !== null;

  const form = useForm<CreateCounterpartyInput | UpdateCounterpartyInput>({
    resolver: zodResolver(isEdit ? updateCounterpartySchema : createCounterpartySchema),
    defaultValues: isEdit ? { name: counterparty.name } : { name: "" },
  });

  async function handleSubmit(values: CreateCounterpartyInput | UpdateCounterpartyInput) {
    try {
      await onSubmit(values);
      form.reset();
    } catch (error) {
      // Error surfaced via mutation
    }
  }

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{isEdit ? "Edit Counterparty" : "Add Counterparty"}</DialogTitle>
        <DialogDescription>
          {isEdit
            ? "Update the counterparty name."
            : "Add a person or organization you transact with (e.g., friend, store, employer)."}
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            placeholder="e.g. John Doe, ABC Store"
            {...form.register("name")}
          />
          {form.formState.errors.name?.message && (
            <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Saving..." : isEdit ? "Save Changes" : "Add Counterparty"}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
