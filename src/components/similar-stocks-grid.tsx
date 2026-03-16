"use client";

import type { FilmStock, FilmBrand } from "@/lib/types";
import { FilmCard } from "@/components/film-card";

interface SimilarStocksGridProps {
  stocks: (FilmStock & { brand: FilmBrand })[];
  /** Optional map of slug -> stats so cards can show real avg rating. */
  statsBySlug?: Record<string, { avgRating: number | null }>;
}

/**
 * Renders the similar stocks grid with the same FilmCard styling as the film stocks
 * landing page.
 */
export function SimilarStocksGrid({ stocks, statsBySlug }: SimilarStocksGridProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
      {stocks.map((s) => (
        <FilmCard key={s.id} stock={s} />
      ))}
    </div>
  );
}
