import { Suspense } from "react";
import type { Metadata } from "next";
import { getFilmStocks, getBrands, getFilmFilterOptions } from "@/lib/supabase/queries";
import { FilmGrid } from "@/components/film-grid";
import { FilterSidebar } from "@/components/filter-sidebar";
import { FilmsSortBar } from "@/components/films-sort-bar";
import { SearchBar } from "@/components/search-bar";
import { ActiveFilterChips } from "@/components/active-filter-chips";
import { ClearFiltersLink } from "@/components/clear-filters-link";
import type { FilmType, FilmFormat, GrainLevel, ContrastLevel, BestFor } from "@/lib/types";

export const metadata: Metadata = {
  title: "Film Stocks",
  description: "Browse and filter every film stock — color negative, slide, black & white, and more.",
};

interface FilmsPageProps {
  searchParams: Promise<{
    search?: string;
    brand?: string;
    type?: string;
    format?: string;
    grain?: string;
    contrast?: string;
    bestFor?: string;
    iso?: string;
    sort?: string;
  }>;
}

function parseMultiParam(value: string | undefined): string[] {
  if (!value || typeof value !== "string") return [];
  return value.split(",").map((s) => s.trim()).filter(Boolean);
}

export default async function FilmsPage({ searchParams }: FilmsPageProps) {
  const params = await searchParams;
  const brands = (await getBrands()).sort((a, b) =>
    a.name.localeCompare(b.name)
  );
  const filterOptions = await getFilmFilterOptions();

  const brandArr = parseMultiParam(params.brand);
  const typeArr = parseMultiParam(params.type) as FilmType[];
  const formatArr = parseMultiParam(params.format) as FilmFormat[];
  const grainArr = parseMultiParam(params.grain) as GrainLevel[];
  const contrastArr = parseMultiParam(params.contrast) as ContrastLevel[];
  const bestForArr = parseMultiParam(params.bestFor) as BestFor[];
  const isoArr = parseMultiParam(params.iso).map((s) => Number(s)).filter((n) => !Number.isNaN(n));

  const stocks = await getFilmStocks({
    search: params.search,
    brand: brandArr.length ? brandArr : undefined,
    type: typeArr.length ? typeArr : undefined,
    format: formatArr.length ? formatArr : undefined,
    grain: grainArr.length ? grainArr : undefined,
    contrast: contrastArr.length ? contrastArr : undefined,
    bestFor: bestForArr.length ? bestForArr : undefined,
    iso: isoArr.length ? isoArr : undefined,
    sort: params.sort === "alphabetical" ? "alphabetical" : "popular",
  });

  const activeFilterCount = [
    params.search,
    ...brandArr,
    ...typeArr,
    ...formatArr,
    ...grainArr,
    ...contrastArr,
    ...bestForArr,
    ...isoArr,
  ].filter(Boolean).length;

  return (
    <div className="mx-auto max-w-7xl px-4 pt-20 pb-8 sm:px-6 sm:pt-24 lg:px-8">
      <header className="mb-10 text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl font-advercase">
          Film Stocks
        </h1>
        <p className="mt-1 text-muted-foreground">
          {stocks.length} film stock{stocks.length !== 1 ? "s" : ""}{" "}
          {activeFilterCount > 0 ? "matching your filters" : "in our database"}
        </p>
      </header>

      <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
        <aside className="w-full shrink-0 lg:w-56 xl:w-60 lg:sticky lg:top-24 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto lg:pr-4 space-y-4">
          <div className="hidden h-[3.75rem] shrink-0 lg:block" aria-hidden />
          <SearchBar defaultValue={params.search || ""} className="w-full" />
          <Suspense>
            <ClearFiltersLink />
          </Suspense>
          <Suspense>
            <FilterSidebar brands={brands} filterOptions={filterOptions} />
          </Suspense>
        </aside>
        <main className="min-w-0 flex-1">
          <div className="mb-2 flex min-h-10 items-center justify-end">
            <Suspense>
              <FilmsSortBar
                currentSort={params.sort === "alphabetical" ? "alphabetical" : "popular"}
              />
            </Suspense>
          </div>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0 flex-1 flex items-center">
              <Suspense>
                <ActiveFilterChips brands={brands} />
              </Suspense>
            </div>
          </div>
          <FilmGrid stocks={stocks} />
        </main>
      </div>
    </div>
  );
}
