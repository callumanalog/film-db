import { createClient } from "@/lib/supabase/server";
import { unstable_cache } from "next/cache";

export interface FilmStockStats {
  shotByCount: number;
  favouritesCount: number;
  avgRating: number | null;
  ratingCount: number;
  shotsCount: number;
}

const EMPTY_STATS: FilmStockStats = { shotByCount: 0, favouritesCount: 0, avgRating: null, ratingCount: 0, shotsCount: 0 };

/** Fetches real stats from Supabase (user_shot, user_favourites, user_ratings, user_uploads). */
export async function getFilmStockStats(slug: string): Promise<FilmStockStats> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("get_film_stock_stats", { p_slug: slug });
    if (error) {
      console.error("[getFilmStockStats]", slug, error);
      return EMPTY_STATS;
    }
    const row = Array.isArray(data) ? data[0] : data;
    if (!row) return EMPTY_STATS;
    return {
      shotByCount: Number(row.shot_by_count ?? 0),
      favouritesCount: Number(row.favourites_count ?? 0),
      avgRating: row.avg_rating != null ? Number(row.avg_rating) : null,
      ratingCount: Number(row.rating_count ?? 0),
      shotsCount: Number(row.shots_count ?? 0),
    };
  } catch (e) {
    console.warn("[getFilmStockStats]", slug, e);
    return EMPTY_STATS;
  }
}

async function fetchFilmStockStatsForSlugs(slugs: string[]): Promise<Record<string, FilmStockStats>> {
  if (slugs.length === 0) return {};
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("get_film_stock_stats_batch", { p_slugs: slugs });
    if (!error && data != null) {
      const rows = Array.isArray(data) ? data : [];
      const map: Record<string, FilmStockStats> = {};
      for (const row of rows) {
        const slug = row?.slug as string | undefined;
        if (slug == null) continue;
        const raw = row as Record<string, unknown>;
        const avgRatingRaw = raw.avg_rating ?? raw.avg_r;
        map[slug] = {
          shotByCount: Number(row.shot_by_count ?? 0),
          favouritesCount: Number(row.favourites_count ?? 0),
          avgRating: avgRatingRaw != null ? Number(avgRatingRaw) : null,
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
  } catch (e) {
    console.warn("[getFilmStockStatsForSlugs] Supabase unavailable, using empty stats:", e);
    return {};
  }
}

/** Cached 30s so listing pages don't refetch stats on every request. */
export async function getFilmStockStatsForSlugs(slugs: string[]): Promise<Record<string, FilmStockStats>> {
  if (slugs.length === 0) return {};
  const key = [...slugs].sort().join(",");
  return unstable_cache(
    () => fetchFilmStockStatsForSlugs(slugs),
    ["film-stock-stats", key],
    { revalidate: 30 }
  )();
}
