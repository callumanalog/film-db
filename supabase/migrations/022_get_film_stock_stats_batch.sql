-- Batch stats RPC: one round-trip for many slugs (used by films listing for faster filter apply).
CREATE OR REPLACE FUNCTION get_film_stock_stats_batch(p_slugs TEXT[])
RETURNS TABLE(slug text, shot_by_count bigint, favourites_count bigint, avg_rating numeric, rating_count bigint, shots_count bigint)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  WITH slugs AS (SELECT unnest(p_slugs) AS slug),
  shot_counts AS (SELECT film_stock_slug AS slug, COUNT(*)::bigint AS cnt FROM user_shot WHERE film_stock_slug = ANY(p_slugs) GROUP BY film_stock_slug),
  fav_counts AS (SELECT film_stock_slug AS slug, COUNT(*)::bigint AS cnt FROM user_favourites WHERE film_stock_slug = ANY(p_slugs) GROUP BY film_stock_slug),
  rating_stats AS (
    SELECT film_stock_slug AS slug,
           ROUND(AVG(rating)::numeric, 1) AS avg_r,
           COUNT(*)::bigint AS cnt
    FROM user_ratings WHERE film_stock_slug = ANY(p_slugs) AND rating > 0 GROUP BY film_stock_slug
  ),
  upload_counts AS (SELECT film_stock_slug AS slug, COUNT(*)::bigint AS cnt FROM user_uploads WHERE film_stock_slug = ANY(p_slugs) GROUP BY film_stock_slug)
  SELECT
    s.slug,
    COALESCE(sc.cnt, 0) AS shot_by_count,
    COALESCE(fc.cnt, 0) AS favourites_count,
    rs.avg_r AS avg_rating,
    COALESCE(rs.cnt, 0) AS rating_count,
    COALESCE(uc.cnt, 0) AS shots_count
  FROM slugs s
  LEFT JOIN shot_counts sc ON sc.slug = s.slug
  LEFT JOIN fav_counts fc ON fc.slug = s.slug
  LEFT JOIN rating_stats rs ON rs.slug = s.slug
  LEFT JOIN upload_counts uc ON uc.slug = s.slug;
$$;

GRANT EXECUTE ON FUNCTION get_film_stock_stats_batch(TEXT[]) TO anon;
GRANT EXECUTE ON FUNCTION get_film_stock_stats_batch(TEXT[]) TO authenticated;
