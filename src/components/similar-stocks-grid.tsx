"use client";

import type { FilmStock, FilmBrand } from "@/lib/types";
import { FilmCard } from "@/components/film-card";
import { useUserActions } from "@/context/user-actions-context";

interface SimilarStocksGridProps {
  stocks: (FilmStock & { brand: FilmBrand })[];
}

/**
 * Renders the similar stocks grid with the same FilmCard styling as the film stocks
 * landing page (Work Sans title, favourite heart icon).
 */
export function SimilarStocksGrid({ stocks }: SimilarStocksGridProps) {
  const { favouriteSlugs } = useUserActions();

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
      {stocks.map((s) => (
        <FilmCard
          key={s.id}
          stock={s}
          useWorkSansTitle
          favouriteSlugs={favouriteSlugs}
        />
      ))}
    </div>
  );
}
