-- Film stock follows: users subscribe to stocks to see community uploads in their home feed.
CREATE TABLE IF NOT EXISTS user_followed_film_stocks (
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  film_stock_slug TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, film_stock_slug)
);

CREATE INDEX IF NOT EXISTS idx_user_followed_film_stocks_slug ON user_followed_film_stocks (film_stock_slug);

ALTER TABLE user_followed_film_stocks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own film stock follows" ON user_followed_film_stocks;
CREATE POLICY "Users read own film stock follows" ON user_followed_film_stocks
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users insert own film stock follows" ON user_followed_film_stocks;
CREATE POLICY "Users insert own film stock follows" ON user_followed_film_stocks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users delete own film stock follows" ON user_followed_film_stocks;
CREATE POLICY "Users delete own film stock follows" ON user_followed_film_stocks
  FOR DELETE USING (auth.uid() = user_id);
