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

/**
 * Income report API payload shapes (FR-RPT-002).
 * @see docs/api-design.md#get-apireportsincome
 */
export interface IncomeReportCategoryRow {
  categoryId: string;
  categoryName: string;
  amount: number;
  percentage: number;
  transactionCount: number;
}

export interface IncomeReportOvertimeRow {
  period: string;
  amount: number;
  transactionCount: number;
}

export interface IncomeReportData {
  summary: {
    totalIncome: number;
    transactionCount: number;
    averageIncome: number;
  };
  byCategory: IncomeReportCategoryRow[];
  overtime: IncomeReportOvertimeRow[];
}

/**
 * Comparison report API payload shapes (FR-RPT-003).
 * @see docs/api-design.md#get-apireportscomparison
 */
export interface ComparisonReportOvertimeRow {
  period: string;
  income: number;
  expense: number;
  net: number;
}

export interface ComparisonReportData {
  summary: {
    totalIncome: number;
    totalExpense: number;
    netSavings: number;
    savingsRate: number;
  };
  overtime: ComparisonReportOvertimeRow[];
}

/**
 * Financial statement API payload shapes (FR-RPT-004).
 * @see docs/api-design.md#get-apireportsstatement
 */
export interface FinancialStatementAccountRow {
  id: string;
  name: string;
  type: string;
  balance: number;
  currency: string;
}

export interface FinancialStatementCounterpartyRow {
  counterpartyId: string;
  counterpartyName: string;
  amount: number;
}

export interface FinancialStatementData {
  assets: {
    accounts: FinancialStatementAccountRow[];
    totalAssets: number;
  };
  liabilities: {
    borrowedFrom: FinancialStatementCounterpartyRow[];
    lentTo: FinancialStatementCounterpartyRow[];
    totalLiabilities: number;
  };
  netWorth: number;
}
