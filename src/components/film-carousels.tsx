"use client";

import type { FilmStock, FilmBrand, FilmType } from "@/lib/types";
import { FILM_TYPE_LABELS } from "@/lib/types";
import { FilmCard } from "@/components/film-card";

/** 10 film stocks generally loved by film photographers, in display order. */
const COMMUNITY_FAVOURITES_SLUGS = [
  "cinestill-800t",
  "ilford-hp5-plus",
  "kodak-gold-200",
  "kodak-ektar-100",
  "fujifilm-velvia-100",
  "kodak-portra-400",
  "kodak-portra-160",
  "kodak-portra-800",
  "fujifilm-pro-400h",
  "kodak-tri-x-400",
] as const;

const CAROUSEL_TYPE_ORDER: FilmType[] = ["instant"];

/** When "for-you", show only curated sections (no All stocks). When "index", show only All stocks grid. When "all", show everything (desktop default). */
export type FilmCarouselsViewMode = "for-you" | "index" | "all";

interface FilmCarouselsProps {
  stocks: (FilmStock & { brand: FilmBrand })[];
  statsBySlug?: Record<string, { avgRating: number | null }>;
  /** Optional, no longer used (Shoot something new carousel removed). */
  loggedSlugs?: string[];
  /** Mobile tab view: "for-you" = curated only, "index" = All stocks only, "all" = everything (default). */
  viewMode?: FilmCarouselsViewMode;
}

function groupStocksByType(
  stocks: (FilmStock & { brand: FilmBrand })[]
): Map<FilmType, (FilmStock & { brand: FilmBrand })[]> {
  const map = new Map<FilmType, (FilmStock & { brand: FilmBrand })[]>();
  for (const stock of stocks) {
    const list = map.get(stock.type) ?? [];
    list.push(stock);
    map.set(stock.type, list);
  }
  return map;
}

function getCommunityFavourites(
  stocks: (FilmStock & { brand: FilmBrand })[]
): (FilmStock & { brand: FilmBrand })[] {
  const bySlug = new Map(stocks.map((s) => [s.slug, s]));
  return COMMUNITY_FAVOURITES_SLUGS.map((slug) => bySlug.get(slug)).filter(
    (s): s is FilmStock & { brand: FilmBrand } => s != null
  ).slice(0, 10);
}

/** Budget-friendly films in display order (fixed list; no price data required). */
const BUDGET_FRIENDLY_SLUGS = [
  "kodak-colorplus-200",
  "fujifilm-c200",
  "kodak-ultramax-400",
  "kentmere-pan-400",
  "fomapan-100-classic",
  "ilford-hp5-plus",
  "agfa-apx-100",
] as const;

function getBudgetFriendly(
  stocks: (FilmStock & { brand: FilmBrand })[]
): (FilmStock & { brand: FilmBrand })[] {
  const bySlug = new Map(stocks.map((s) => [s.slug, s]));
  return BUDGET_FRIENDLY_SLUGS.map((slug) => bySlug.get(slug)).filter(
    (s): s is FilmStock & { brand: FilmBrand } => s != null
  );
}

export function FilmCarousels({ stocks, statsBySlug, viewMode = "all" }: FilmCarouselsProps) {
  const byType = groupStocksByType(stocks);
  const communityFavourites = getCommunityFavourites(stocks);
  const budgetFriendly = getBudgetFriendly(stocks);
  const typeSections = CAROUSEL_TYPE_ORDER.filter((type) => (byType.get(type)?.length ?? 0) > 0);
  const hasCommunityFavourites = communityFavourites.length > 0;
  const hasBudgetFriendly = budgetFriendly.length > 0;
  const allStocksAlphabetical = [...stocks].sort((a, b) => {
    const na = `${a.brand.name} ${a.name}`.toLowerCase();
    const nb = `${b.brand.name} ${b.name}`.toLowerCase();
    return na.localeCompare(nb);
  });
  const showForYouSections = viewMode === "all" || viewMode === "for-you";
  const showAllStocksSection = viewMode === "all" || viewMode === "index";
  const hasAnySection =
    (showForYouSections && (hasCommunityFavourites || hasBudgetFriendly || typeSections.length > 0)) ||
    (showAllStocksSection && stocks.length > 0);

  if (!hasAnySection) {
    return (
      <div className="flex flex-col items-center justify-center rounded-card border border-dashed border-border py-16 text-center">
        <p className="text-muted-foreground">No film stocks found matching your filters.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-12">
      {showForYouSections && hasCommunityFavourites && (
        <section
          key="community-favourites"
          className="film-row"
          aria-labelledby="carousel-community-favourites"
        >
          <h3
            id="carousel-community-favourites"
            className="mb-3 m-0 font-cabinet text-xl font-extrabold tracking-tight text-foreground"
          >
            Community Favourites
          </h3>
          <div className="-mx-4 overflow-hidden">
            <div className="scrollbar-hide flex overflow-x-auto overflow-y-hidden gap-2 pl-4 pr-4">
              {communityFavourites.map((stock, index) => (
                <div key={stock.id} className="min-w-0 w-[calc(43.2%-8px)] shrink-0">
                  <FilmCard stock={stock} priority={index < 4} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
      {showForYouSections && hasBudgetFriendly && (
        <section
          key="budget-friendly"
          className="film-row"
          aria-labelledby="carousel-budget-friendly"
        >
          <h3
            id="carousel-budget-friendly"
            className="mb-3 m-0 font-cabinet text-xl font-extrabold tracking-tight text-foreground"
          >
            Budget-friendly film
          </h3>
          <div className="-mx-4 overflow-hidden">
            <div className="scrollbar-hide flex overflow-x-auto overflow-y-hidden gap-2 pl-4 pr-4">
              {budgetFriendly.map((stock, index) => (
                <div key={stock.id} className="min-w-0 w-[calc(36%-8px)] shrink-0">
                  <FilmCard stock={stock} priority={index < 4} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
      {showAllStocksSection && allStocksAlphabetical.length > 0 && (
        <section
          key="all-stocks"
          className="film-row"
          aria-labelledby="carousel-all-stocks"
        >
          <h3
            id="carousel-all-stocks"
            className="mb-3 font-sans text-xl font-bold tracking-tight text-foreground"
          >
            All stocks
          </h3>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:gap-6">
            {allStocksAlphabetical.map((stock, index) => (
              <FilmCard key={stock.id} stock={stock} priority={index < 4} />
            ))}
          </div>
        </section>
      )}
      {showForYouSections && typeSections.map((type) => {
        const list = byType.get(type)!;
        const label = FILM_TYPE_LABELS[type];
        return (
          <section
            key={type}
            className="film-row"
            aria-labelledby={`carousel-${type}`}
          >
            <h3
              id={`carousel-${type}`}
              className="mb-3 font-sans text-xl font-bold tracking-tight text-foreground"
            >
              {label}
            </h3>
            <div className="-mx-4 overflow-hidden">
              <div className="scrollbar-hide flex overflow-x-auto overflow-y-hidden gap-2 pl-4 pr-4">
                {list.map((stock, index) => (
                  <div key={stock.id} className="min-w-0 w-[calc(36%-8px)] shrink-0">
                    <FilmCard stock={stock} priority={false} />
                  </div>
                ))}
              </div>
            </div>
          </section>
        );
      })}
    </div>
  );
}
