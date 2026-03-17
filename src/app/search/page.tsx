import type { Metadata } from "next";
import { getFilmStocks, getBrands, getFilmFilterOptions } from "@/lib/supabase/queries";
import { getFilmStockStatsForSlugs } from "@/lib/supabase/stats";
import type { FilmType, FilmFormat, GrainFilter, ContrastFilter, LatitudeFilter, SaturationFilter, BestFor } from "@/lib/types";
import { SearchPageClient } from "@/app/search/search-page-client";
import { FilmsAllFiltersSheet } from "@/components/films-all-filters-sheet";
import { FilmCard } from "@/components/film-card";

export const metadata: Metadata = {
  title: "Search",
  description: "Search and filter every film stock. Browse A–Z by format, type, ISO, grain, saturation, and contrast.",
};

interface SearchPageProps {
  searchParams: Promise<{
    search?: string;
    sort?: string;
    brand?: string;
    type?: string;
    format?: string;
    grain?: string;
    contrast?: string;
    latitude?: string;
    saturation?: string;
    bestFor?: string;
    iso?: string;
  }>;
}

function parseMultiParam(value: string | undefined): string[] {
  if (!value || typeof value !== "string") return [];
  return value.split(",").map((s) => s.trim()).filter(Boolean);
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const brandArr = parseMultiParam(params.brand);
  const typeArr = parseMultiParam(params.type) as FilmType[];
  const formatArr = parseMultiParam(params.format) as FilmFormat[];
  const grainArr = parseMultiParam(params.grain) as GrainFilter[];
  const contrastArr = parseMultiParam(params.contrast) as ContrastFilter[];
  const latitudeArr = parseMultiParam(params.latitude) as LatitudeFilter[];
  const saturationArr = parseMultiParam(params.saturation) as SaturationFilter[];
  const bestForArr = parseMultiParam(params.bestFor) as BestFor[];
  const isoArr = parseMultiParam(params.iso).map((s) => Number(s)).filter((n) => !Number.isNaN(n));
  const sortParam = params.sort === "popular" ? "popular" : "alphabetical";

  const [brandsRes, filterOptionsRes, stocksBase] = await Promise.all([
    getBrands(),
    getFilmFilterOptions(),
    getFilmStocks({
      search: params.search,
      brand: brandArr.length ? brandArr : undefined,
      type: typeArr.length ? typeArr : undefined,
      format: formatArr.length ? formatArr : undefined,
      grain: grainArr.length ? grainArr : undefined,
      contrast: contrastArr.length ? contrastArr : undefined,
      latitude: latitudeArr.length ? latitudeArr : undefined,
      saturation: saturationArr.length ? saturationArr : undefined,
      bestFor: bestForArr.length ? bestForArr : undefined,
      iso: isoArr.length ? isoArr : undefined,
      sort: sortParam,
    }),
  ]);
  const brands = Array.isArray(brandsRes) ? [...brandsRes].sort((a, b) => a.name.localeCompare(b.name)) : [];
  const filterOptions = filterOptionsRes ?? { types: [], isos: [], formats: [], grains: [], contrasts: [], latitudes: [], saturations: [], bestFor: [] };
  const statsBySlug = stocksBase.length > 0 ? await getFilmStockStatsForSlugs(stocksBase.map((s) => s.slug)) : {};

  // Popularity sort uses user-derived avgRating from stats, not static stock.rating
  const stocks =
    sortParam === "popular" && stocksBase.length > 0
      ? [...stocksBase].sort((a, b) => {
          const ra = statsBySlug[a.slug]?.avgRating ?? 0;
          const rb = statsBySlug[b.slug]?.avgRating ?? 0;
          if (ra !== rb) return rb - ra;
          const keyA = `${a.brand.name} ${a.name}`.toLowerCase();
          const keyB = `${b.brand.name} ${b.name}`.toLowerCase();
          return keyA.localeCompare(keyB);
        })
      : stocksBase;

  return (
    <div className="min-h-screen bg-background">
      <FilmsAllFiltersSheet brands={brands} filterOptions={filterOptions} />
      <SearchPageClient
        brands={brands}
        filterOptions={filterOptions}
        stocks={stocks}
        statsBySlug={statsBySlug}
      />
    </div>
  );
}
