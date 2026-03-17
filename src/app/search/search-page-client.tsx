"use client";

import { useSearchParams } from "next/navigation";
import type { FilmBrand } from "@/lib/types";
import type { FilmFilterOptions } from "@/lib/supabase/queries";
import type { FilmStockStats } from "@/lib/supabase/stats";
import { FilmStockListCard } from "@/components/film-stock-list-card";
import { SearchConsole } from "@/components/search-console";

const FILTER_PARAMS = ["brand", "type", "format", "grain", "latitude", "saturation", "bestFor", "iso"];

/** True when a filter (not sort) is applied — carousel stays visible on scroll only for actual filters. */
function hasAnyFilter(searchParams: URLSearchParams): boolean {
  return FILTER_PARAMS.some((key) => {
    const v = searchParams.get(key);
    return v != null && v.trim() !== "";
  });
}

interface SearchPageClientProps {
  brands: FilmBrand[];
  filterOptions: FilmFilterOptions;
  stocks: (import("@/lib/types").FilmStock & { brand: FilmBrand })[];
  statsBySlug: Record<string, FilmStockStats>;
}

export function SearchPageClient({ brands, filterOptions, stocks }: SearchPageClientProps) {
  const searchParams = useSearchParams();
  const hasActiveFilters = hasAnyFilter(searchParams);

  return (
    <>
      <SearchConsole brands={brands} filterOptions={filterOptions} hasActiveFilters={hasActiveFilters} />

      <div className="mx-auto max-w-7xl bg-white px-4 pt-4 pb-24 md:pb-8 sm:px-6 lg:px-8">
        <section aria-label="Film stocks">
        {stocks.length === 0 ? (
          <div className="rounded-[7px] border border-dashed border-border bg-secondary/20 py-16 text-center">
            <p className="text-sm font-medium text-muted-foreground">No film stocks match your filters.</p>
            <p className="mt-1 text-xs text-muted-foreground">Try clearing some filters or changing your search.</p>
          </div>
        ) : (
          <div className="space-y-0 rounded-card overflow-hidden bg-white">
            {stocks.map((stock, index) => (
              <FilmStockListCard
                key={stock.id}
                stock={stock}
                priority={index < 8}
              />
            ))}
          </div>
        )}
        </section>
      </div>
    </>
  );
}
