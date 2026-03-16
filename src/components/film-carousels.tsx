"use client";

import Link from "next/link";
import type { FilmStock, FilmBrand, FilmType } from "@/lib/types";
import { FILM_TYPE_LABELS } from "@/lib/types";
import { FilmCard } from "@/components/film-card";
import { ChevronRight } from "lucide-react";

/** 10 film stocks generally loved by film photographers, in display order (mixed so Portra isn’t all first). */
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

interface FilmCarouselsProps {
  stocks: (FilmStock & { brand: FilmBrand })[];
  statsBySlug?: Record<string, { avgRating: number | null }>;
  /** Slugs of films the user has logged a roll for; used to show "Shoot something new" from brands they haven't used. */
  loggedSlugs?: string[];
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

/** Up to 10 films from brands the user has never logged a roll for (one per brand for diversity). When no rolls logged, any brand counts as "new". */
function getShootSomethingNew(
  stocks: (FilmStock & { brand: FilmBrand })[],
  loggedSlugs: string[]
): (FilmStock & { brand: FilmBrand })[] {
  const loggedBrandSlugs = new Set(
    stocks.filter((s) => loggedSlugs.includes(s.slug)).map((s) => s.brand.slug)
  );
  const byBrand = new Map<string, (FilmStock & { brand: FilmBrand })[]>();
  for (const s of stocks) {
    if (loggedBrandSlugs.has(s.brand.slug)) continue;
    const list = byBrand.get(s.brand.slug) ?? [];
    list.push(s);
    byBrand.set(s.brand.slug, list);
  }
  const result: (FilmStock & { brand: FilmBrand })[] = [];
  for (const [, list] of byBrand) {
    if (result.length >= 10) break;
    result.push(list[0]);
  }
  return result;
}

export function FilmCarousels({ stocks, statsBySlug, loggedSlugs = [] }: FilmCarouselsProps) {
  const byType = groupStocksByType(stocks);
  const communityFavourites = getCommunityFavourites(stocks);
  const budgetFriendly = getBudgetFriendly(stocks);
  const shootSomethingNew = getShootSomethingNew(stocks, loggedSlugs);
  const typeSections = CAROUSEL_TYPE_ORDER.filter((type) => (byType.get(type)?.length ?? 0) > 0);
  const hasCommunityFavourites = communityFavourites.length > 0;
  const hasBudgetFriendly = budgetFriendly.length > 0;
  const hasShootSomethingNew = shootSomethingNew.length > 0;
  const allStocksAlphabetical = [...stocks].sort((a, b) => {
    const na = `${a.brand.name} ${a.name}`.toLowerCase();
    const nb = `${b.brand.name} ${b.name}`.toLowerCase();
    return na.localeCompare(nb);
  });
  const hasAnySection =
    hasCommunityFavourites ||
    hasBudgetFriendly ||
    hasShootSomethingNew ||
    typeSections.length > 0 ||
    stocks.length > 0;

  if (!hasAnySection) {
    return (
      <div className="flex flex-col items-center justify-center rounded-card border border-dashed border-border py-16 text-center">
        <p className="text-muted-foreground">No film stocks found matching your filters.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {hasCommunityFavourites && (
        <section
          key="community-favourites"
          className="film-row"
          aria-labelledby="carousel-community-favourites"
        >
          <div className="mb-3 flex items-end justify-between gap-4">
            <h3
              id="carousel-community-favourites"
              className="m-0 font-sans text-xl font-bold tracking-tight text-foreground"
            >
              Community Favourites
            </h3>
            <Link
              href="/films"
              className="shrink-0 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
            >
              View all
              <ChevronRight className="ml-0.5 inline-block h-4 w-4" />
            </Link>
          </div>
          <div className="-mx-4 overflow-hidden">
            <div className="scrollbar-hide flex overflow-x-auto overflow-y-hidden gap-2 pl-4 pr-4">
              {communityFavourites.map((stock, index) => (
                <div key={stock.id} className="min-w-0 w-[calc(45%-8px)] shrink-0">
                  <FilmCard stock={stock} priority={index < 4} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
      {hasBudgetFriendly && (
        <section
          key="budget-friendly"
          className="film-row"
          aria-labelledby="carousel-budget-friendly"
        >
          <div className="mb-3 flex items-end justify-between gap-4">
            <h3
              id="carousel-budget-friendly"
              className="m-0 font-sans text-xl font-bold tracking-tight text-foreground"
            >
              Budget-friendly film
            </h3>
            <Link
              href="/films"
              className="shrink-0 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
            >
              View all
              <ChevronRight className="ml-0.5 inline-block h-4 w-4" />
            </Link>
          </div>
          <div className="-mx-4 overflow-hidden">
            <div className="scrollbar-hide flex snap-x snap-mandatory overflow-x-auto overflow-y-hidden gap-2 pl-4 pr-4 scroll-pl-4">
              {budgetFriendly.map((stock, index) => (
                <div key={stock.id} className="w-[120px] min-w-[120px] shrink-0 snap-start">
                  <FilmCard stock={stock} priority={index < 4} compact />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
      {hasShootSomethingNew && (
        <section
          key="shoot-something-new"
          className="film-row"
          aria-labelledby="carousel-shoot-something-new"
        >
          <div className="mb-3 flex items-end justify-between gap-4">
            <h3
              id="carousel-shoot-something-new"
              className="m-0 font-sans text-xl font-bold tracking-tight text-foreground"
            >
              Shoot something new
            </h3>
            <Link
              href="/films"
              className="shrink-0 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
            >
              View all
              <ChevronRight className="ml-0.5 inline-block h-4 w-4" />
            </Link>
          </div>
          <div className="-mx-4 overflow-hidden">
            <div className="scrollbar-hide flex overflow-x-auto overflow-y-hidden gap-2 pl-4 pr-4">
              {shootSomethingNew.map((stock, index) => (
                <div key={stock.id} className="min-w-0 w-[calc(45%-8px)] shrink-0">
                  <FilmCard stock={stock} priority={index < 4} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
      {allStocksAlphabetical.length > 0 && (
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
          <div className="grid grid-cols-3 gap-3 sm:gap-4 md:gap-6">
            {allStocksAlphabetical.map((stock, index) => (
              <FilmCard key={stock.id} stock={stock} priority={index < 4} />
            ))}
          </div>
        </section>
      )}
      {typeSections.map((type) => {
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
                  <div key={stock.id} className="min-w-0 w-[calc(45%-8px)] shrink-0">
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
