import type { Currency } from "@/types/account.types";

const EXCHANGE_RATE_TTL_MS = 24 * 60 * 60 * 1000; // once per day
const SJC_TYPE_CODE = "SJL1L10";

export interface VndExchangeRates {
  usdToVnd: number;
  maceToVnd: number;
  fetchedAt: string;
  source: "live" | "cache";
}

let latestRatesCache: VndExchangeRates | null = null;

function isFresh(cache: VndExchangeRates | null): cache is VndExchangeRates {
  if (!cache) return false;
  return Date.now() - new Date(cache.fetchedAt).getTime() < EXCHANGE_RATE_TTL_MS;
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Exchange API failed with ${res.status}`);
  }
  return (await res.json()) as T;
}

interface VietnamGoldPricePayload {
  success?: boolean;
  buy?: number;
  data?: Array<{
    type_code?: string;
    buy?: number;
    sell?: number;
  }>;
}

async function fetchSjcBuyVndFromProvider(baseUrl: string): Promise<number> {
  const payload = await fetchJson<VietnamGoldPricePayload>(
    `${baseUrl}/api/prices?type=${SJC_TYPE_CODE}`,
  );
  const buy = payload.buy ?? payload.data?.[0]?.buy;
  if (!buy || buy <= 0) {
    throw new Error(`Invalid SJC buy payload from ${baseUrl}`);
  }
  return buy;
}

/**
 * Gets latest USD and mace exchange rates to VND.
 * Falls back to the last cached rate when providers fail.
 */
export async function getLatestVndExchangeRates(): Promise<VndExchangeRates> {
  if (isFresh(latestRatesCache)) {
    return { ...latestRatesCache, source: "cache" };
  }

  try {
    const usdPayload = await fetchJson<{ result?: string; rates?: Record<string, number> }>(
      "https://open.er-api.com/v6/latest/USD",
    );
    const usdToVnd = usdPayload.rates?.VND;
    if (!usdToVnd || usdToVnd <= 0) {
      throw new Error("Invalid USD/VND payload");
    }

    // mace uses 1/10 of SJC buy price in VND (SJC is per luong)
    // vang.today -> giavang.now
    let sjcBuyPerLuongVnd: number | null = null;
    try {
      sjcBuyPerLuongVnd = await fetchSjcBuyVndFromProvider("https://www.vang.today");
    } catch (primaryError) {
      console.error("Primary SJC provider failed (vang.today):", primaryError);
      sjcBuyPerLuongVnd = await fetchSjcBuyVndFromProvider("https://giavang.now");
    }
    const maceToVnd = sjcBuyPerLuongVnd / 10;

    const fresh: VndExchangeRates = {
      usdToVnd,
      maceToVnd,
      fetchedAt: new Date().toISOString(),
      source: "live",
    };
    latestRatesCache = fresh;
    return fresh;
  } catch (error) {
    console.error("Failed to fetch exchange rates:", error);
    if (latestRatesCache) {
      return { ...latestRatesCache, source: "cache" };
    }
    throw error;
  }
}

export function convertAmountToVnd(
  amount: number,
  currency: Currency,
  rates: Pick<VndExchangeRates, "usdToVnd" | "maceToVnd">,
): number {
  if (currency === "VND") return amount;
  if (currency === "USD") return amount * rates.usdToVnd;
  return amount * rates.maceToVnd;
}
