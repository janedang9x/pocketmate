import Link from "next/link";
import {
  ArrowRight,
  GitCompareArrows,
  PieChart,
  Scale,
  TrendingUp,
} from "lucide-react";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

/**
 * Reports hub — links to expense, income, comparison, and statement reports (Phase 4).
 */
export default function ReportsPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
        <p className="mt-1 text-muted-foreground">
          Analytics and breakdowns for your finances
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link href="/reports/expense" className="block transition-opacity hover:opacity-90">
          <Card className="h-full shadow-sm">
            <CardHeader>
              <div className="flex items-start justify-between gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10">
                  <PieChart className="h-5 w-5 text-destructive" aria-hidden />
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
              </div>
              <CardTitle className="text-lg">Expense report</CardTitle>
              <CardDescription>
                Totals, category mix, and spending over time (FR-RPT-001)
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/reports/income" className="block transition-opacity hover:opacity-90">
          <Card className="h-full shadow-sm">
            <CardHeader>
              <div className="flex items-start justify-between gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
                  <TrendingUp className="h-5 w-5 text-emerald-600" aria-hidden />
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
              </div>
              <CardTitle className="text-lg">Income report</CardTitle>
              <CardDescription>
                Totals, source mix, and inflow trends over time (FR-RPT-002)
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/reports/comparison" className="block transition-opacity hover:opacity-90">
          <Card className="h-full shadow-sm">
            <CardHeader>
              <div className="flex items-start justify-between gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                  <GitCompareArrows className="h-5 w-5 text-blue-600" aria-hidden />
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
              </div>
              <CardTitle className="text-lg">Comparison report</CardTitle>
              <CardDescription>
                Income vs expense totals, savings rate, and trends (FR-RPT-003)
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/reports/statement" className="block transition-opacity hover:opacity-90">
          <Card className="h-full shadow-sm">
            <CardHeader>
              <div className="flex items-start justify-between gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-500/10">
                  <Scale className="h-5 w-5 text-violet-600" aria-hidden />
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
              </div>
              <CardTitle className="text-lg">Financial statement</CardTitle>
              <CardDescription>
                Assets, liabilities, and net worth snapshot (FR-RPT-004)
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>
      </div>
    </div>
  );
}
