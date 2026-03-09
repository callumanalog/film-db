import { Suspense } from "react";
import type { Metadata } from "next";
import { getFilmStocks, getBrands } from "@/lib/supabase/queries";
import { FilmGrid } from "@/components/film-grid";
import { FilterSidebar } from "@/components/filter-sidebar";
import { SearchBar } from "@/components/search-bar";
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
    isoMin?: string;
    isoMax?: string;
  }>;
}

export default async function FilmsPage({ searchParams }: FilmsPageProps) {
  const params = await searchParams;
  const brands = await getBrands();
  const stocks = await getFilmStocks({
    search: params.search,
    brand: params.brand,
    type: params.type as FilmType | undefined,
    format: params.format as FilmFormat | undefined,
    grain: params.grain as GrainLevel | undefined,
    contrast: params.contrast as ContrastLevel | undefined,
    bestFor: params.bestFor as BestFor | undefined,
    isoMin: params.isoMin ? Number(params.isoMin) : undefined,
    isoMax: params.isoMax ? Number(params.isoMax) : undefined,
  });

  const filterKeys = [params.search, params.brand, params.type, params.format, params.grain, params.contrast, params.bestFor, params.isoMin];
  const activeFilterCount = filterKeys.filter(Boolean).length;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Film Stocks
        </h1>
        <p className="mt-1 text-muted-foreground">
          {stocks.length} film stock{stocks.length !== 1 ? "s" : ""}{" "}
          {activeFilterCount > 0 ? "matching your filters" : "in our database"}
        </p>
      </div>

      <div className="mb-4 max-w-md">
        <SearchBar defaultValue={params.search || ""} />
      </div>

      <div className="mb-6">
        <Suspense>
          <FilterSidebar brands={brands} />
        </Suspense>
      </div>

      <FilmGrid stocks={stocks} />
    </div>
  );
}
