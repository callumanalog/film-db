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

        {/* Utility Row: Search + Filters — pill scale h-[44px] mobile, h-[36px] desktop, same vertical mid-point */}
        <div className="mt-12 flex flex-row flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            {searchExpanded ? (
              <form
                onSubmit={handleSearchSubmit}
                className="flex h-[44px] min-w-0 max-w-[220px] items-center gap-2 rounded-lg border border-border/60 bg-secondary/50 px-4 md:h-[36px]"
              >
                <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Search cameras..."
                  className="min-w-0 flex-1 bg-transparent text-sm font-medium text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-0 md:text-xs"
                />
                <button
                  type="button"
                  onClick={() => setSearchExpanded(false)}
                  aria-label="Close search"
                  className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </form>
            ) : (
              <button
                type="button"
                onClick={() => setSearchExpanded(true)}
                aria-label="Open search"
                className="inline-flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-lg border border-border/60 bg-secondary/50 text-muted-foreground transition-colors hover:border-primary/40 hover:bg-secondary hover:text-foreground md:h-[36px] md:w-[36px]"
              >
                <Search className="h-3.5 w-3.5" />
              </button>
            )}
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="inline-flex h-[44px] shrink-0 items-center justify-center gap-1.5 rounded-lg border border-border/60 bg-secondary/50 px-4 font-sans text-sm font-medium text-foreground transition-colors hover:border-primary/40 hover:bg-primary/5 md:h-[36px] md:text-xs"
            >
              <SlidersHorizontal className="h-3.5 w-3.5 shrink-0" aria-hidden />
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
            className="fixed left-0 top-0 z-50 flex max-h-[90dvh] w-full max-w-sm flex-col overflow-hidden border-r border-border bg-background shadow-xl"
            role="dialog"
            aria-label="Filters"
          >
            <header className="sticky top-0 z-50 flex h-14 shrink-0 items-center border-b border-border bg-white">
              <h2 className="pointer-events-none absolute left-1/2 -translate-x-1/2 font-sans text-sm font-semibold text-foreground">Filters</h2>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                aria-label="Close filters"
                className="absolute right-4 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </header>
            <div className="min-h-0 flex-1 overflow-y-auto p-4">
              {hasFilters && (
                <button
                  type="button"
                  onClick={() => {
                    router.push("/cameras");
                    setDrawerOpen(false);
                  }}
                  className="mb-4 w-full text-center text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
                >
                  Clear all filters
                </button>
              )}
              <CameraFilterSidebar brands={brands} />
            </div>
          </div>
        </>
      )}
    </>
  );
}
