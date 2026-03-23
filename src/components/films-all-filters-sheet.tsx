"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Sheet, SheetContent, SheetClose, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { XIcon } from "lucide-react";
import { FilterSidebar } from "@/components/filter-sidebar";
import type { FilmBrand } from "@/lib/types";
import type { FilmFilterOptions } from "@/lib/supabase/queries";

interface FilmsAllFiltersSheetProps {
  brands: FilmBrand[];
  filterOptions: FilmFilterOptions;
}

/** Detail for openFilmsAllFilters: optional category to open (e.g. "Type", "Format"). */
export type OpenFilmsAllFiltersDetail = { category?: string };

/** Listens for openFilmsAllFilters event (e.g. from header gear or search page) and opens the All Filters bottom sheet. */
export function FilmsAllFiltersSheet({ brands, filterOptions }: FilmsAllFiltersSheetProps) {
  const [open, setOpen] = useState(false);
  const [initialOpenCategory, setInitialOpenCategory] = useState<string | undefined>(undefined);
  const router = useRouter();
  const pathname = usePathname() ?? "/films";
  const searchParams = useSearchParams();
  const basePath = pathname.startsWith("/search") ? "/search" : "/films";

  useEffect(() => {
    const handleOpen = (e: Event) => {
      const detail = (e as CustomEvent<OpenFilmsAllFiltersDetail>).detail;
      setInitialOpenCategory(detail?.category);
      setOpen(true);
    };
    window.addEventListener("openFilmsAllFilters", handleOpen);
    return () => window.removeEventListener("openFilmsAllFilters", handleOpen);
  }, []);

  const handleClear = () => {
    router.push(basePath);
    setOpen(false);
  };

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) setInitialOpenCategory(undefined);
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        side="bottom"
        className="max-h-[90dvh] flex flex-col overflow-hidden gap-0 p-0"
        showCloseButton={false}
      >
        <SheetHeader className="flex shrink-0 flex-row items-center justify-between gap-2 border-b border-border px-4 py-3">
          <SheetTitle className="text-base font-semibold">Filter & Sort</SheetTitle>
          <SheetClose
            render={
              <Button variant="ghost" size="icon-sm" className="shrink-0" aria-label="Close" />
            }
          >
            <XIcon />
          </SheetClose>
        </SheetHeader>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <FilterSidebar
            brands={brands}
            filterOptions={filterOptions}
            variant="drawer"
            typeDefaultOpen={!initialOpenCategory}
            initialOpenCategory={initialOpenCategory}
          />
        </div>
        <div className="shrink-0 flex flex-col gap-2 border-t border-border bg-background px-4 py-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="w-full rounded-card bg-primary py-3 font-sans text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Apply filters
          </button>
          <button
            type="button"
            onClick={handleClear}
            className="w-full py-2 text-center font-sans text-sm text-muted-foreground transition-colors hover:text-foreground hover:underline"
          >
            Clear filters
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
