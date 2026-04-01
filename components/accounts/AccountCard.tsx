"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { useLocaleContext } from "@/components/providers/LocaleProvider";
import { accountTypeLabel } from "@/lib/i18n/labels";
import { AccountTypeIcon } from "./AccountTypeIcon";
import type { AccountWithBalance, Currency } from "@/types/account.types";
import { getCurrencyLabel } from "@/lib/utils/account.utils";
import { convertAmountToVnd, type VndExchangeRates } from "@/lib/utils/exchange-rate.utils";

interface AccountCardProps {
  account: AccountWithBalance;
  exchangeRates?: VndExchangeRates | null;
}

/**
 * Card component for displaying account information
 * Implements FR-ACC-002: View Financial Accounts
 */
export function AccountCard({ account, exchangeRates = null }: AccountCardProps) {
  const { messages: m } = useLocaleContext();

  const formatAmount = (value: number, curr: Currency): string => {
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: curr === "VND" ? 0 : 2,
      maximumFractionDigits: curr === "VND" ? 0 : 2,
    }).format(value);
  };
  const currency = account.currency as Currency;
  const shouldShowConvertedMain =
    exchangeRates !== null && (currency === "USD" || currency === "mace");
  const mainAmount = shouldShowConvertedMain
    ? convertAmountToVnd(account.balance, currency, exchangeRates)
    : account.balance;
  const mainCurrency: Currency = shouldShowConvertedMain ? "VND" : currency;

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
              <p className="text-sm text-muted-foreground mt-1">
                {accountTypeLabel(account.type, m.accountTypes)}
              </p>
              
              {/* Balance and Currency */}
              <div className="mt-4 flex items-start justify-between gap-2">
                <div className="flex-1">
                  <div className="text-2xl font-bold text-foreground">
                    {formatAmount(mainAmount, mainCurrency)}
                  </div>
                  {shouldShowConvertedMain && (
                    <div className="mt-1 text-sm font-medium text-muted-foreground">
                      {formatAmount(account.balance, currency)} {getCurrencyLabel(currency)}
                    </div>
                  )}
                </div>
                <div className="text-sm font-medium text-foreground/70">
                  {getCurrencyLabel(mainCurrency)}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
