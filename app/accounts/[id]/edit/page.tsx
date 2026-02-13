"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AccountForm } from "@/components/accounts/AccountForm";
import { type UpdateAccountInput } from "@/lib/schemas/account.schema";
import type { AccountDetails } from "@/types/account.types";

type AccountDetailResponse =
  | { success: true; data: { account: AccountDetails } }
  | { success: false; error: string; code: string };

type UpdateResponse =
  | { success: true; data: { account: unknown }; message?: string }
  | { success: false; error: string; code: string };

/**
 * Edit Account Page
 * Implements FR-ACC-003: Edit Financial Account
 * @see docs/specifications.md#fr-acc-003-edit-financial-account
 */
export default function EditAccountPage() {
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

  const updateMutation = useMutation({
    mutationFn: async (payload: UpdateAccountInput) => {
      const token = localStorage.getItem("pm_token");
      const res = await fetch(`/api/accounts/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify(payload),
      });

      const result = (await res.json()) as UpdateResponse;

      if (!res.ok) {
        throw new Error(result.success === false ? result.error : "Failed to update account");
      }

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      queryClient.invalidateQueries({ queryKey: ["account", id] });
      router.push(`/accounts/${id}`);
    },
  });

  const account = data?.success === true ? data.data.account : null;

  async function handleSubmit(values: UpdateAccountInput) {
    await updateMutation.mutateAsync(values);
  }

  if (isLoading || !account) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">
          {isLoading ? "Loading account..." : "Account not found"}
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/accounts" aria-label="Back to accounts">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
          <p className="text-sm font-medium text-destructive">
            {error instanceof Error ? error.message : "Failed to load account"}
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
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/accounts/${id}`} aria-label="Back to account">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Account</h1>
          <p className="text-muted-foreground">
            Update account name and type. Currency and opening balance cannot be changed when
            transactions exist.
          </p>
        </div>
      </div>

      {updateMutation.isError && (
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
          <p className="text-sm font-medium text-destructive">
            {updateMutation.error instanceof Error
              ? updateMutation.error.message
              : "Something went wrong"}
          </p>
        </div>
      )}

      <AccountForm
        mode="edit"
        defaultValues={{
          name: account.name,
          type: account.type,
        }}
        onSubmit={handleSubmit}
        isLoading={updateMutation.isPending}
        submitLabel="Save Changes"
      />
    </div>
  );
}
