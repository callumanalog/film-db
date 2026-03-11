"use server";

import { getFilmStocksBySlugs } from "@/lib/supabase/queries";

export async function getStocksBySlugs(slugs: string[]) {
  if (slugs.length === 0) return [];
  return getFilmStocksBySlugs(slugs);
}
