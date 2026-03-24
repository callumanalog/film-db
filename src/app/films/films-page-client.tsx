"use client";

import { useSearchParams } from "next/navigation";
import type { FilmsPageData, FilmsPageParams } from "@/app/actions/nav-cache";
import { FilmsListingClient } from "@/app/films/films-listing-client";
import { FilmsPageMobileSearchWrapper } from "@/app/films/films-page-mobile-search-wrapper";
import { DiscoverTabPanels } from "@/app/films/discover-tab-panels";
import { DiscoveryHeader } from "@/components/discovery-header";
import { FiltersLeftPane } from "@/components/filters-left-pane";
import { useFilmsPageData } from "@/lib/nav-cache-swr";

function searchParamsToNavParams(searchParams: URLSearchParams): FilmsPageParams {
  return {
    tab: searchParams.get("tab") ?? undefined,
    search: searchParams.get("search") ?? undefined,
    vibe: searchParams.get("vibe") ?? undefined,
    brand: searchParams.get("brand") ?? undefined,
    type: searchParams.get("type") ?? undefined,
    format: searchParams.get("format") ?? undefined,
    grain: searchParams.get("grain") ?? undefined,
    contrast: searchParams.get("contrast") ?? undefined,
    latitude: searchParams.get("latitude") ?? undefined,
    saturation: searchParams.get("saturation") ?? undefined,
    bestFor: searchParams.get("bestFor") ?? undefined,
    iso: searchParams.get("iso") ?? undefined,
    sort: searchParams.get("sort") ?? undefined,
    filters: searchParams.get("filters") ?? undefined,
  };
}

export interface FilmsPageClientProps {
  /** Server-passed data on first load; when navigating back, SWR cache is used. */
  fallbackData?: FilmsPageData;
}

export function FilmsPageClient({ fallbackData }: FilmsPageClientProps) {
  const searchParams = useSearchParams();
  const params = searchParamsToNavParams(searchParams);
  const { data, isLoading } = useFilmsPageData({ params, fallbackData });

  if (!data && isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-7xl px-4 pt-4 pb-8 sm:px-6 lg:px-8">
          <div className="mb-6 hidden md:block">
            <div className="h-16 animate-pulse rounded-lg bg-muted/30" />
          </div>
          <div className="space-y-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-32 animate-pulse rounded-lg bg-muted/20" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const {
    brands = [],
    filterOptions = {
      types: [],
      isos: [],
      formats: [],
      grains: [],
      contrasts: [],
      latitudes: [],
      saturations: [],
      bestFor: [],
    },
    stocks = [],
    statsBySlug = {},
    loggedSlugs = [],
    discoverTab = null,
    filmsViewTab = "for-you",
    latestShots = null,
    latestNotes = null,
    latestUsers = null,
  } = data ?? {};

  const useCaseFilter =
    (params.bestFor?.split(",").filter(Boolean).length ?? 0) > 0 || !!params.vibe;
  const mobileCarouselsOnly = filmsViewTab === "for-you" ? ("for-you" as const) : undefined;
  const currentSort = params.sort === "alphabetical" ? "alphabetical" : "highest-rated";

  const filterPaneOpen = params.filters === "1";
  const filmsListing = (
    <FilmsListingClient
      stocks={stocks}
      statsBySlug={statsBySlug}
      loggedSlugs={loggedSlugs}
      filterPaneOpen={filterPaneOpen}
      useCaseFilter={useCaseFilter}
      filmsViewTab={filmsViewTab}
      mobileCarouselsOnly={mobileCarouselsOnly}
    />
  );

  return (
    <FilmsPageMobileSearchWrapper brands={brands} filterOptions={filterOptions}>
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-7xl px-4 pt-4 pb-8 sm:px-6 lg:px-8">
          <div className="mb-6 hidden md:block">
            <DiscoveryHeader
              brands={brands}
              filterOptions={filterOptions}
              currentSort={currentSort}
              showUseCasePills={!discoverTab}
            />
          </div>
          {params.filters === "1" ? (
            <FiltersLeftPane brands={brands} filterOptions={filterOptions}>
              <main className="min-w-0">{filmsListing}</main>
            </FiltersLeftPane>
          ) : (
            <main className="min-w-0">
              <div className="hidden md:block">{filmsListing}</div>
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
