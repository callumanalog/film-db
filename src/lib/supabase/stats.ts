import { createClient } from "@/lib/supabase/server";

export interface FilmStockStats {
  shotByCount: number;
  favouritesCount: number;
  avgRating: number | null;
  ratingCount: number;
}

/** Fetches real stats from Supabase (user_shot, user_favourites, user_ratings). */
export async function getFilmStockStats(slug: string): Promise<FilmStockStats> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_film_stock_stats", { p_slug: slug });
  if (error) {
    console.error("[getFilmStockStats]", slug, error);
    return { shotByCount: 0, favouritesCount: 0, avgRating: null, ratingCount: 0 };
  }
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) {
    return { shotByCount: 0, favouritesCount: 0, avgRating: null, ratingCount: 0 };
  }
  return {
    shotByCount: Number(row.shot_by_count ?? 0),
    favouritesCount: Number(row.favourites_count ?? 0),
    avgRating: row.avg_rating != null ? Number(row.avg_rating) : null,
    ratingCount: Number(row.rating_count ?? 0),
  };
}

/** Fetches stats for multiple slugs (e.g. for grids). Returns a map slug -> stats for use in cards. */
export async function getFilmStockStatsForSlugs(slugs: string[]): Promise<Record<string, FilmStockStats>> {
  if (slugs.length === 0) return {};
  const results = await Promise.all(slugs.map((slug) => getFilmStockStats(slug)));
  const map: Record<string, FilmStockStats> = {};
  slugs.forEach((slug, i) => {
    map[slug] = results[i];
  });
  return map;
}
