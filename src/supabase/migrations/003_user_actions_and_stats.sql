-- User profiles (one per auth user)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- "Shot it" — one row per user per film stock
CREATE TABLE IF NOT EXISTS user_shot (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  film_stock_slug TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, film_stock_slug)
);
CREATE INDEX IF NOT EXISTS idx_user_shot_slug ON user_shot(film_stock_slug);

-- "Favourites" — one row per user per film stock
CREATE TABLE IF NOT EXISTS user_favourites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  film_stock_slug TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, film_stock_slug)
);
CREATE INDEX IF NOT EXISTS idx_user_favourites_slug ON user_favourites(film_stock_slug);

-- Star rating — one row per user per film stock (rating 0–5, e.g. 0 = clear)
CREATE TABLE IF NOT EXISTS user_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  film_stock_slug TEXT NOT NULL,
  rating NUMERIC(2,1) NOT NULL CHECK (rating >= 0 AND rating <= 5),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, film_stock_slug)
);
CREATE INDEX IF NOT EXISTS idx_user_ratings_slug ON user_ratings(film_stock_slug);

-- Tracked (roll tracking) — for profile / Track modal
CREATE TABLE IF NOT EXISTS user_tracked (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  film_stock_slug TEXT NOT NULL,
  format TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT '',
  expiry_date TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, film_stock_slug)
);

-- Shootlist (want to shoot) — used by get-profile when favourites empty
CREATE TABLE IF NOT EXISTS user_shootlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  film_stock_slug TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, film_stock_slug)
);

-- Reviews and uploads — minimal tables for profile counts
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS user_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS: users can only read/write their own rows
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_shot ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_favourites ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_tracked ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_shootlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_uploads ENABLE ROW LEVEL SECURITY;

-- Drop policies if they exist (so this migration can be re-run safely)
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

DROP POLICY IF EXISTS "Users can read own user_shot" ON user_shot;
DROP POLICY IF EXISTS "Users can insert own user_shot" ON user_shot;
DROP POLICY IF EXISTS "Users can delete own user_shot" ON user_shot;

DROP POLICY IF EXISTS "Users can read own user_favourites" ON user_favourites;
DROP POLICY IF EXISTS "Users can insert own user_favourites" ON user_favourites;
DROP POLICY IF EXISTS "Users can delete own user_favourites" ON user_favourites;

DROP POLICY IF EXISTS "Users can read own user_ratings" ON user_ratings;
DROP POLICY IF EXISTS "Users can insert own user_ratings" ON user_ratings;
DROP POLICY IF EXISTS "Users can update own user_ratings" ON user_ratings;
DROP POLICY IF EXISTS "Users can delete own user_ratings" ON user_ratings;

DROP POLICY IF EXISTS "Users can read own user_tracked" ON user_tracked;
DROP POLICY IF EXISTS "Users can insert own user_tracked" ON user_tracked;
DROP POLICY IF EXISTS "Users can update own user_tracked" ON user_tracked;
DROP POLICY IF EXISTS "Users can delete own user_tracked" ON user_tracked;

DROP POLICY IF EXISTS "Users can read own user_shootlist" ON user_shootlist;
DROP POLICY IF EXISTS "Users can insert own user_shootlist" ON user_shootlist;
DROP POLICY IF EXISTS "Users can delete own user_shootlist" ON user_shootlist;

DROP POLICY IF EXISTS "Users can read own reviews" ON reviews;
DROP POLICY IF EXISTS "Users can insert own reviews" ON reviews;
DROP POLICY IF EXISTS "Users can read own user_uploads" ON user_uploads;
DROP POLICY IF EXISTS "Users can insert own user_uploads" ON user_uploads;

CREATE POLICY "Users can read own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can read own user_shot" ON user_shot FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own user_shot" ON user_shot FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own user_shot" ON user_shot FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can read own user_favourites" ON user_favourites FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own user_favourites" ON user_favourites FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own user_favourites" ON user_favourites FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can read own user_ratings" ON user_ratings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own user_ratings" ON user_ratings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own user_ratings" ON user_ratings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own user_ratings" ON user_ratings FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can read own user_tracked" ON user_tracked FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own user_tracked" ON user_tracked FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own user_tracked" ON user_tracked FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own user_tracked" ON user_tracked FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can read own user_shootlist" ON user_shootlist FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own user_shootlist" ON user_shootlist FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own user_shootlist" ON user_shootlist FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can read own reviews" ON reviews FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own reviews" ON reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can read own user_uploads" ON user_uploads FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own user_uploads" ON user_uploads FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Stats: RPC with SECURITY DEFINER so server can read counts without RLS blocking
CREATE OR REPLACE FUNCTION get_film_stock_stats(p_slug TEXT)
RETURNS TABLE(shot_by_count bigint, favourites_count bigint, avg_rating numeric, rating_count bigint)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    (SELECT COUNT(*) FROM user_shot WHERE film_stock_slug = p_slug),
    (SELECT COUNT(*) FROM user_favourites WHERE film_stock_slug = p_slug),
    (SELECT ROUND(AVG(rating)::numeric, 1) FROM user_ratings WHERE film_stock_slug = p_slug AND rating > 0),
    (SELECT COUNT(*) FROM user_ratings WHERE film_stock_slug = p_slug AND rating > 0);
$$;

GRANT EXECUTE ON FUNCTION get_film_stock_stats(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION get_film_stock_stats(TEXT) TO authenticated;

-- Trigger: create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1), '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
