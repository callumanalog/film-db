"use client";

import { useState, useEffect, useRef } from "react";
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
}

/**
 * Search Bar + Filter Carousel in a single sticky unit.
 * Shadow appears when scrolled; carousel hides on scroll down and reappears on scroll up (unless hasActiveFilters).
 */
export function SearchConsole({
  brands,
  filterOptions,
  hasActiveFilters = false,
  searchInputValue = "",
  onSearchInputChange,
  onClearSearch,
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

  return (
    <header
      aria-label="Search and filters"
      className={cn(
        "sticky top-0 z-50 border-b border-slate-100 bg-background pt-4 pb-2 transition-shadow",
        scrolled && "shadow-sm"
      )}
    >
      {/* Search bar: aligned with page content, reduced bottom margin */}
      <div className="mb-2 px-4 sm:px-6 lg:px-8">
        <SearchPageHeaderForm
          value={searchInputValue}
          onChange={onSearchInputChange ?? (() => {})}
          onClear={onClearSearch}
        />
      </div>

      {/* Full-bleed filter carousel: hides on scroll down, reappears on scroll up */}
      <div
        className={cn(
          "grid w-full transition-[grid-template-rows] duration-200 ease-out",
          carouselVisible ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
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
