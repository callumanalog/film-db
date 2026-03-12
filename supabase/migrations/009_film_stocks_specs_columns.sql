-- Specs columns: latitude level, color balance, year_introduced, dx_coding, development_process
-- (Catalog and film detail page expect these; without them latitude/color balance don't show in specs.)
ALTER TABLE film_stocks
  ADD COLUMN IF NOT EXISTS latitude_level TEXT CHECK (latitude_level IN ('very_narrow', 'narrow', 'moderate', 'wide', 'very_wide')),
  ADD COLUMN IF NOT EXISTS color_balance TEXT,
  ADD COLUMN IF NOT EXISTS color_balance_type TEXT CHECK (color_balance_type IN ('daylight', 'tungsten', 'neutral', 'daylight_balanced')),
  ADD COLUMN IF NOT EXISTS color_balance_kelvin NUMERIC(5,0),
  ADD COLUMN IF NOT EXISTS year_introduced INTEGER,
  ADD COLUMN IF NOT EXISTS dx_coding BOOLEAN,
  ADD COLUMN IF NOT EXISTS development_process TEXT CHECK (development_process IN ('c41', 'e6', 'bw', 'ecn2'));

-- Backfill CineStill 800T (and any other stocks) so latitude and color balance show in specs.
UPDATE film_stocks
SET
  latitude_level = 'wide',
  color_balance = 'Tungsten-balanced (≈3200K)'
WHERE slug = 'cinestill-800t';
