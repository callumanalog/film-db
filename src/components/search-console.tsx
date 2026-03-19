"use client";

import { useState, useEffect, useRef } from "react";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { SearchPageHeaderForm } from "@/components/search-page-header";
import { SearchPageHeaderFiltersButton } from "@/components/search-page-header";
import { SearchCategoryPills } from "@/components/search-category-pills";
import type { FilmBrand } from "@/lib/types";
import type { FilmFilterOptions } from "@/lib/supabase/queries";

const SCROLL_DOWN_THRESHOLD = 20;

interface SearchConsoleProps {
  brands: FilmBrand[];
  filterOptions: FilmFilterOptions;
  /** When true, carousel stays visible on scroll (e.g. when any filter is applied). */
  hasActiveFilters?: boolean;
  /** Controlled value for instant search (no Enter required). */
  searchInputValue?: string;
  onSearchInputChange?: (value: string) => void;
  onClearSearch?: () => void;
  /** Whether search mode is active (input focused, showing list + filters). Mobile only. */
  searchActive?: boolean;
  onSearchActivate?: () => void;
  onSearchDeactivate?: () => void;
}

/**
 * Search Bar + Filter Carousel in a single sticky unit.
 * Shadow appears when scrolled; carousel hides on scroll down and reappears on scroll up (unless hasActiveFilters).
 * On mobile, shows a back chevron when search is active.
 */
export function SearchConsole({
  brands,
  filterOptions,
  hasActiveFilters = false,
  searchInputValue = "",
  onSearchInputChange,
  onClearSearch,
  searchActive = false,
  onSearchActivate,
  onSearchDeactivate,
}: SearchConsoleProps) {
  const [scrolled, setScrolled] = useState(false);
  const [carouselVisible, setCarouselVisible] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 0);
      if (hasActiveFilters) {
        setCarouselVisible(true);
        return;
      }
      if (y <= 10) {
        setCarouselVisible(true);
      } else if (y > lastScrollY.current && y > SCROLL_DOWN_THRESHOLD) {
        setCarouselVisible(false);
      } else if (y < lastScrollY.current) {
        setCarouselVisible(true);
      }
      lastScrollY.current = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [hasActiveFilters]);

  const handleBack = () => {
    onClearSearch?.();
    onSearchDeactivate?.();
  };

  return (
    <header
      aria-label="Search and filters"
      className={cn(
        "sticky top-0 z-50 border-b border-slate-100 bg-background pt-4 pb-2 transition-shadow",
        scrolled && "shadow-sm"
      )}
    >
      {/* Search bar row: back chevron (mobile, when active) + search input */}
      <div className="mb-2 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2">
          {/* Back chevron — mobile only, visible when search is active */}
          <button
            type="button"
            onClick={handleBack}
            aria-label="Close search"
            className={cn(
              "flex shrink-0 items-center justify-center rounded-full p-1 text-foreground transition-all md:hidden",
              searchActive
                ? "w-8 opacity-100"
                : "w-0 overflow-hidden opacity-0 pointer-events-none"
            )}
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <div className="min-w-0 flex-1">
            <SearchPageHeaderForm
              value={searchInputValue}
              onChange={onSearchInputChange ?? (() => {})}
              onClear={onClearSearch}
              onFocus={onSearchActivate}
            />
          </div>
        </div>
      </div>

      {/* Filter pills: on mobile hidden unless search active; on desktop follows scroll-hide logic */}
      <div
        className={cn(
          "grid w-full transition-[grid-template-rows] duration-200 ease-out grid-rows-[0fr]",
          (searchActive && carouselVisible) && "max-md:grid-rows-[1fr]",
          carouselVisible && "md:grid-rows-[1fr]"
        )}
      >
        <div className="min-h-0 overflow-hidden">
          <div className="w-full overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="flex min-w-0 items-center gap-1.5">
              <div className="shrink-0 pl-4 sm:pl-6 lg:pl-8">
                <SearchPageHeaderFiltersButton />
              </div>
              <SearchCategoryPills brands={brands} filterOptions={filterOptions} />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
