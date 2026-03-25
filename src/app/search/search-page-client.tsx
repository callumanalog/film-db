"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import type { SearchPageData, SearchPageParams } from "@/app/actions/nav-cache";
import type { FilmStock } from "@/lib/types";
import type { FilmBrand } from "@/lib/types";
import { FilmStockListCard } from "@/components/film-stock-list-card";
import { SearchConsole } from "@/components/search-console";
import { SearchExploreCarousels } from "@/components/search-explore-carousels";
import { useSearchPageData } from "@/lib/nav-cache-swr";

const FILTER_PARAMS = ["brand", "type", "format", "grain", "latitude", "saturation", "bestFor", "iso"];
const DEBOUNCE_MS = 180;

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

/** Client-side filter: match search term against film name and brand (case-insensitive). Intersection with pills is already applied via SWR data. */
function filterStocksBySearchTerm(
  stocks: (FilmStock & { brand: FilmBrand })[],
  searchTerm: string
): (FilmStock & { brand: FilmBrand })[] {
  const q = searchTerm.trim().toLowerCase();
  if (!q) return stocks;
  const words = q.split(/\s+/).filter(Boolean);
  return stocks.filter((stock) => {
    const name = stock.name.toLowerCase();
    const brandName = (stock.brand?.name ?? "").toLowerCase();
    const searchable = `${brandName} ${name}`;
    return words.every((word) => searchable.includes(word));
  });
}

export interface SearchPageClientProps {
  /** Server-passed data on first load; when navigating back, SWR cache is used so this can be undefined. */
  fallbackData?: SearchPageData;
}

export function SearchPageClient({ fallbackData }: SearchPageClientProps) {
  const searchParams = useSearchParams();
  const navParams = searchParamsToNavParams(searchParams);
  const params = { ...navParams, search: undefined };
  const { data, isLoading } = useSearchPageData({ params, fallbackData });
  const hasActiveFilters = hasAnyFilter(searchParams);

  const initialSearch = searchParams.get("search")?.trim() ?? "";
  const [inputValue, setInputValue] = useState(initialSearch);
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [searchActive, setSearchActive] = useState(() => !!initialSearch || hasActiveFilters);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setInputValue(initialSearch);
    setSearchTerm(initialSearch);
    if (initialSearch || hasActiveFilters) setSearchActive(true);
  }, [initialSearch, hasActiveFilters]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSearchTerm(inputValue.trim());
      debounceRef.current = null;
    }, DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
    };
  }, [inputValue]);

  const handleClearSearch = () => {
    setInputValue("");
    setSearchTerm("");
  };

  const handleSearchActivate = useCallback(() => setSearchActive(true), []);
  const handleSearchDeactivate = useCallback(() => {
    setSearchActive(false);
    window.scrollTo({ top: 0 });
  }, []);

  const { brands = [], filterOptions = { types: [], isos: [], formats: [], grains: [], contrasts: [], latitudes: [], saturations: [], bestFor: [] }, stocks = [] } = data ?? {};

  const filteredStocks = useMemo(
    () => filterStocksBySearchTerm(stocks, searchTerm),
    [stocks, searchTerm]
  );

  const noResultsFromSearch = searchTerm.length > 0 && filteredStocks.length === 0;

  if (!data && isLoading) {
    return (
      <div className="min-h-screen bg-white">
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

  return (
    <>
      <SearchConsole
        brands={brands}
        filterOptions={filterOptions}
        hasActiveFilters={hasActiveFilters}
        searchInputValue={inputValue}
        onSearchInputChange={setInputValue}
        onClearSearch={handleClearSearch}
        searchActive={searchActive}
        onSearchActivate={handleSearchActivate}
        onSearchDeactivate={handleSearchDeactivate}
      />

      {/* Mobile: show carousels when search is not active */}
      {!searchActive && (
        <div className="mx-auto max-w-7xl bg-white px-4 pb-[88px] sm:px-6 lg:px-8 md:hidden">
          <SearchExploreCarousels stocks={stocks} />
        </div>
      )}

      {/* Search results list — always visible on desktop, mobile only when search active */}
      <div className={`mx-auto max-w-7xl bg-white px-4 pb-[88px] sm:px-6 lg:px-8 md:pb-[88px] ${searchActive ? "" : "max-md:hidden"}`}>
        <section aria-label="Film stocks">
          {noResultsFromSearch ? (
            <div className="mt-2 rounded-[7px] border border-dashed border-border bg-secondary/20 p-4 py-16 text-center">
              <p className="font-sans text-base font-semibold text-foreground">
                We&apos;re still developing that one...
              </p>
              <p className="mt-1 font-sans text-ui text-muted-foreground">
                We couldn&apos;t find any stocks matching &ldquo;{searchTerm}&rdquo;. Try a different stock name or clear filters.
              </p>
              <button
                type="button"
                onClick={handleClearSearch}
                className="mt-4 rounded-lg border border-border bg-white px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
              >
                Clear Search
              </button>
            </div>
          ) : stocks.length === 0 ? (
            <div className="rounded-[7px] border border-dashed border-border bg-secondary/20 py-16 text-center">
              <p className="text-sm font-medium text-muted-foreground">No film stocks match your filters.</p>
              <p className="mt-1 text-xs text-muted-foreground">Try clearing some filters or changing your search.</p>
            </div>
          ) : (
            <div className="space-y-0 rounded-card overflow-hidden bg-white">
              {filteredStocks.map((stock, index) => (
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
