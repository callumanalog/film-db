-- Add shots_count (community images uploaded for this stock) to get_film_stock_stats
-- Must DROP first because return type is changing (new column).
DROP FUNCTION IF EXISTS get_film_stock_stats(text);

CREATE OR REPLACE FUNCTION get_film_stock_stats(p_slug TEXT)
RETURNS TABLE(shot_by_count bigint, favourites_count bigint, avg_rating numeric, rating_count bigint, shots_count bigint)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    (SELECT COUNT(*) FROM user_shot WHERE film_stock_slug = p_slug),
    (SELECT COUNT(*) FROM user_favourites WHERE film_stock_slug = p_slug),
    (SELECT ROUND(AVG(rating)::numeric, 1) FROM user_ratings WHERE film_stock_slug = p_slug AND rating > 0),
    (SELECT COUNT(*) FROM user_ratings WHERE film_stock_slug = p_slug AND rating > 0),
    (SELECT COUNT(*) FROM user_uploads WHERE film_stock_slug = p_slug);
$$;

GRANT EXECUTE ON FUNCTION get_film_stock_stats(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION get_film_stock_stats(TEXT) TO authenticated;
