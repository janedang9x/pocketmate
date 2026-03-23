import { z } from "zod";

const reportGroupBySchema = z.enum(["day", "week", "month", "year"]);

/**
 * Query params for GET /api/reports/expense (FR-RPT-001)
 * @see docs/api-design.md#get-apireportsexpense
 */
export const expenseReportQuerySchema = z
  .object({
    startDate: z
      .string()
      .min(1, "startDate is required")
      .refine((v) => !Number.isNaN(Date.parse(v)), { message: "Invalid startDate" }),
    endDate: z
      .string()
      .min(1, "endDate is required")
      .refine((v) => !Number.isNaN(Date.parse(v)), { message: "Invalid endDate" }),
    categoryIds: z
      .string()
      .optional()
      .transform((raw) => {
        if (raw == null || raw.trim() === "") return [] as string[];
        return raw
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
      }),
    groupBy: reportGroupBySchema.optional().default("month"),
  })
  .refine((q) => Date.parse(q.startDate) <= Date.parse(q.endDate), {
    message: "startDate must be before or equal to endDate",
    path: ["endDate"],
  });

export type ExpenseReportQueryParams = z.infer<typeof expenseReportQuerySchema>;

/**
 * Query params for GET /api/reports/income (FR-RPT-002)
 * @see docs/api-design.md#get-apireportsincome
 */
export const incomeReportQuerySchema = z
  .object({
    startDate: z
      .string()
      .min(1, "startDate is required")
      .refine((v) => !Number.isNaN(Date.parse(v)), { message: "Invalid startDate" }),
    endDate: z
      .string()
      .min(1, "endDate is required")
      .refine((v) => !Number.isNaN(Date.parse(v)), { message: "Invalid endDate" }),
    categoryIds: z
      .string()
      .optional()
      .transform((raw) => {
        if (raw == null || raw.trim() === "") return [] as string[];
        return raw
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
      }),
    groupBy: reportGroupBySchema.optional().default("month"),
  })
  .refine((q) => Date.parse(q.startDate) <= Date.parse(q.endDate), {
    message: "startDate must be before or equal to endDate",
    path: ["endDate"],
  });

export type IncomeReportQueryParams = z.infer<typeof incomeReportQuerySchema>;

/**
 * Query params for GET /api/reports/comparison (FR-RPT-003)
 * @see docs/api-design.md#get-apireportscomparison
 */
export const comparisonReportQuerySchema = z
  .object({
    startDate: z
      .string()
      .min(1, "startDate is required")
      .refine((v) => !Number.isNaN(Date.parse(v)), { message: "Invalid startDate" }),
    endDate: z
      .string()
      .min(1, "endDate is required")
      .refine((v) => !Number.isNaN(Date.parse(v)), { message: "Invalid endDate" }),
    groupBy: reportGroupBySchema.optional().default("month"),
  })
  .refine((q) => Date.parse(q.startDate) <= Date.parse(q.endDate), {
    message: "startDate must be before or equal to endDate",
    path: ["endDate"],
  });

export type ComparisonReportQueryParams = z.infer<typeof comparisonReportQuerySchema>;
