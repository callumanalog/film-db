"use client";

import type { FilmStock, FilmBrand } from "@/lib/types";
import { FilmCard } from "@/components/film-card";

interface SimilarStocksGridProps {
  stocks: (FilmStock & { brand: FilmBrand })[];
  /** Optional map of slug -> stats so cards can show real avg rating. */
  statsBySlug?: Record<string, { avgRating: number | null }>;
}

export function SimilarStocksGrid({ stocks, statsBySlug }: SimilarStocksGridProps) {
  return (
    <div className="-mx-4 overflow-hidden sm:-mx-6 lg:-mx-8">
      <div className="scrollbar-hide flex overflow-x-auto overflow-y-hidden gap-2 pl-4 pr-4 sm:pl-6 sm:pr-6 lg:pl-8 lg:pr-8">
        {stocks.map((s, index) => (
          <div key={s.id} className="min-w-0 w-[calc(43.2%-8px)] shrink-0">
            <FilmCard stock={s} priority={index < 4} />
          </div>
        ))}
      </div>
    </div>
  );
}
