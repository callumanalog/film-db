-- Restrict film_stocks dropdown columns to allowed values so Supabase Table Editor
-- only offers valid options. Format and Type are already enforced by ENUMs (001).
-- Use existing columns: grain, contrast (not grain_level/contrast_level).

-- Normalize existing data so CHECK constraints can be applied (invalid values → NULL).
UPDATE film_stocks SET grain = NULL WHERE grain IS NOT NULL AND grain NOT IN ('fine', 'medium', 'strong');
UPDATE film_stocks SET contrast = NULL WHERE contrast IS NOT NULL AND contrast NOT IN ('low', 'medium', 'high');

-- Grain: single-select (Fine, Medium, Strong) — stored in column "grain"
ALTER TABLE film_stocks DROP CONSTRAINT IF EXISTS film_stocks_grain_check;
ALTER TABLE film_stocks ADD CONSTRAINT film_stocks_grain_check
  CHECK (grain IS NULL OR grain IN ('fine', 'medium', 'strong'));

-- Contrast: single-select (Low, Medium, High) — stored in column "contrast"
ALTER TABLE film_stocks DROP CONSTRAINT IF EXISTS film_stocks_contrast_check;
ALTER TABLE film_stocks ADD CONSTRAINT film_stocks_contrast_check
  CHECK (contrast IS NULL OR contrast IN ('low', 'medium', 'high'));

-- Latitude: single-select (Very Narrow → Very Wide) — stored in column "latitude"
UPDATE film_stocks SET latitude = NULL WHERE latitude IS NOT NULL AND latitude NOT IN ('very_narrow', 'narrow', 'moderate', 'wide', 'very_wide');
ALTER TABLE film_stocks DROP CONSTRAINT IF EXISTS film_stocks_latitude_check;
ALTER TABLE film_stocks DROP CONSTRAINT IF EXISTS film_stocks_latitude_level_check;
ALTER TABLE film_stocks ADD CONSTRAINT film_stocks_latitude_check
  CHECK (latitude IS NULL OR latitude IN ('very_narrow', 'narrow', 'moderate', 'wide', 'very_wide'));

-- Development process: single-select (C-41, E-6, B&W, ECN-2)
ALTER TABLE film_stocks DROP CONSTRAINT IF EXISTS film_stocks_development_process_check;
ALTER TABLE film_stocks ADD CONSTRAINT film_stocks_development_process_check
  CHECK (development_process IS NULL OR development_process IN ('c41', 'e6', 'bw', 'ecn2'));

-- Use case (best_for): multiselect — each element must be from the allowed list
ALTER TABLE film_stocks DROP CONSTRAINT IF EXISTS film_stocks_best_for_allowed;
ALTER TABLE film_stocks ADD CONSTRAINT film_stocks_best_for_allowed
  CHECK (
    best_for IS NOT NULL
    AND best_for <@ ARRAY[
      'portrait', 'landscape', 'street', 'wedding', 'travel', 'night',
      'studio', 'everyday', 'sports', 'sunny_conditions', 'creative'
    ]::text[]
  );

-- Format and Type are already restricted by PostgreSQL ENUMs in 001_initial_schema:
--   format: film_format[] — 35mm, 120, 4x5, 8x10, 110, instant
--   type: film_type — color_negative, color_reversal, bw_negative, bw_reversal, instant
