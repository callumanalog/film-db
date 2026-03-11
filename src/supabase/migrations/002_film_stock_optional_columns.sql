-- Optional columns for filter/sort and richer display (nullable for backward compatibility)
ALTER TABLE film_stocks
  ADD COLUMN IF NOT EXISTS grain_level TEXT CHECK (grain_level IN ('fine', 'medium', 'strong')),
  ADD COLUMN IF NOT EXISTS contrast_level TEXT CHECK (contrast_level IN ('low', 'medium', 'high')),
  ADD COLUMN IF NOT EXISTS best_for TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS rating NUMERIC(2,1) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS price_tier SMALLINT CHECK (price_tier IN (1, 2, 3)),
  ADD COLUMN IF NOT EXISTS base_price_usd NUMERIC(6,2);

CREATE INDEX IF NOT EXISTS idx_film_stocks_featured ON film_stocks(featured);
CREATE INDEX IF NOT EXISTS idx_film_stocks_rating ON film_stocks(rating);
