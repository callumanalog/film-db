"use client";

import type { FilmStock, FilmBrand } from "@/lib/types";
import { FilmCard } from "@/components/film-card";

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

const POPULAR_COLOR_SLUGS = [
  "kodak-portra-400",
  "kodak-gold-200",
  "kodak-ektar-100",
  "fujifilm-superia-x-tra-400",
  "kodak-colorplus-200",
  "kodak-ultramax-400",
  "fujifilm-c200",
  "cinestill-800t",
] as const;

const POPULAR_BW_SLUGS = [
  "ilford-hp5-plus",
  "kodak-tri-x-400",
  "ilford-delta-3200",
  "ilford-delta-400",
  "ilford-fp4-plus",
  "kodak-tmax-400",
  "fomapan-400-action",
  "fomapan-100-classic",
] as const;

const BUDGET_FRIENDLY_SLUGS = [
  "kodak-colorplus-200",
  "fujifilm-c200",
  "kodak-ultramax-400",
  "kentmere-pan-400",
  "fomapan-100-classic",
  "ilford-hp5-plus",
  "agfa-apx-100",
] as const;

const HIGH_ISO_SLUGS = [
  "cinestill-800t",
  "kodak-portra-800",
  "ilford-delta-3200",
  "kodak-tmax-p3200",
  "ilford-hp5-plus",
  "fujifilm-superia-x-tra-400",
  "kodak-tri-x-400",
  "fomapan-400-action",
] as const;

const NEW_TO_FILM_SLUGS = [
  "kodak-gold-200",
  "kodak-ultramax-400",
  "ilford-hp5-plus",
  "kodak-portra-400",
  "fujifilm-c200",
  "kodak-colorplus-200",
  "kodak-tri-x-400",
  "fujifilm-superia-x-tra-400",
] as const;

interface CarouselSection {
  id: string;
  title: string;
  slugs: readonly string[];
}

const CAROUSEL_SECTIONS: CarouselSection[] = [
  { id: "community-favourites", title: "Community Favourites", slugs: COMMUNITY_FAVOURITES_SLUGS },
  { id: "popular-color", title: "Popular Colour Stocks", slugs: POPULAR_COLOR_SLUGS },
  { id: "popular-bw", title: "Popular B&W Stocks", slugs: POPULAR_BW_SLUGS },
  { id: "budget-friendly", title: "Budget Friendly", slugs: BUDGET_FRIENDLY_SLUGS },
  { id: "high-iso", title: "High ISO / Low Light", slugs: HIGH_ISO_SLUGS },
  { id: "new-to-film", title: "New to Film", slugs: NEW_TO_FILM_SLUGS },
];

function resolveStocks(
  slugs: readonly string[],
  bySlug: Map<string, FilmStock & { brand: FilmBrand }>
): (FilmStock & { brand: FilmBrand })[] {
  return slugs
    .map((slug) => bySlug.get(slug))
    .filter((s): s is FilmStock & { brand: FilmBrand } => s != null);
}

interface SearchExploreCarouselsProps {
  stocks: (FilmStock & { brand: FilmBrand })[];
}

export function SearchExploreCarousels({ stocks }: SearchExploreCarouselsProps) {
  const bySlug = new Map(stocks.map((s) => [s.slug, s]));

  return (
    <div className="flex flex-col gap-10 pt-4">
      {CAROUSEL_SECTIONS.map((section) => {
        const resolved = resolveStocks(section.slugs, bySlug);
        if (resolved.length === 0) return null;

        return (
          <section
            key={section.id}
            className="film-row"
            aria-labelledby={`search-carousel-${section.id}`}
          >
            <h3
              id={`search-carousel-${section.id}`}
              className="mb-3 m-0 font-sans text-xl font-bold tracking-tight text-foreground"
            >
              {section.title}
            </h3>
            <div className="-mx-4 overflow-hidden">
              <div className="scrollbar-hide flex overflow-x-auto overflow-y-hidden gap-2 pl-4 pr-4">
                {resolved.map((stock, index) => (
                  <div key={stock.id} className="min-w-0 w-[calc(43.2%-8px)] shrink-0">
                    <FilmCard stock={stock} priority={index < 4} />
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
