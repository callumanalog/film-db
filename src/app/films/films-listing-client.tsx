"use client";

import type { FilmStock, FilmBrand } from "@/lib/types";
import { FilmCard } from "@/components/film-card";
import { FilmGrid } from "@/components/film-grid";
import { VirtualizedFilmGrid } from "@/components/virtualized-film-grid";
import { FilmCarousels } from "@/components/film-carousels";
import type { FilmStockStats } from "@/lib/supabase/stats";

interface FilmsListingClientProps {
  stocks: (FilmStock & { brand: FilmBrand })[];
  /** Optional map of slug -> stats so cards show real avg rating. */
  statsBySlug?: Record<string, FilmStockStats>;
  /** Slugs of films the user has logged a roll for (for "Shoot something new" carousel). */
  loggedSlugs?: string[];
  /** When true (filter pane open on desktop), grid uses 3 columns per row. */
  filterPaneOpen?: boolean;
  /** When true (use-case / discovery pill filter), show results in a 2-column grid. */
  useCaseFilter?: boolean;
}

export function FilmsListingClient({ stocks, statsBySlug, loggedSlugs, filterPaneOpen, useCaseFilter }: FilmsListingClientProps) {
  if (useCaseFilter) {
    if (stocks.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center rounded-card border border-dashed border-border py-16 text-center">
          <p className="text-muted-foreground">No film stocks match this use case.</p>
        </div>
      );
    }
    return (
      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:gap-6">
        {stocks.map((stock, index) => (
          <FilmCard key={stock.id} stock={stock} priority={index < 4} />
        ))}
      </div>
    );
  }

  return (
    <>
      <FilmCarousels stocks={stocks} statsBySlug={statsBySlug} loggedSlugs={loggedSlugs} />
      <div className="hidden md:block mt-6">
        <VirtualizedFilmGrid
          stocks={stocks}
          statsBySlug={statsBySlug}
          filterPaneOpen={filterPaneOpen}
          minLengthToVirtualize={24}
        />
      </div>
    </>
  );
}
