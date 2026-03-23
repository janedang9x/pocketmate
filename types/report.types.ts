/**
 * Expense report API payload shapes (FR-RPT-001).
 * @see docs/api-design.md#get-apireportsexpense
 */

export interface ExpenseReportSubcategory {
  categoryId: string;
  categoryName: string;
  amount: number;
  percentage: number;
  transactionCount: number;
}

export interface ExpenseReportCategoryRow {
  categoryId: string;
  categoryName: string;
  amount: number;
  percentage: number;
  transactionCount: number;
  subcategories: ExpenseReportSubcategory[];
}

export interface ExpenseReportOvertimeRow {
  period: string;
  amount: number;
  transactionCount: number;
}

export interface ExpenseReportData {
  summary: {
    totalExpense: number;
    transactionCount: number;
    averageExpense: number;
  };
  byCategory: ExpenseReportCategoryRow[];
  overtime: ExpenseReportOvertimeRow[];
}
