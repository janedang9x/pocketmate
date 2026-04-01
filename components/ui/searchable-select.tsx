"use client";

import * as React from "react";
import { Check, ChevronDown } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface SearchableSelectItem {
  value: string;
  label: React.ReactNode;
  /** Plain text used for case-insensitive filtering. */
  searchText: string;
}

interface SearchableSelectProps {
  id?: string;
  value: string | undefined;
  onChange: (value: string) => void;
  items: SearchableSelectItem[];
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  /** Sticky header (e.g. create-new control). */
  header?: React.ReactNode;
  disabled?: boolean;
  className?: string;
}

export function SearchableSelect({
  id,
  value,
  onChange,
  items,
  placeholder = "Select...",
  searchPlaceholder = "Search...",
  emptyText = "No matches.",
  header,
  disabled,
  className,
}: SearchableSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const [contentWidth, setContentWidth] = React.useState<number>();
  const listboxId = React.useId();

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) => item.searchText.toLowerCase().includes(q));
  }, [items, query]);

  const selectedLabel = React.useMemo(() => {
    if (value == null || value === "") return null;
    const found = items.find((i) => i.value === value);
    return found?.label ?? null;
  }, [items, value]);

  React.useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  React.useLayoutEffect(() => {
    if (open && triggerRef.current) {
      setContentWidth(triggerRef.current.offsetWidth);
    }
  }, [open]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          ref={triggerRef}
          id={id}
          type="button"
          role="combobox"
          aria-controls={listboxId}
          aria-expanded={open}
          aria-haspopup="listbox"
          disabled={disabled}
          className={cn(
            "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1",
            !selectedLabel && "text-muted-foreground",
            className,
          )}
        >
          <span className="line-clamp-1 text-left">{selectedLabel ?? placeholder}</span>
          <ChevronDown className="h-4 w-4 shrink-0 opacity-50" aria-hidden />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="p-0"
        align="start"
        style={contentWidth ? { width: contentWidth } : undefined}
      >
        <div className="flex flex-col">
          {header ? (
            <div className="sticky top-0 z-10 border-b border-border/80 bg-popover p-1 shadow-[0_4px_8px_-4px_rgba(0,0,0,0.12)]">
              {header}
            </div>
          ) : null}
          <div className="border-b border-border/80 p-2">
            <Input
              placeholder={searchPlaceholder}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-9"
              onKeyDown={(e) => e.stopPropagation()}
              autoFocus
              aria-label={searchPlaceholder}
            />
          </div>
          <div
            id={listboxId}
            className="max-h-[min(240px,var(--radix-popover-content-available-height,240px))] overflow-y-auto p-1"
            role="listbox"
          >
            {filtered.length === 0 ? (
              <p className="px-2 py-2 text-sm text-muted-foreground">{emptyText}</p>
            ) : (
              filtered.map((item) => {
                const isSelected = item.value === value;
                return (
                  <button
                    key={item.value}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    className={cn(
                      "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-left text-sm outline-none focus:bg-accent focus:text-accent-foreground",
                      isSelected && "bg-accent",
                    )}
                    onClick={() => {
                      onChange(item.value);
                      setOpen(false);
                    }}
                  >
                    {isSelected ? (
                      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                        <Check className="h-4 w-4" aria-hidden />
                      </span>
                    ) : (
                      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center" />
                    )}
                    {item.label}
                  </button>
                );
              })
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
