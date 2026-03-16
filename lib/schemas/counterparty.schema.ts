import { z } from "zod";

/**
 * Schema for creating a new counterparty
 * Implements FR-CPT-001: Create Counterparty
 */
export const createCounterpartySchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Counterparty name is required")
    .max(200, "Counterparty name must be at most 200 characters"),
});

export type CreateCounterpartyInput = z.infer<typeof createCounterpartySchema>;

/**
 * Schema for updating an existing counterparty
 * Implements FR-CPT-003: Update Counterparty
 */
export const updateCounterpartySchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Counterparty name is required")
    .max(200, "Counterparty name must be at most 200 characters"),
});

export type UpdateCounterpartyInput = z.infer<typeof updateCounterpartySchema>;
