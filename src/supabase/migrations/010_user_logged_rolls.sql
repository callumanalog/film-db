-- Logged rolls: multiple rolls per user per film (e.g. "In Fridge" from Log Roll drawer)
CREATE TABLE IF NOT EXISTS user_logged_rolls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  film_stock_slug TEXT NOT NULL,
  format TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'in_fridge',
  expiry_date TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_logged_rolls_user ON user_logged_rolls(user_id);
CREATE INDEX IF NOT EXISTS idx_user_logged_rolls_slug ON user_logged_rolls(film_stock_slug);

ALTER TABLE user_logged_rolls ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own user_logged_rolls" ON user_logged_rolls;
DROP POLICY IF EXISTS "Users can insert own user_logged_rolls" ON user_logged_rolls;
DROP POLICY IF EXISTS "Users can delete own user_logged_rolls" ON user_logged_rolls;

CREATE POLICY "Users can read own user_logged_rolls" ON user_logged_rolls FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own user_logged_rolls" ON user_logged_rolls FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own user_logged_rolls" ON user_logged_rolls FOR DELETE USING (auth.uid() = user_id);
