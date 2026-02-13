import { Building2, CreditCard, Wallet, Banknote, CircleDot } from "lucide-react";
import type { AccountType } from "@/types/account.types";
import { cn } from "@/lib/utils";

interface AccountTypeIconProps {
  type: AccountType;
  className?: string;
  size?: number;
}

/**
 * Visual icon component for account types
 * Implements FR-ACC-002: View Financial Accounts
 */
export function AccountTypeIcon({ type, className, size = 20 }: AccountTypeIconProps) {
  const iconMap = {
    "Bank Account": Building2,
    "Credit Card": CreditCard,
    "E-wallet": Wallet,
    Cash: Banknote,
    Others: CircleDot,
  };

  const Icon = iconMap[type];

  return <Icon className={cn("text-muted-foreground", className)} size={size} />;
}
