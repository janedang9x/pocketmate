import type { Currency } from "@/types/account.types";

interface CurrencyDisplayProps {
  amount: number;
  currency: Currency;
  className?: string;
}

/**
 * Formats and displays currency amounts
 * Supports VND, USD, and mace currencies
 */
export function CurrencyDisplay({ amount, currency, className }: CurrencyDisplayProps) {
  const formatAmount = (value: number, curr: Currency): string => {
    // Format number with appropriate decimal places
    const formatted = new Intl.NumberFormat("en-US", {
      minimumFractionDigits: curr === "VND" ? 0 : 2,
      maximumFractionDigits: curr === "VND" ? 0 : 2,
    }).format(value);

    return `${formatted} ${curr}`;
  };

  return <span className={className}>{formatAmount(amount, currency)}</span>;
}
