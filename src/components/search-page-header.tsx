"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState, useEffect } from "react";
import { Search, X } from "lucide-react";
import { Settings2 } from "lucide-react";

/** Search form only — use with flex-1 min-w-0 so it fills the header row. */
export function SearchPageHeaderForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchFromUrl = searchParams.get("search")?.trim() ?? "";
  const [value, setValue] = useState(searchFromUrl);

  useEffect(() => {
    setValue(searchFromUrl);
  }, [searchFromUrl]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const q = value.trim();
      const params = new URLSearchParams(searchParams.toString());
      if (q) params.set("search", q);
      else params.delete("search");
      const query = params.toString();
      router.push(query ? `/search?${query}` : "/search");
    },
    [value, router, searchParams]
  );

  const handleClear = () => {
    setValue("");
    const params = new URLSearchParams(searchParams.toString());
    params.delete("search");
    const query = params.toString();
    router.push(query ? `/search?${query}` : "/search");
  };

  const showClear = value.trim() !== "";

  return (
    <form
      role="search"
      onSubmit={handleSubmit}
      className="flex h-[52px] min-h-[52px] w-full min-w-0 shrink-0 items-center gap-2 rounded-card border border-border bg-white pl-3 pr-2"
    >
      <Search className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
      <input
        type="search"
        inputMode="search"
        enterKeyHint="search"
        autoComplete="off"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search film stocks"
        className="min-w-0 flex-1 border-0 bg-transparent text-sm font-medium text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-0 [&::-webkit-search-cancel-button]:appearance-none"
      />
      {showClear && (
        <button
          type="button"
          onClick={handleClear}
          aria-label="Clear search"
          className="flex shrink-0 items-center justify-center rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </form>
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
