"use client";

import { useSearchParams } from "next/navigation";
import { useFilmsSearch } from "@/context/films-search-context";
import { RecentSearches } from "@/components/recent-searches";
import { MobileSearchResults } from "@/components/mobile-search-results";

export function FilmsPageMobileSearchWrapper({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams();
  const filmsSearch = useFilmsSearch();
  const searchQuery = searchParams.get("search")?.trim() ?? "";
  const showSearchPanel = !!(filmsSearch?.isSearchFocused || searchQuery);

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop: always show main content */}
      <div className="hidden md:block">
        {children}
      </div>
      {/* Mobile: show main content only when not in search panel */}
      <div className="md:hidden">
        {!showSearchPanel && children}
        {showSearchPanel && (
          <div className="mx-auto max-w-7xl px-4 pt-4 pb-8 sm:px-6 lg:px-8">
            {!searchQuery ? (
              <RecentSearches />
            ) : (
              <MobileSearchResults searchQuery={searchQuery} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
