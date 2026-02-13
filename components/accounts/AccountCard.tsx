import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { AccountTypeIcon } from "./AccountTypeIcon";
import type { AccountWithBalance, Currency } from "@/types/account.types";

interface AccountCardProps {
  account: AccountWithBalance;
}

/**
 * Card component for displaying account information
 * Implements FR-ACC-002: View Financial Accounts
 */
export function AccountCard({ account }: AccountCardProps) {
  const formatAmount = (value: number, curr: Currency): string => {
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: curr === "VND" ? 0 : 2,
      maximumFractionDigits: curr === "VND" ? 0 : 2,
    }).format(value);
  };

  return (
    <Link href={`/accounts/${account.id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer h-full shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            {/* Icon with teal background */}
            <div className="flex-shrink-0">
              <div className="h-12 w-12 rounded-lg bg-primary flex items-center justify-center">
                <AccountTypeIcon type={account.type} className="text-white" size={24} />
              </div>
            </div>
            
            {/* Account info */}
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-lg text-foreground truncate">{account.name}</h3>
              <p className="text-sm text-muted-foreground mt-1">{account.type}</p>
              
              {/* Balance and Currency */}
              <div className="mt-4 flex items-baseline justify-between gap-2">
                <div className="flex-1">
                  <div className="text-2xl font-bold text-foreground">
                    {formatAmount(account.balance, account.currency as Currency)}
                  </div>
                </div>
                <div className="text-sm font-medium text-foreground/70">
                  {account.currency}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
