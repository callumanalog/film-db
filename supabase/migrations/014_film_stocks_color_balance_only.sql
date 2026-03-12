-- Single column for color balance: use color_balance only; drop color_palette.
-- Ensures color_balance exists, copies any data from color_palette (if present), then drops color_palette.

ALTER TABLE film_stocks ADD COLUMN IF NOT EXISTS color_balance TEXT;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'film_stocks' AND column_name = 'color_palette'
  ) THEN
    UPDATE film_stocks
    SET color_balance = COALESCE(NULLIF(TRIM(color_balance), ''), color_palette)
    WHERE color_palette IS NOT NULL AND (color_balance IS NULL OR TRIM(color_balance) = '');
    ALTER TABLE film_stocks DROP COLUMN color_palette;
  END IF;
END $$;
