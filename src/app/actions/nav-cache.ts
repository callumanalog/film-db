"use server";

import { getFilmStocks, getCatalogForListings } from "@/lib/supabase/queries";
import { getFilmStockStatsForSlugs } from "@/lib/supabase/stats";
import { getLatestShots, getLatestNotes, getLatestUsers } from "@/app/actions/search";
import type { FilmType, FilmFormat, GrainFilter, ContrastFilter, LatitudeFilter, SaturationFilter, BestFor, DiscoveryVibe } from "@/lib/types";
import type { FilmFilterOptions } from "@/lib/supabase/queries";
import type { FilmStockStats } from "@/lib/supabase/stats";
import type { FilmBrand } from "@/lib/types";
import type { SearchShotsResult, SearchNotesResult, SearchUsersResult } from "@/app/actions/search";

function parseMultiParam(value: string | undefined): string[] {
  if (!value || typeof value !== "string") return [];
  return value.split(",").map((s) => s.trim()).filter(Boolean);
}

const VALID_VIBES: DiscoveryVibe[] = [
  "golden_hour",
  "soft_portraits",
  "gritty_street",
  "neon_nights",
  "vivid_landscapes",
  "experimental",
];

export interface SearchPageParams {
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
}

export interface SearchPageData {
  brands: FilmBrand[];
  filterOptions: FilmFilterOptions;
  stocks: (import("@/lib/types").FilmStock & { brand: FilmBrand })[];
  statsBySlug: Record<string, FilmStockStats>;
}

