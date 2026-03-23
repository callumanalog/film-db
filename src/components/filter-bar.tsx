"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState, startTransition, useEffect } from "react";
import { cn } from "@/lib/utils";
import type { FilmBrand } from "@/lib/types";
import type { FilmFilterOptions } from "@/lib/supabase/queries";
import { FILM_TYPE_LABELS } from "@/lib/types";
import { Sheet, SheetContent, SheetTitle, SheetHeader } from "@/components/ui/sheet";
import { FilterSidebar } from "@/components/filter-sidebar";

function getParamArray(searchParams: URLSearchParams, key: string): string[] {
  const v = searchParams.get(key);
  if (!v) return [];
  return v.split(",").map((s) => s.trim()).filter(Boolean);
}

interface FilterBarProps {
  brands: FilmBrand[];
  filterOptions: FilmFilterOptions;
}

/** Horizontal scrolling filter chips + gear that opens All Filters bottom sheet. Renders below Search Portal on films mobile. */
export function FilterBar({ brands, filterOptions }: FilterBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [allFiltersOpen, setAllFiltersOpen] = useState(false);

  useEffect(() => {
    const open = () => setAllFiltersOpen(true);
    window.addEventListener("openFilmsAllFilters", open);
    return () => window.removeEventListener("openFilmsAllFilters", open);
  }, []);

  const selectedTypes = getParamArray(searchParams, "type");
  const selectedFormats = getParamArray(searchParams, "format");

  const toggleParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      const current = getParamArray(params, key);
      const next = current.includes(value)
        ? current.filter((x) => x !== value)
        : [...current, value];
      if (next.length === 0) {
        params.delete(key);
      } else {
        params.set(key, next.join(","));
      }
      startTransition(() => {
        router.push(`/films?${params.toString()}`);
      });
    },
    [router, searchParams]
  );

  const quickTypes = filterOptions.types.slice(0, 4);
  const quickFormats = filterOptions.formats.slice(0, 5);

  return (
    <>
      <div className="flex overflow-x-auto overflow-y-hidden no-scrollbar border-b border-slate-200 bg-white shadow-[0_1px_3px_0_rgba(0,0,0,0.06)]">
        <div className="flex min-w-0 flex-1 items-center gap-2 px-3 py-2.5">
          {/* Quick chips: Type */}
          {quickTypes.map((type) => {
            const selected = selectedTypes.includes(type);
            return (
              <button
                key={type}
                type="button"
                onClick={() => toggleParam("type", type)}
                className={cn(
                  "shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
                  "border-slate-200",
                  selected
                    ? "bg-slate-800 text-white border-slate-800"
                    : "bg-white text-slate-700 hover:bg-slate-50"
                )}
              >
                {FILM_TYPE_LABELS[type] ?? type}
              </button>
            );
          })}
          {/* Quick chips: Format */}
          {quickFormats.map((format) => {
            const selected = selectedFormats.includes(format);
            return (
              <button
                key={format}
                type="button"
                onClick={() => toggleParam("format", format)}
                className={cn(
                  "shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
                  "border-slate-200",
                  selected
                    ? "bg-slate-800 text-white border-slate-800"
                    : "bg-white text-slate-700 hover:bg-slate-50"
                )}
              >
                {format}
              </button>
            );
          })}
        </div>
      </div>

      <Sheet open={allFiltersOpen} onOpenChange={setAllFiltersOpen}>
        <SheetContent
          side="bottom"
          className="max-h-[90dvh] overflow-hidden flex flex-col p-0 gap-0"
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
    </>
  );
}
