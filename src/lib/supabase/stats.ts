import { createClient } from "@/lib/supabase/server";

export interface FilmStockStats {
  shotByCount: number;
  favouritesCount: number;
  avgRating: number | null;
  ratingCount: number;
  shotsCount: number;
}

/** Fetches real stats from Supabase (user_shot, user_favourites, user_ratings, user_uploads). */
export async function getFilmStockStats(slug: string): Promise<FilmStockStats> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_film_stock_stats", { p_slug: slug });
  if (error) {
    console.error("[getFilmStockStats]", slug, error);
    return { shotByCount: 0, favouritesCount: 0, avgRating: null, ratingCount: 0, shotsCount: 0 };
  }
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) {
    return { shotByCount: 0, favouritesCount: 0, avgRating: null, ratingCount: 0, shotsCount: 0 };
  }
  return {
    shotByCount: Number(row.shot_by_count ?? 0),
    favouritesCount: Number(row.favourites_count ?? 0),
    avgRating: row.avg_rating != null ? Number(row.avg_rating) : null,
    ratingCount: Number(row.rating_count ?? 0),
    shotsCount: Number(row.shots_count ?? 0),
  };
}

/** Fetches stats for multiple slugs in one round-trip (e.g. for grids). Returns a map slug -> stats for use in cards. Falls back to per-slug RPC if batch RPC is unavailable (e.g. before migration). */
export async function getFilmStockStatsForSlugs(slugs: string[]): Promise<Record<string, FilmStockStats>> {
  if (slugs.length === 0) return {};
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_film_stock_stats_batch", { p_slugs: slugs });
  if (!error && data != null) {
    const rows = Array.isArray(data) ? data : [];
    const map: Record<string, FilmStockStats> = {};
    for (const row of rows) {
      const slug = row?.slug as string | undefined;
      if (slug == null) continue;
      map[slug] = {
        shotByCount: Number(row.shot_by_count ?? 0),
        favouritesCount: Number(row.favourites_count ?? 0),
        avgRating: row.avg_rating != null ? Number(row.avg_rating) : null,
        ratingCount: Number(row.rating_count ?? 0),
        shotsCount: Number(row.shots_count ?? 0),
      };
    }
    return map;
  }
  if (error) {
    console.warn("[getFilmStockStatsForSlugs] batch RPC unavailable, falling back to per-slug:", error.message);
  }
  const results = await Promise.all(slugs.map((slug) => getFilmStockStats(slug)));
  const fallbackMap: Record<string, FilmStockStats> = {};
  slugs.forEach((slug, i) => {
    fallbackMap[slug] = results[i];
  });
  return fallbackMap;
}
