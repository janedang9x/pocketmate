/** Default series colors aligned with PocketMate teal palette (Recharts SVG). */
export const CHART_COLORS = [
  "hsl(165, 100%, 42%)",
  "hsl(210, 80%, 52%)",
  "hsl(280, 65%, 55%)",
  "hsl(35, 95%, 48%)",
  "hsl(340, 75%, 52%)",
  "hsl(145, 60%, 40%)",
  "hsl(265, 55%, 58%)",
  "hsl(200, 85%, 45%)",
] as const;

export function chartColorAt(index: number): string {
  return CHART_COLORS[index % CHART_COLORS.length];
}
