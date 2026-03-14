"use client";

import { FilterSidebar } from "@/components/filter-sidebar";
import type { FilmBrand } from "@/lib/types";
import type { FilmFilterOptions } from "@/lib/supabase/queries";

interface FiltersLeftPaneProps {
  brands: FilmBrand[];
  filterOptions: FilmFilterOptions;
  children: React.ReactNode;
}

/** Left pane: table-style filters only (no header, no close, no Apply/Clear). Filters apply on change. */
export function FiltersLeftPane({ brands, filterOptions, children }: FiltersLeftPaneProps) {
  return (
    <div className="flex w-full gap-0">
      <aside
        className="hidden min-w-0 shrink border-r border-slate-100 bg-background md:block md:min-w-[200px] md:max-w-sm md:w-64"
        aria-label="Filters"
      >
        <div className="overflow-y-auto pb-3 pl-0 pr-4 pt-0">
          <FilterSidebar brands={brands} filterOptions={filterOptions} variant="specs" />
        </div>
      </aside>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
