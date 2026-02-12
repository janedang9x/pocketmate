"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Plus, Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AccountCard } from "@/components/accounts/AccountCard";
import { ACCOUNT_TYPES } from "@/types/account.types";
import type { AccountWithBalance } from "@/types/account.types";

type AccountsResponse =
  | {
      success: true;
      data: {
        accounts: AccountWithBalance[];
      };
    }
  | {
      success: false;
      error: string;
      code: string;
    };

/**
 * Account List Page
 * Implements FR-ACC-002: View Financial Accounts
 * @see docs/specifications.md#fr-acc-002-view-financial-accounts
 */
export default function AccountsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  // Build query params
  const queryParams = new URLSearchParams();
  if (typeFilter !== "all") {
    queryParams.set("type", typeFilter);
  }
  if (searchQuery.trim()) {
    queryParams.set("search", searchQuery.trim());
  }

  const { data, isLoading, error } = useQuery<AccountsResponse>({
    queryKey: ["accounts", typeFilter, searchQuery],
    queryFn: async () => {
      const token = localStorage.getItem("pm_token");
      const url = `/api/accounts${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
      const res = await fetch(url, {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
      });

      if (!res.ok) {
        const errorData = (await res.json().catch(() => null)) as AccountsResponse | null;
        throw new Error(errorData?.success === false ? errorData.error : "Failed to fetch accounts");
      }

      return (await res.json()) as AccountsResponse;
    },
  });

  const accounts = data?.success === true ? data.data.accounts : [];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Accounts</h1>
          <p className="text-muted-foreground">
            Manage your financial accounts and track balances
          </p>
        </div>
        <Button asChild>
          <Link href="/accounts/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Account
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search accounts by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="w-full sm:w-[200px]">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger>
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {ACCOUNT_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="mb-2 text-muted-foreground">Loading accounts...</div>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
          <p className="text-sm font-medium text-destructive">
            Error loading accounts: {error instanceof Error ? error.message : "Unknown error"}
          </p>
        </div>
      )}

      {/* Accounts Grid */}
      {!isLoading && !error && (
        <>
          {accounts.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12">
              <p className="mb-2 text-lg font-medium">No accounts found</p>
              <p className="mb-4 text-sm text-muted-foreground">
                {searchQuery || typeFilter !== "all"
                  ? "Try adjusting your filters"
                  : "Get started by creating your first account"}
              </p>
              {!searchQuery && typeFilter === "all" && (
                <Button asChild>
                  <Link href="/accounts/new">
                    <Plus className="mr-2 h-4 w-4" />
                    Create Account
                  </Link>
                </Button>
              )}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {accounts.map((account) => (
                <AccountCard key={account.id} account={account} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
