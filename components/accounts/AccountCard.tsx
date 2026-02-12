import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { AccountTypeIcon } from "./AccountTypeIcon";
import { CurrencyDisplay } from "./CurrencyDisplay";
import type { AccountWithBalance, Currency } from "@/types/account.types";

interface AccountCardProps {
  account: AccountWithBalance;
}

/**
 * Card component for displaying account information
 * Implements FR-ACC-002: View Financial Accounts
 */
export function AccountCard({ account }: AccountCardProps) {
  return (
    <Link href={`/accounts/${account.id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AccountTypeIcon type={account.type} />
              <h3 className="font-semibold text-lg">{account.name}</h3>
            </div>
            <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
              {account.type}
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Balance</span>
              <CurrencyDisplay
                amount={account.balance}
                currency={account.currency as Currency}
                className="text-lg font-semibold"
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Currency</span>
              <span className="text-sm font-medium">{account.currency}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
