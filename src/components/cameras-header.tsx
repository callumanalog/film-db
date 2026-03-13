"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useState, useEffect, useRef } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import type { CameraBrand } from "@/lib/types";
import { CameraFilterSidebar } from "@/components/camera-filter-sidebar";

interface CamerasHeaderProps {
  brands: CameraBrand[];
}

export function CamerasHeader({ brands }: CamerasHeaderProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const defaultSearch = searchParams.get("search") ?? "";

  const buildUrl = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value == null || value === "") params.delete(key);
        else params.set(key, value);
      }
      const q = params.toString();
      return q ? `/cameras?${q}` : "/cameras";
    },
    [searchParams]
  );

  const [searchInput, setSearchInput] = useState(defaultSearch);
  const [searchExpanded, setSearchExpanded] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setSearchInput(defaultSearch);
  }, [defaultSearch]);

  useEffect(() => {
    if (searchExpanded) {
      searchInputRef.current?.focus();
    }
  }, [searchExpanded]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchInput.trim();
    router.push(buildUrl({ search: q || null }));
    setSearchExpanded(false);
  };

  const hasFilters =
    !!searchParams.get("search") ||
    !!searchParams.get("brand") ||
    !!searchParams.get("type") ||
    !!searchParams.get("format");

  return (
    <>
      <header className="text-center">
        <h1 className="font-advercase text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Film Cameras
        </h1>
        <p className="mx-auto mt-2 max-w-xl font-sans text-sm text-muted-foreground sm:text-base">
          Browse classic and modern film cameras — SLRs, rangefinders, TLRs, medium format, and more.
        </p>

        {/* Utility Row: Search + Filters */}
        <div className="mt-12 flex h-8 flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            {searchExpanded ? (
              <form
                onSubmit={handleSearchSubmit}
                className="flex min-w-0 max-w-[220px] items-center gap-1.5"
              >
                <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Search cameras..."
                  className="h-7 min-w-0 flex-1 rounded-md border border-border/60 bg-secondary/50 px-2 text-sm font-medium text-foreground placeholder:text-muted-foreground/60 focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/20"
                />
                <button
                  type="button"
                  onClick={() => setSearchExpanded(false)}
                  aria-label="Close search"
                  className="rounded p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </form>
            ) : (
              <button
                type="button"
                onClick={() => setSearchExpanded(true)}
                aria-label="Open search"
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border/60 bg-secondary/50 text-muted-foreground transition-colors hover:border-primary/40 hover:bg-secondary hover:text-foreground"
              >
                <Search className="h-3.5 w-3.5" />
              </button>
            )}
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-border/60 bg-secondary/50 px-3 font-sans text-xs font-medium text-foreground hover:border-primary/40 hover:bg-primary/5"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden />
              Filters
            </button>
          </div>
        </div>
      </header>

      {drawerOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
            aria-hidden
            onClick={() => setDrawerOpen(false)}
          />
          <div
            className="fixed left-0 top-0 z-50 h-full w-full max-w-sm overflow-y-auto border-r border-border bg-background shadow-xl"
            role="dialog"
            aria-label="Filters"
          >
            <div className="sticky top-0 z-10 flex flex-col gap-2 border-b border-border bg-background px-4 py-3">
              <div className="flex items-center justify-between">
                <span className="font-sans text-sm font-semibold text-foreground">Filters</span>
                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  aria-label="Close filters"
                  className="rounded-md p-2 text-muted-foreground hover:bg-secondary hover:text-foreground"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              {hasFilters && (
                <button
                  type="button"
                  onClick={() => {
                    router.push("/cameras");
                    setDrawerOpen(false);
                  }}
                  className="w-full text-center text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
                >
                  Clear all filters
                </button>
              )}
            </div>
            <div className="p-4">
              <CameraFilterSidebar brands={brands} />
            </div>
          </div>
        </>
      )}
    </>
  );
}
