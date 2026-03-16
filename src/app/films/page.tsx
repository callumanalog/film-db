import type { Metadata } from "next";
import { getFilmStocks, getBrands, getFilmFilterOptions } from "@/lib/supabase/queries";
import { getFilmStockStatsForSlugs } from "@/lib/supabase/stats";
import { getVaultRolls } from "@/app/actions/user-actions";
import { getLatestShots, getLatestNotes, getLatestUsers } from "@/app/actions/search";
import { FilmsListingClient } from "@/app/films/films-listing-client";
import { FilmsPageMobileSearchWrapper } from "@/app/films/films-page-mobile-search-wrapper";
import { DiscoverTabPanels } from "@/app/films/discover-tab-panels";
import { DiscoveryHeader } from "@/components/discovery-header";
import { FiltersLeftPane } from "@/components/filters-left-pane";
import { FilmsSortBar } from "@/components/films-sort-bar";
import type { FilmType, FilmFormat, GrainFilter, ContrastFilter, LatitudeFilter, SaturationFilter, BestFor, DiscoveryVibe } from "@/lib/types";

export const metadata: Metadata = {
  title: "Film Stocks",
  description: "Browse and filter every film stock — color negative, slide, black & white, and more.",
};

interface FilmsPageProps {
  searchParams: Promise<{
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
  }>;
}

function parseMultiParam(value: string | undefined): string[] {
  if (!value || typeof value !== "string") return [];
  return value.split(",").map((s) => s.trim()).filter(Boolean);
}

export default async function FilmsPage({ searchParams }: FilmsPageProps) {
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
  const vibeParam = params.vibe as DiscoveryVibe | undefined;
  const validVibes: DiscoveryVibe[] = [
    "golden_hour",
    "soft_portraits",
    "gritty_street",
    "neon_nights",
    "vivid_landscapes",
    "experimental",
  ];
  const vibe = vibeParam && validVibes.includes(vibeParam) ? vibeParam : undefined;
  const sortParam = params.sort === "alphabetical" ? "alphabetical" : "highest-rated";

  const [brandsRes, filterOptionsRes, stocksUnsorted] = await Promise.all([
    getBrands(),
    getFilmFilterOptions(),
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
  const brands = Array.isArray(brandsRes) ? [...brandsRes].sort((a, b) => a.name.localeCompare(b.name)) : [];
  const filterOptions = filterOptionsRes ?? { types: [], isos: [], formats: [], grains: [], contrasts: [], latitudes: [], saturations: [], bestFor: [] };

  const statsBySlug = stocksUnsorted.length > 0 ? await getFilmStockStatsForSlugs(stocksUnsorted.map((s) => s.slug)) : {};
  const vaultRolls = await getVaultRolls();
  const loggedSlugs = [...new Set(vaultRolls.map((r) => r.film_stock_slug))];

  const stocks =
    sortParam === "highest-rated"
      ? [...stocksUnsorted].sort((a, b) => {
          const ra = statsBySlug[a.slug]?.avgRating ?? null;
          const rb = statsBySlug[b.slug]?.avgRating ?? null;
          if (ra == null && rb == null) return 0;
          if (ra == null) return 1;
          if (rb == null) return -1;
          return rb - ra;
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

  const discoverTab = params.tab === "shots" || params.tab === "notes" || params.tab === "brands" || params.tab === "users" ? params.tab : null;
  const [latestShots, latestNotes, latestUsers] = discoverTab
    ? await Promise.all([getLatestShots(), getLatestNotes(), getLatestUsers()])
    : [null, null, null];

  const filmsListing = (
    <FilmsListingClient
      stocks={stocks}
      statsBySlug={statsBySlug}
      loggedSlugs={loggedSlugs}
      useCaseFilter={bestForArr.length > 0 || !!vibe}
    />
  );

  return (
    <FilmsPageMobileSearchWrapper>
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 pt-4 pb-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <DiscoveryHeader
            brands={brands}
            filterOptions={filterOptions}
            currentSort={params.sort === "alphabetical" ? "alphabetical" : "highest-rated"}
            showUseCasePills={!discoverTab}
          />
        </div>
        {params.filters === "1" ? (
          <FiltersLeftPane brands={brands} filterOptions={filterOptions}>
            <main className="min-w-0">
              {filmsListing}
            </main>
          </FiltersLeftPane>
        ) : (
          <main className="min-w-0">
            {/* Desktop: always show film grid */}
            <div className="hidden md:block">
              {filmsListing}
            </div>
            {/* Mobile: show film grid or discover tab panel (Shots / Notes / Brands / Users) */}
            <div className="md:hidden">
              {discoverTab ? (
                <DiscoverTabPanels
                  tab={discoverTab}
                  latestShots={latestShots}
                  latestNotes={latestNotes}
                  brands={brands}
                  latestUsers={latestUsers}
                />
              ) : (
                filmsListing
              )}
            </div>
          </main>
        )}
      </div>
    </div>
    </FilmsPageMobileSearchWrapper>
  );
}
