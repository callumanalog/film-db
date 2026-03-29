"use server";

import { getFilmStockBySlug, getFilmStocksBySlugs } from "@/lib/supabase/queries";
import { getFilmStockStatsForSlugs } from "@/lib/supabase/stats";

/**
 * Formats for a single stock, from the same loader as the film detail page (not the
 * cached full-catalog list used by search / trending). Keeps review & upload modals in
 * sync with the detail “Format” line when catalog cache or search payloads are stale.
 */
export async function getFilmStockFormatListForSlug(slug: string): Promise<string[]> {
  const s = slug?.trim();
  if (!s) return [];
  const stock = await getFilmStockBySlug(s);
  return stock?.format?.length ? [...stock.format] : [];
}

export async function getStocksBySlugs(slugs: string[]) {
  if (slugs.length === 0) return [];
  return getFilmStocksBySlugs(slugs);
}

export async function getStatsForSlugs(slugs: string[]) {
  if (slugs.length === 0) return {};
  return getFilmStockStatsForSlugs(slugs);
}
