"use client";

import * as React from "react";
import { ArrowLeft, Check, ChevronDown, ChevronRight } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
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
  /**
   * Full-screen dialog on narrow viewports (same implementation for category, account,
   * and counterparty pickers). Layout uses flex + min-h-0 so the option list scrolls.
   */
  mobileFullScreen?: boolean;
  /** Optional title shown in mobile full-screen picker. */
  mobileTitle?: string;
  /** Max viewport width (px) to use mobile full-screen picker. */
  mobileMaxWidth?: number;
  /** Require coarse pointer (touch-like) for mobile full-screen picker. */
  mobileRequireTouch?: boolean;
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
  mobileFullScreen = false,
  mobileTitle = "Select item",
  mobileMaxWidth = 1023,
  mobileRequireTouch = false,
  disabled,
  className,
}: SearchableSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const [contentWidth, setContentWidth] = React.useState<number>();
  const listboxId = React.useId();
  const [isMobileViewport, setIsMobileViewport] = React.useState(false);
  const isMobileDialogMode = mobileFullScreen && isMobileViewport;

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

  React.useEffect(() => {
    if (!mobileFullScreen) {
      setIsMobileViewport(false);
      return;
    }

    const widthMedia = window.matchMedia(`(max-width: ${mobileMaxWidth}px)`);
    const touchMedia = window.matchMedia("(pointer: coarse)");

    const sync = () =>
      setIsMobileViewport(
        mobileRequireTouch ? widthMedia.matches && touchMedia.matches : widthMedia.matches,
      );

    sync();
    const addMediaListener = (media: MediaQueryList, listener: () => void) => {
      if (typeof media.addEventListener === "function") {
        media.addEventListener("change", listener);
        return () => media.removeEventListener("change", listener);
      }
      media.addListener(listener);
      return () => media.removeListener(listener);
    };

    const removeWidth = addMediaListener(widthMedia, sync);
    const removeTouch = addMediaListener(touchMedia, sync);
    window.addEventListener("orientationchange", sync);
    return () => {
      removeWidth();
      removeTouch();
      window.removeEventListener("orientationchange", sync);
    };
  }, [mobileFullScreen, mobileMaxWidth, mobileRequireTouch]);

  const pickerContent = (
    <div
      className={cn(
        "flex flex-col",
        isMobileDialogMode && "min-h-0 flex-1 overflow-hidden",
      )}
    >
      {isMobileDialogMode ? (
        <div className="flex shrink-0 items-center gap-2 border-b border-border/80 px-2 py-2">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            onClick={() => setOpen(false)}
            aria-label="Back"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
          </Button>
          <p className="text-sm font-medium">{mobileTitle}</p>
        </div>
      ) : null}
      {header ? (
        <div
          className={cn(
            "z-10 border-b border-border/80 bg-popover p-1 shadow-[0_4px_8px_-4px_rgba(0,0,0,0.12)]",
            isMobileDialogMode ? "shrink-0" : "sticky top-0",
          )}
        >
          {header}
        </div>
      ) : null}
      <div className={cn("border-b border-border/80 p-2", isMobileDialogMode && "shrink-0")}>
        <Input
          placeholder={searchPlaceholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className={cn(isMobileDialogMode ? "h-10" : "h-9")}
          onKeyDown={(e) => e.stopPropagation()}
          autoFocus
          aria-label={searchPlaceholder}
        />
      </div>
      <div
        id={listboxId}
        className={cn(
          "overflow-y-auto p-1",
          isMobileDialogMode
            ? "min-h-0 flex-1 touch-pan-y [-webkit-overflow-scrolling:touch]"
            : "max-h-[min(240px,var(--radix-popover-content-available-height,240px))]",
        )}
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
                  "relative flex w-full cursor-default select-none items-center rounded-sm py-2.5 pl-8 pr-2 text-left text-sm outline-none focus:bg-accent focus:text-accent-foreground",
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
  );

  if (isMobileDialogMode) {
    return (
      <>
        <button
          ref={triggerRef}
          id={id}
          type="button"
          role="combobox"
          aria-controls={listboxId}
          aria-expanded={open}
          aria-haspopup="listbox"
          disabled={disabled}
          onClick={() => setOpen(true)}
          className={cn(
            "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1",
            !selectedLabel && "text-muted-foreground",
            className,
          )}
        >
          <span className="line-clamp-1 text-left">{selectedLabel ?? placeholder}</span>
          <ChevronRight className="h-4 w-4 shrink-0 opacity-50" aria-hidden />
        </button>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="inset-0 flex h-dvh min-h-0 w-screen max-w-none translate-x-0 translate-y-0 flex-col gap-0 overflow-hidden rounded-none p-0 data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-100 data-[state=open]:zoom-in-100 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-right-full">
            <DialogTitle className="sr-only">{mobileTitle}</DialogTitle>
            {pickerContent}
          </DialogContent>
        </Dialog>
      </>
    );
  }

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
        {pickerContent}
      </PopoverContent>
    </Popover>
  );
}
