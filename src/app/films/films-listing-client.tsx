"use client";

import type { FilmStock, FilmBrand } from "@/lib/types";
import { FilmGrid } from "@/components/film-grid";
import { FilmCarousels } from "@/components/film-carousels";
import type { FilmStockStats } from "@/lib/supabase/stats";

interface FilmsListingClientProps {
  stocks: (FilmStock & { brand: FilmBrand })[];
  /** Optional map of slug -> stats so cards show real avg rating. */
  statsBySlug?: Record<string, FilmStockStats>;
  /** When true (filter pane open on desktop), grid uses 3 columns per row. */
  filterPaneOpen?: boolean;
}

export function FilmsListingClient({ stocks, statsBySlug, filterPaneOpen }: FilmsListingClientProps) {
  return (
    <>
      {/* Mobile: carousels by category */}
      <div className="md:hidden">
        <FilmCarousels stocks={stocks} statsBySlug={statsBySlug} />
      </div>
      {/* Desktop: grid */}
      <div className="hidden md:block">
        <FilmGrid
          stocks={stocks}
          statsBySlug={statsBySlug}
          filterPaneOpen={filterPaneOpen}
        />
      </div>
    </>
  );
}
