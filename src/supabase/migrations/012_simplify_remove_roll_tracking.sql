-- Simplify: remove roll tracking tables and add lightweight "in camera" status table.
-- This migration drops user_logged_rolls, user_tracked, and user_shootlist,
-- replacing them with a simpler user_in_camera table for the "currently shooting" status.

-- 1. Create user_in_camera (lightweight status with optional metadata)
CREATE TABLE IF NOT EXISTS user_in_camera (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  film_stock_slug TEXT NOT NULL,
  camera TEXT,
  format TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, film_stock_slug)
);

CREATE INDEX IF NOT EXISTS idx_user_in_camera_user ON user_in_camera(user_id);
CREATE INDEX IF NOT EXISTS idx_user_in_camera_slug ON user_in_camera(film_stock_slug);

ALTER TABLE user_in_camera ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own user_in_camera" ON user_in_camera FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own user_in_camera" ON user_in_camera FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own user_in_camera" ON user_in_camera FOR DELETE USING (auth.uid() = user_id);

-- 2. Drop old tables
DROP TABLE IF EXISTS user_logged_rolls CASCADE;
DROP TABLE IF EXISTS user_tracked CASCADE;
DROP TABLE IF EXISTS user_shootlist CASCADE;

-- 3. Update get_film_stock_stats to include in_camera_count
DROP FUNCTION IF EXISTS get_film_stock_stats(text);

CREATE OR REPLACE FUNCTION get_film_stock_stats(p_slug TEXT)
RETURNS TABLE(shot_by_count bigint, favourites_count bigint, avg_rating numeric, rating_count bigint, shots_count bigint, in_camera_count bigint)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    (SELECT COUNT(*) FROM user_shot WHERE film_stock_slug = p_slug),
    (SELECT COUNT(*) FROM user_favourites WHERE film_stock_slug = p_slug),
    (SELECT ROUND(AVG(rating)::numeric, 1) FROM user_ratings WHERE film_stock_slug = p_slug AND rating > 0),
    (SELECT COUNT(*) FROM user_ratings WHERE film_stock_slug = p_slug AND rating > 0),
    (SELECT COUNT(*) FROM user_uploads WHERE film_stock_slug = p_slug),
    (SELECT COUNT(*) FROM user_in_camera WHERE film_stock_slug = p_slug);
$$;

GRANT EXECUTE ON FUNCTION get_film_stock_stats(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION get_film_stock_stats(TEXT) TO authenticated;
