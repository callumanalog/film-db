"use client";

import { useSearchParams } from "next/navigation";
import type { SearchPageData, SearchPageParams } from "@/app/actions/nav-cache";
import { FilmStockListCard } from "@/components/film-stock-list-card";
import { SearchConsole } from "@/components/search-console";
import { useSearchPageData } from "@/lib/nav-cache-swr";

const FILTER_PARAMS = ["brand", "type", "format", "grain", "latitude", "saturation", "bestFor", "iso"];

/** True when a filter (not sort) is applied — carousel stays visible on scroll only for actual filters. */
function hasAnyFilter(searchParams: URLSearchParams): boolean {
  return FILTER_PARAMS.some((key) => {
    const v = searchParams.get(key);
    return v != null && v.trim() !== "";
  });
}

function searchParamsToNavParams(searchParams: URLSearchParams): SearchPageParams {
  return {
    search: searchParams.get("search") ?? undefined,
    sort: searchParams.get("sort") ?? undefined,
    brand: searchParams.get("brand") ?? undefined,
    type: searchParams.get("type") ?? undefined,
    format: searchParams.get("format") ?? undefined,
    grain: searchParams.get("grain") ?? undefined,
    contrast: searchParams.get("contrast") ?? undefined,
    latitude: searchParams.get("latitude") ?? undefined,
    saturation: searchParams.get("saturation") ?? undefined,
    bestFor: searchParams.get("bestFor") ?? undefined,
    iso: searchParams.get("iso") ?? undefined,
  };
}

export interface SearchPageClientProps {
  /** Server-passed data on first load; when navigating back, SWR cache is used so this can be undefined. */
  fallbackData?: SearchPageData;
}

export function SearchPageClient({ fallbackData }: SearchPageClientProps) {
  const searchParams = useSearchParams();
  const params = searchParamsToNavParams(searchParams);
  const { data, isLoading } = useSearchPageData({ params, fallbackData });
  const hasActiveFilters = hasAnyFilter(searchParams);

  if (!data && isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-7xl px-4 pt-4 pb-24 md:pb-8 sm:px-6 lg:px-8">
          <div className="h-12 animate-pulse rounded-lg bg-muted/50 mb-4" />
          <div className="space-y-2">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="h-24 animate-pulse rounded-lg bg-muted/30" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const { brands = [], filterOptions = { types: [], isos: [], formats: [], grains: [], contrasts: [], latitudes: [], saturations: [], bestFor: [] }, stocks = [] } = data ?? {};

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
