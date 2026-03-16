"use client";

import type { FilmStock, FilmBrand, FilmType } from "@/lib/types";
import { FILM_TYPE_LABELS } from "@/lib/types";
import { FilmCard } from "@/components/film-card";

const CAROUSEL_TYPE_ORDER: FilmType[] = [
  "color_negative",
  "color_reversal",
  "bw_negative",
  "bw_reversal",
  "instant",
];

interface FilmCarouselsProps {
  stocks: (FilmStock & { brand: FilmBrand })[];
  statsBySlug?: Record<string, { avgRating: number | null }>;
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

export function FilmCarousels({ stocks, statsBySlug }: FilmCarouselsProps) {
  const byType = groupStocksByType(stocks);
  const sections = CAROUSEL_TYPE_ORDER.filter((type) => (byType.get(type)?.length ?? 0) > 0);

  if (sections.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-card border border-dashed border-border py-16 text-center">
        <p className="text-muted-foreground">No film stocks found matching your filters.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {sections.map((type) => {
        const list = byType.get(type)!;
        const label = FILM_TYPE_LABELS[type];
        return (
          <section key={type} aria-labelledby={`carousel-${type}`}>
            <h3
              id={`carousel-${type}`}
              className="mb-3 font-sans text-xl font-bold tracking-tight text-foreground"
            >
              {label}
            </h3>
            {/* Full-bleed: break out of page padding so scroll spans full width */}
            <div className="-mx-4">
              <div
                className="scrollbar-hide flex snap-x snap-mandatory overflow-x-auto overflow-y-hidden gap-4 pb-1 pl-4 pr-4"
              >
                {list.map((stock, index) => {
                  const isFirst = index === 0;
                  const isLast = index === list.length - 1;
                  return (
                    <div
                      key={stock.id}
                      className={`min-w-0 w-[calc(45%-8px)] shrink-0 snap-start ${isFirst ? "scroll-ml-4" : ""} ${isLast ? "scroll-mr-4 pr-4" : ""}`}
                    >
                      <FilmCard
                        stock={stock}
                        priority={type === "color_negative" && index < 4}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        );
      })}
    </div>
  );
}
