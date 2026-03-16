"use client";

import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { FilterSidebar } from "@/components/filter-sidebar";
import type { FilmBrand } from "@/lib/types";
import type { FilmFilterOptions } from "@/lib/supabase/queries";

interface FilmsAllFiltersSheetProps {
  brands: FilmBrand[];
  filterOptions: FilmFilterOptions;
}

/** Listens for openFilmsAllFilters event (e.g. from header gear) and opens the All Filters bottom sheet. */
export function FilmsAllFiltersSheet({ brands, filterOptions }: FilmsAllFiltersSheetProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleOpen = () => setOpen(true);
    window.addEventListener("openFilmsAllFilters", handleOpen);
    return () => window.removeEventListener("openFilmsAllFilters", handleOpen);
  }, []);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent
        side="bottom"
        className="max-h-[90dvh] flex flex-col overflow-hidden gap-0 p-0"
        showDragHandle
      >
        <SheetHeader className="shrink-0 border-b border-border px-4 py-3">
          <SheetTitle className="text-base font-semibold">All Filters</SheetTitle>
        </SheetHeader>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <FilterSidebar
            brands={brands}
            filterOptions={filterOptions}
            variant="drawer"
            typeDefaultOpen={true}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
