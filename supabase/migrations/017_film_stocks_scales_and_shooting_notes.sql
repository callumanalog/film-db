-- Film stocks: grain, contrast, latitude as integer scale 1-5; add saturation 1-5; shooting_notes as JSONB (array of {header, dek}).
-- Converts existing text values to numbers and replaces shooting_tips with shooting_notes.

-- 1. Drop old CHECK constraints (from 011)
ALTER TABLE film_stocks DROP CONSTRAINT IF EXISTS film_stocks_grain_check;
ALTER TABLE film_stocks DROP CONSTRAINT IF EXISTS film_stocks_contrast_check;
ALTER TABLE film_stocks DROP CONSTRAINT IF EXISTS film_stocks_latitude_check;

-- 2. Add temporary integer columns and migrate data
ALTER TABLE film_stocks
  ADD COLUMN IF NOT EXISTS grain_int INTEGER,
  ADD COLUMN IF NOT EXISTS contrast_int INTEGER,
  ADD COLUMN IF NOT EXISTS latitude_int INTEGER;

-- Grain: fine -> 1, medium -> 3, strong -> 5
UPDATE film_stocks SET grain_int = CASE
  WHEN grain = 'fine' THEN 1
  WHEN grain = 'medium' THEN 3
  WHEN grain = 'strong' THEN 5
  ELSE NULL
END;

-- Contrast: low -> 1, medium -> 3, high -> 5
UPDATE film_stocks SET contrast_int = CASE
  WHEN contrast = 'low' THEN 1
  WHEN contrast = 'medium' THEN 3
  WHEN contrast = 'high' THEN 5
  ELSE NULL
END;

-- Latitude: very_narrow -> 1, narrow -> 2, moderate -> 3, wide -> 4, very_wide -> 5
UPDATE film_stocks SET latitude_int = CASE
  WHEN latitude = 'very_narrow' THEN 1
  WHEN latitude = 'narrow' THEN 2
  WHEN latitude = 'moderate' THEN 3
  WHEN latitude = 'wide' THEN 4
  WHEN latitude = 'very_wide' THEN 5
  ELSE NULL
END;

-- 3. Drop old text columns and rename integer columns
ALTER TABLE film_stocks DROP COLUMN IF EXISTS grain;
ALTER TABLE film_stocks DROP COLUMN IF EXISTS contrast;
ALTER TABLE film_stocks DROP COLUMN IF EXISTS latitude;

ALTER TABLE film_stocks RENAME COLUMN grain_int TO grain;
ALTER TABLE film_stocks RENAME COLUMN contrast_int TO contrast;
ALTER TABLE film_stocks RENAME COLUMN latitude_int TO latitude;

-- 4. Add CHECK constraints for 1-5
ALTER TABLE film_stocks ADD CONSTRAINT film_stocks_grain_check
  CHECK (grain IS NULL OR (grain >= 1 AND grain <= 5));
ALTER TABLE film_stocks ADD CONSTRAINT film_stocks_contrast_check
  CHECK (contrast IS NULL OR (contrast >= 1 AND contrast <= 5));
ALTER TABLE film_stocks ADD CONSTRAINT film_stocks_latitude_check
  CHECK (latitude IS NULL OR (latitude >= 1 AND latitude <= 5));

-- 5. Add saturation (new column, scale 1-5)
ALTER TABLE film_stocks ADD COLUMN IF NOT EXISTS saturation INTEGER;
ALTER TABLE film_stocks DROP CONSTRAINT IF EXISTS film_stocks_saturation_check;
ALTER TABLE film_stocks ADD CONSTRAINT film_stocks_saturation_check
  CHECK (saturation IS NULL OR (saturation >= 1 AND saturation <= 5));

-- 6. Add shooting_notes JSONB and migrate from shooting_tips, then drop shooting_tips
-- Shape: [{ "header": "...", "dek": "..." }, ...]
ALTER TABLE film_stocks ADD COLUMN IF NOT EXISTS shooting_notes JSONB DEFAULT '[]'::jsonb;

UPDATE film_stocks
SET shooting_notes = CASE
  WHEN shooting_tips IS NOT NULL AND trim(shooting_tips) != '' THEN
    jsonb_build_array(jsonb_build_object('header', '', 'dek', shooting_tips))
  ELSE '[]'::jsonb
END;

ALTER TABLE film_stocks DROP COLUMN IF EXISTS shooting_tips;

-- 7. Drop latitude_level (replaced by latitude 1-5)
ALTER TABLE film_stocks DROP COLUMN IF EXISTS latitude_level;