export async function getSearchPageData(params: SearchPageParams): Promise<SearchPageData> {
  const brandArr = parseMultiParam(params.brand) as string[];
  const typeArr = parseMultiParam(params.type) as FilmType[];
  const formatArr = parseMultiParam(params.format) as FilmFormat[];
  const grainArr = parseMultiParam(params.grain) as GrainFilter[];
  const contrastArr = parseMultiParam(params.contrast) as ContrastFilter[];
  const latitudeArr = parseMultiParam(params.latitude) as LatitudeFilter[];
  const saturationArr = parseMultiParam(params.saturation) as SaturationFilter[];
  const bestForArr = parseMultiParam(params.bestFor) as BestFor[];
  const isoArr = parseMultiParam(params.iso)
    .map((s) => Number(s))
    .filter((n) => !Number.isNaN(n));
  const sortParam = params.sort === "popular" ? "popular" : "alphabetical";

  const [catalog, stocksBase] = await Promise.all([
    getCatalogForListings(),
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
  const brands = catalog.brands;
  const filterOptions = catalog.filterOptions ?? {
    types: [],
    isos: [],
    formats: [],
    grains: [],
    contrasts: [],
    latitudes: [],
    saturations: [],
    bestFor: [],
  };
  const statsBySlug =
    stocksBase.length > 0 ? await getFilmStockStatsForSlugs(stocksBase.map((s) => s.slug)) : {};

  // Popularity = highest avg rating first; nulls (no ratings) last; then alphabetical tie-break
  const stocks =
    sortParam === "popular" && stocksBase.length > 0
      ? [...stocksBase].sort((a, b) => {
          const ra = statsBySlug[a.slug]?.avgRating ?? null;
          const rb = statsBySlug[b.slug]?.avgRating ?? null;
          if (ra == null && rb == null) return 0;
          if (ra == null) return 1;
          if (rb == null) return -1;
          if (rb !== ra) return rb - ra;
          const keyA = `${a.brand.name} ${a.name}`.toLowerCase();
          const keyB = `${b.brand.name} ${b.name}`.toLowerCase();
          return keyA.localeCompare(keyB);
        })
      : stocksBase;

  return { brands, filterOptions, stocks, statsBySlug };
}

export interface FilmsPageParams {
  tab?: string;
  search?: string;
  vibe?: string;
  brand?: string;
  type?: string;
  format?: string;
  grain?: string;
  contrast?: string;
  latitude?: string;
  saturation?: string;
  bestFor?: string;
  iso?: string;
  sort?: string;
  filters?: string;
}

export interface FilmsPageData {
  brands: FilmBrand[];
  filterOptions: FilmFilterOptions;
  stocks: (import("@/lib/types").FilmStock & { brand: FilmBrand })[];
  statsBySlug: Record<string, FilmStockStats>;
  loggedSlugs: string[];
  discoverTab: "shots" | "notes" | "brands" | "users" | null;
  filmsViewTab: "for-you" | "index";
  latestShots: SearchShotsResult[] | null;
  latestNotes: SearchNotesResult[] | null;
  latestUsers: SearchUsersResult[] | null;
  activeFilterCount: number;
}

export async function getFilmsPageData(params: FilmsPageParams): Promise<FilmsPageData> {
  const brandArr = parseMultiParam(params.brand);
  const typeArr = parseMultiParam(params.type) as FilmType[];
  const formatArr = parseMultiParam(params.format) as FilmFormat[];
  const grainArr = parseMultiParam(params.grain) as GrainFilter[];
  const contrastArr = parseMultiParam(params.contrast) as ContrastFilter[];
  const latitudeArr = parseMultiParam(params.latitude) as LatitudeFilter[];
  const saturationArr = parseMultiParam(params.saturation) as SaturationFilter[];
  const bestForArr = parseMultiParam(params.bestFor) as BestFor[];
  const isoArr = parseMultiParam(params.iso)
    .map((s) => Number(s))
    .filter((n) => !Number.isNaN(n));
  const vibeParam = params.vibe as DiscoveryVibe | undefined;
  const vibe = vibeParam && VALID_VIBES.includes(vibeParam) ? vibeParam : undefined;
  const sortParam = params.sort === "alphabetical" ? "alphabetical" : "highest-rated";

  const [catalog, stocksUnsorted] = await Promise.all([
    getCatalogForListings(),
    getFilmStocks({
      search: params.search,
      vibe,
      brand: brandArr.length ? brandArr : undefined,
      type: typeArr.length ? typeArr : undefined,
      format: formatArr.length ? formatArr : undefined,
      grain: grainArr.length ? grainArr : undefined,
      contrast: contrastArr.length ? contrastArr : undefined,
      latitude: latitudeArr.length ? latitudeArr : undefined,
      saturation: saturationArr.length ? saturationArr : undefined,
      bestFor: bestForArr.length ? bestForArr : undefined,
      iso: isoArr.length ? isoArr : undefined,
      sort: "alphabetical",
    }),
  ]);
  const brands = catalog.brands;
  const filterOptions = catalog.filterOptions ?? {
    types: [],
    isos: [],
    formats: [],
    grains: [],
    contrasts: [],
    latitudes: [],
    saturations: [],
    bestFor: [],
  };

  const statsBySlug =
    stocksUnsorted.length > 0 ? await getFilmStockStatsForSlugs(stocksUnsorted.map((s) => s.slug)) : {};
  const loggedSlugs: string[] = [];

  // Popularity = highest avg rating first; nulls (no ratings) last; then alphabetical tie-break
  const stocks =
    sortParam === "highest-rated"
      ? [...stocksUnsorted].sort((a, b) => {
          const ra = statsBySlug[a.slug]?.avgRating ?? null;
          const rb = statsBySlug[b.slug]?.avgRating ?? null;
          if (ra == null && rb == null) return 0;
          if (ra == null) return 1;
          if (rb == null) return -1;
          if (rb !== ra) return rb - ra;
          const keyA = `${a.brand.name} ${a.name}`.toLowerCase();
          const keyB = `${b.brand.name} ${b.name}`.toLowerCase();
          return keyA.localeCompare(keyB);
        })
      : stocksUnsorted;

  const activeFilterCount = [
    params.search,
    vibe,
    ...brandArr,
    ...typeArr,
    ...formatArr,
    ...grainArr,
    ...contrastArr,
    ...latitudeArr,
    ...saturationArr,
    ...bestForArr,
    ...isoArr,
  ].filter(Boolean).length;

  const discoverTab =
    params.tab === "shots" || params.tab === "notes" || params.tab === "brands" || params.tab === "users"
      ? params.tab
      : null;
  const filmsViewTab = params.tab === "index" ? "index" : "for-you";
  const [latestShots, latestNotes, latestUsers] = discoverTab
    ? await Promise.all([getLatestShots(), getLatestNotes(), getLatestUsers()])
    : [null, null, null];

  return {
    brands,
    filterOptions,
    stocks,
    statsBySlug,
    loggedSlugs,
    discoverTab,
    filmsViewTab,
    latestShots,
    latestNotes,
    latestUsers,
    activeFilterCount,
  };
}
