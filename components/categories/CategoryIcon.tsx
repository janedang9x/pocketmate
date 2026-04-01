"use client";

import { cn } from "@/lib/utils";
import { getCategoryIconComponent, getCategoryIconName } from "@/lib/category-icons";

interface CategoryIconProps {
  icon: string | null | undefined;
  name: string;
  kind: "expense" | "income";
  className?: string;
}

export function CategoryIcon({ icon, name, kind, className }: CategoryIconProps) {
  const iconName = getCategoryIconName(icon, name, kind);
  const Icon = getCategoryIconComponent(iconName);

  return <Icon className={cn("h-4 w-4 shrink-0", className)} aria-hidden />;
}
