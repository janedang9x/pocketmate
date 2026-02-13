"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AccountForm } from "@/components/accounts/AccountForm";
import type { CreateAccountInput, UpdateAccountInput } from "@/lib/schemas/account.schema";

type CreateResponse =
  | { success: true; data: { account: { id: string } }; message?: string }
  | { success: false; error: string; code: string };

/**
 * Create Account Page
 * Implements FR-ACC-001: Create Financial Account
 * @see docs/specifications.md#fr-acc-001-create-financial-account
 */
export default function NewAccountPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: async (data: CreateAccountInput) => {
      const token = localStorage.getItem("pm_token");
      const res = await fetch("/api/accounts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify(data),
      });

      const result = (await res.json()) as CreateResponse;

      if (!res.ok) {
        throw new Error(result.success === false ? result.error : "Failed to create account");
      }

      if (!result.success || !result.data?.account) {
        throw new Error("Invalid response from server");
      }

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      router.push("/accounts");
    },
  });

  async function handleSubmit(data: CreateAccountInput | UpdateAccountInput) {
    await createMutation.mutateAsync(data as CreateAccountInput);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/accounts" aria-label="Back to accounts">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create Account</h1>
          <p className="text-muted-foreground">
            Add a new financial account. Opening balance is recorded as the first transaction.
          </p>
        </div>
      </div>

      {createMutation.isError && (
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
          <p className="text-sm font-medium text-destructive">
            {createMutation.error instanceof Error
              ? createMutation.error.message
              : "Something went wrong"}
          </p>
        </div>
      )}

      <AccountForm
        onSubmit={handleSubmit}
        isLoading={createMutation.isPending}
        submitLabel="Create Account"
      />
    </div>
  );
}
