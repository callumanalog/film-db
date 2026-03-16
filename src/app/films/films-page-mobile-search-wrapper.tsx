"use client";

import { useSearchParams } from "next/navigation";
import { useFilmsSearch } from "@/context/films-search-context";
import { MobileSearchEmptyState } from "@/components/mobile-search-empty-state";
import { MobileSearchResults } from "@/components/mobile-search-results";
import { FilmsAllFiltersSheet } from "@/components/films-all-filters-sheet";
import type { FilmBrand } from "@/lib/types";
import type { FilmFilterOptions } from "@/lib/supabase/queries";

interface FilmsPageMobileSearchWrapperProps {
  children: React.ReactNode;
  brands?: FilmBrand[];
  filterOptions?: FilmFilterOptions;
}

export function FilmsPageMobileSearchWrapper({ children, brands = [], filterOptions }: FilmsPageMobileSearchWrapperProps) {
  const searchParams = useSearchParams();
  const filmsSearch = useFilmsSearch();
  const searchQuery = searchParams.get("search")?.trim() ?? "";
  const showSearchPanel = !!(filmsSearch?.isSearchFocused || searchQuery);
  const hasFilterData = brands.length > 0 && filterOptions != null;

  return (
    <div className="min-h-screen bg-background">
      {hasFilterData && <FilmsAllFiltersSheet brands={brands} filterOptions={filterOptions} />}
      {/* Desktop: always show main content */}
      <div className="hidden md:block">
        {children}
      </div>
      {/* Mobile: main content or search panel */}
      <div className="md:hidden">
        {!showSearchPanel && children}
        {showSearchPanel && (
          <div className="mx-auto max-w-7xl bg-background px-4 pt-4 pb-8 sm:px-6 lg:px-8">
            {!searchQuery ? (
              <MobileSearchEmptyState />
            ) : (
              <MobileSearchResults searchQuery={searchQuery} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
