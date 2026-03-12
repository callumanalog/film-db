"use client";

import type { FilmStock, FilmBrand } from "@/lib/types";
import { FilmGrid } from "@/components/film-grid";
import { useUserActions } from "@/context/user-actions-context";
import type { FilmStockStats } from "@/lib/supabase/stats";

interface FilmsListingClientProps {
  stocks: (FilmStock & { brand: FilmBrand })[];
  /** Optional map of slug -> stats so cards show real avg rating. */
  statsBySlug?: Record<string, FilmStockStats>;
}

/**
 * Client wrapper that reads the user's shot/favourite state from UserActionsContext
 * and renders the film grid with Work Sans titles and state badges on cards.
 */
export function FilmsListingClient({ stocks, statsBySlug }: FilmsListingClientProps) {
  const { favouriteSlugs } = useUserActions();

  return (
    <FilmGrid
      stocks={stocks}
      useWorkSansForTitles
      favouriteSlugs={favouriteSlugs}
      statsBySlug={statsBySlug}
    />
  );
}
