"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AccountTypeIcon } from "@/components/accounts/AccountTypeIcon";
import { CurrencyDisplay } from "@/components/accounts/CurrencyDisplay";
import type { AccountDetails } from "@/types/account.types";
import type { Currency } from "@/types/account.types";
import { getCurrencyLabel } from "@/lib/utils/account.utils";

type AccountDetailResponse =
  | { success: true; data: { account: AccountDetails } }
  | { success: false; error: string; code: string };

/**
 * View Account Details Page
 * Implements FR-ACC-002: View Financial Accounts
 * @see docs/specifications.md#fr-acc-002-view-financial-accounts
 */
export default function AccountDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const id = params.id as string;

  const { data, isLoading, error } = useQuery<AccountDetailResponse>({
    queryKey: ["account", id],
    queryFn: async () => {
      const token = localStorage.getItem("pm_token");
      const res = await fetch(`/api/accounts/${id}`, {
        headers: { Authorization: token ? `Bearer ${token}` : "" },
      });

      const result = (await res.json()) as AccountDetailResponse;

      if (!res.ok) {
        throw new Error(result.success === false ? result.error : "Failed to fetch account");
      }

      return result;
    },
    enabled: !!id,
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const token = localStorage.getItem("pm_token");
      const res = await fetch(`/api/accounts/${id}`, {
        method: "DELETE",
        headers: { Authorization: token ? `Bearer ${token}` : "" },
      });

      const result = (await res.json()) as
        | { success: true }
        | { success: false; error: string; code: string };

      if (!res.ok) {
        throw new Error(result.success === false ? result.error : "Failed to delete account");
      }

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      setDeleteDialogOpen(false);
      router.push("/accounts");
    },
  });

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const account = data?.success === true ? data.data.account : null;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Loading account...</p>
      </div>
    );
  }

  if (error || !account) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/accounts" aria-label="Back to accounts">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
          <p className="text-sm font-medium text-destructive">
            {error instanceof Error ? error.message : "Account not found"}
          </p>
          <Button asChild className="mt-2">
            <Link href="/accounts">Back to Accounts</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/accounts" aria-label="Back to accounts">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{account.name}</h1>
            <p className="text-muted-foreground">Account details</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/accounts/${id}/edit`}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </Link>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
            onClick={() => setDeleteDialogOpen(true)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      <Link href={`/transactions?accountId=${id}`} className="block">
        <Card className="transition-colors hover:bg-muted/30">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AccountTypeIcon type={account.type} size={24} />
                <span className="text-sm font-medium text-muted-foreground">{account.type}</span>
              </div>
              <span className="rounded bg-muted px-2 py-1 text-xs text-muted-foreground">
                {getCurrencyLabel(account.currency as Currency)}
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Current balance</span>
              <CurrencyDisplay
                amount={account.balance}
                currency={account.currency as Currency}
                className="text-2xl font-semibold"
              />
            </div>
            <div className="flex items-center justify-between border-t pt-4">
              <span className="text-sm text-muted-foreground">Transactions</span>
              <span className="font-medium">{account.transactionCount}</span>
            </div>
          </CardContent>
        </Card>
      </Link>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete account</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{account.name}&quot;? This action cannot be undone.
              {account.transactionCount > 0 && (
                <span className="mt-2 block font-medium text-destructive">
                  ⚠️ Warning: This account has {account.transactionCount} transaction(s). All
                  transactions associated with this account will be permanently deleted.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          {deleteMutation.isError && (
            <div className="rounded-lg border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
              {deleteMutation.error instanceof Error
                ? deleteMutation.error.message
                : "Failed to delete account"}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={() => deleteMutation.mutate()}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete Account"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
