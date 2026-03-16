import type { Database } from "./database.types";

/**
 * Counterparty type based on database schema
 * Implements FR-CPT-001: Create Counterparty, FR-CPT-002: List Counterparties
 */
export type Counterparty = Database["public"]["Tables"]["counterparty"]["Row"];

/**
 * Counterparty with transaction count for list display
 * Used in counterparty management UI
 */
export interface CounterpartyWithTransactionCount extends Counterparty {
  transaction_count: number;
}

export interface CreateCounterpartyInput {
  name: string;
}

export interface UpdateCounterpartyInput {
  name: string;
}
