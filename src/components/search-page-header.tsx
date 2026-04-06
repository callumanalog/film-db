"use client";

import { Search, Settings2, X } from "lucide-react";
import type { KeyboardEvent } from "react";
import { cn } from "@/lib/utils";

interface SearchPageHeaderFormProps {
  /** Controlled value for instant-as-you-type filtering. */
  value: string;
  onChange: (value: string) => void;
  onClear?: () => void;
  onFocus?: () => void;
  onKeyDown?: (e: KeyboardEvent<HTMLInputElement>) => void;
  autoFocus?: boolean;
  autoComplete?: string;
  placeholder?: string;
  ariaLabel?: string;
  /** Leading magnifier; use for catalog search (e.g. cameras, labs), not free-text metadata fields. */
  showSearchIcon?: boolean;
}

/** Search input only — instant filter on change (debounced by parent). No Enter required. */
export function SearchPageHeaderForm({
  value,
  onChange,
  onClear,
  onFocus,
  onKeyDown,
  autoFocus = false,
  autoComplete = "off",
  placeholder = "Search film stocks",
  ariaLabel = "Search film stocks",
  showSearchIcon = false,
}: SearchPageHeaderFormProps) {
  const showClear = value.trim() !== "";

  return (
    <div
      role="search"
      className={cn(
        "flex h-[52px] min-h-[52px] w-full min-w-0 shrink-0 items-center rounded-card border border-border bg-background pr-2",
        showSearchIcon ? "gap-2 pl-3" : "pl-4"
      )}
    >
      {showSearchIcon ? (
        <Search className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
      ) : null}
      <input
        type="search"
        inputMode="search"
        enterKeyHint="search"
        autoComplete={autoComplete}
        autoFocus={autoFocus}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={onFocus}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        className="min-w-0 flex-1 border-0 bg-transparent text-sm font-medium text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-0 [&::-webkit-search-cancel-button]:appearance-none"
        aria-label={ariaLabel}
      />
      {showClear && onClear && (
        <button
          type="button"
          onClick={onClear}
          aria-label="Clear search"
          className="flex shrink-0 items-center justify-center rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

/** All filters icon button — 44px touch target, left-aligned. Opens sheet with Format category expanded. */
export function SearchPageHeaderFiltersButton() {
  const openAllFilters = () => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("openFilmsAllFilters", { detail: { category: "Format" } }));
    }
  };
  return (
    <button
      type="button"
      onClick={openAllFilters}
      className="flex h-11 min-h-[44px] min-w-[44px] w-11 shrink-0 items-center justify-center rounded-card border border-border bg-card text-foreground transition-colors hover:bg-accent/50"
      aria-label="All filters"
    >
      <Settings2 className="h-5 w-5 text-muted-foreground" />
    </button>
  );
}
