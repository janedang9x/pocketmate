"use client";

import { useMemo, useState } from "react";
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
import { useLocaleContext } from "@/components/providers/LocaleProvider";
import { buildCounterpartySchemas } from "@/lib/i18n/zod/counterparty-schemas";
import type { CreateCounterpartyInput, UpdateCounterpartyInput } from "@/lib/schemas/counterparty.schema";
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
  const { messages: m } = useLocaleContext();
  const sc = m.settings.counterparties;

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
          errorData?.success === false ? errorData.error : sc.fetchError,
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
        throw new Error(result.success === false ? result.error : sc.createFailed);
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
        throw new Error(result.success === false ? result.error : sc.updateFailed);
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
        throw new Error(result.success === false ? result.error : sc.deleteFailed);
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
          <h1 className="text-3xl font-bold tracking-tight">{sc.title}</h1>
          <p className="text-muted-foreground">{sc.subtitle}</p>
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
              {sc.add}
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
          <div className="text-muted-foreground">{sc.loading}</div>
        </div>
      ) : counterparties.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-4">{sc.empty}</p>
            <p className="text-sm text-muted-foreground mb-4">{sc.emptyHint}</p>
            <Button
              onClick={() => {
                setEditingCounterparty(null);
                setDialogOpen(true);
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              {sc.add}
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
                  {counterparty.transaction_count === 1
                    ? m.common.transaction
                    : m.common.transactions}
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}

      {isFetching && data && (
        <p className="text-sm text-muted-foreground">{sc.refreshing}</p>
      )}

      <AlertDialog
        open={deletingCounterparty !== null}
        onOpenChange={(open) => !open && setDeletingCounterparty(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{sc.deleteTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {sc.deleteConfirm.replace("{name}", deletingCounterparty?.name ?? "")}
              {deletingCounterparty?.transaction_count &&
                deletingCounterparty.transaction_count > 0 && (
                  <span className="mt-2 block text-destructive">
                    {sc.hasTransactionsNote.replace(
                      "{n}",
                      String(deletingCounterparty.transaction_count),
                    )}{" "}
                    {sc.deleteBlockedNote}
                  </span>
                )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{m.common.cancel}</AlertDialogCancel>
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
              {m.common.delete}
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
  const { messages: m } = useLocaleContext();
  const sc = m.settings.counterparties;
  const schemas = useMemo(() => buildCounterpartySchemas(m), [m]);
  const isEdit = counterparty !== null;

  const form = useForm<CreateCounterpartyInput | UpdateCounterpartyInput>({
    resolver: zodResolver(isEdit ? schemas.update : schemas.create),
    defaultValues: isEdit ? { name: counterparty.name } : { name: "" },
  });

  async function handleSubmit(values: CreateCounterpartyInput | UpdateCounterpartyInput) {
    try {
      await onSubmit(values);
      form.reset();
    } catch {
      // Error surfaced via mutation
    }
  }

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{isEdit ? sc.dialogEdit : sc.dialogAdd}</DialogTitle>
        <DialogDescription>
          {isEdit ? sc.dialogEditDesc : sc.dialogCreateDesc}
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">{sc.nameLabel}</Label>
          <Input
            id="name"
            placeholder={sc.namePlaceholder}
            {...form.register("name")}
          />
          {form.formState.errors.name?.message && (
            <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
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
                ? sc.saveEdit
                : sc.saveAdd}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
