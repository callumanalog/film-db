"use server";

import { getFilmStocksBySlugs } from "@/lib/supabase/queries";
import { getFilmStockStatsForSlugs } from "@/lib/supabase/stats";

export async function getStocksBySlugs(slugs: string[]) {
  if (slugs.length === 0) return [];
  return getFilmStocksBySlugs(slugs);
}

export async function getStatsForSlugs(slugs: string[]) {
  if (slugs.length === 0) return {};
  return getFilmStockStatsForSlugs(slugs);
}
