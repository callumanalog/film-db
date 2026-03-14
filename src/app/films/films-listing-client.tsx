"use client";

import type { FilmStock, FilmBrand } from "@/lib/types";
import { FilmGrid } from "@/components/film-grid";
import { useUserActions } from "@/context/user-actions-context";
import type { FilmStockStats } from "@/lib/supabase/stats";

interface FilmsListingClientProps {
  stocks: (FilmStock & { brand: FilmBrand })[];
  /** Optional map of slug -> stats so cards show real avg rating. */
  statsBySlug?: Record<string, FilmStockStats>;
  /** When true (filter pane open on desktop), grid uses 3 columns per row. */
  filterPaneOpen?: boolean;
}

/**
 * Client wrapper that reads the user's shot state from UserActionsContext
 * and renders the film grid with shot tick on cards.
 */
export function FilmsListingClient({ stocks, statsBySlug, filterPaneOpen }: FilmsListingClientProps) {
  const { shotSlugs } = useUserActions();

  return (
    <FilmGrid
      stocks={stocks}
      shotSlugs={shotSlugs}
      statsBySlug={statsBySlug}
      filterPaneOpen={filterPaneOpen}
    />
  );
}
