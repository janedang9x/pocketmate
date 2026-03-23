"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface FilterPanelProps {
  title?: string;
  description?: string;
  /** Filter controls */
  children: React.ReactNode;
  className?: string;
  /** Uncontrolled default collapsed (mobile-friendly) */
  defaultCollapsed?: boolean;
  /** Controlled collapsed state */
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
}

/**
 * Collapsible report filter region (date range, categories, accounts, etc.).
 * Sprint 4.1 — Report Infrastructure
 */
export function FilterPanel({
  title = "Filters",
  description,
  children,
  className,
  defaultCollapsed = false,
  collapsed: collapsedProp,
  onCollapsedChange,
}: FilterPanelProps) {
  const [internalCollapsed, setInternalCollapsed] = useState(defaultCollapsed);
  const isControlled = collapsedProp !== undefined;
  const collapsed = isControlled ? collapsedProp : internalCollapsed;

  function setCollapsed(next: boolean) {
    if (!isControlled) {
      setInternalCollapsed(next);
    }
    onCollapsedChange?.(next);
  }

  return (
    <Card className={cn(className)}>
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-4">
        <div className="space-y-1">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Filter className="h-4 w-4 text-muted-foreground" aria-hidden />
            {title}
          </CardTitle>
          {description ? <CardDescription>{description}</CardDescription> : null}
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="shrink-0 gap-1"
          onClick={() => setCollapsed(!collapsed)}
          aria-expanded={!collapsed}
        >
          {collapsed ? (
            <>
              Show
              <ChevronDown className="h-4 w-4" aria-hidden />
            </>
          ) : (
            <>
              Hide
              <ChevronUp className="h-4 w-4" aria-hidden />
            </>
          )}
        </Button>
      </CardHeader>
      {!collapsed ? (
        <CardContent className="grid gap-4 border-t pt-4">{children}</CardContent>
      ) : null}
    </Card>
  );
}
