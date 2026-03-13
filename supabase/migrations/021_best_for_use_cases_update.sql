-- Update best_for (use cases) to new taxonomy and backfill with research-informed assignments.
-- New values: general_purpose, portrait, street, landscapes, architecture, documentary, sports,
-- travel, weddings, studio, bright_sun, golden_hour, low_light, artificial_light, experimental.
-- Mapping: everyday→general_purpose, landscape→landscapes, night→low_light, sunny_conditions→bright_sun,
-- wedding→weddings, creative→experimental.

-- 1. Drop old constraint so we can update to new values
ALTER TABLE film_stocks DROP CONSTRAINT IF EXISTS film_stocks_best_for_allowed;

-- 2. Transform existing best_for arrays (map old → new) so no invalid values remain
UPDATE film_stocks
SET best_for = COALESCE(
  (
    SELECT array_agg(new_val ORDER BY ord)
    FROM (
      SELECT ord, CASE elem
      WHEN 'everyday' THEN 'general_purpose'
      WHEN 'landscape' THEN 'landscapes'
      WHEN 'night' THEN 'low_light'
      WHEN 'sunny_conditions' THEN 'bright_sun'
      WHEN 'wedding' THEN 'weddings'
      WHEN 'creative' THEN 'experimental'
      WHEN 'portrait' THEN 'portrait'
      WHEN 'street' THEN 'street'
      WHEN 'sports' THEN 'sports'
      WHEN 'travel' THEN 'travel'
      WHEN 'studio' THEN 'studio'
      ELSE NULL
    END AS new_val
      FROM unnest(COALESCE(best_for, '{}')) WITH ORDINALITY AS t(elem, ord)
    ) sub
    WHERE new_val IS NOT NULL
  ),
  '{}'
);

-- 3. Set new best_for per stock (merge mapped values with research-informed new use cases)
-- Format: slug -> full replacement array. Includes architecture, documentary, golden_hour, artificial_light, bright_sun where applicable.
UPDATE film_stocks AS f
SET best_for = v.best_for
FROM (VALUES
  ('kodak-portra-400', ARRAY['general_purpose','portrait','weddings','travel','street','documentary','golden_hour']),
  ('kodak-portra-800', ARRAY['portrait','weddings','low_light','artificial_light','golden_hour']),
  ('kodak-portra-160', ARRAY['portrait','weddings','studio','landscapes','architecture','golden_hour','bright_sun']),
  ('kodak-gold-200', ARRAY['travel','general_purpose','street','golden_hour','bright_sun']),
  ('kodak-ultramax-400', ARRAY['travel','general_purpose','street','documentary']),
  ('kodak-proimage-100', ARRAY['portrait','weddings','travel','general_purpose','golden_hour','bright_sun']),
  ('kodak-ektar-100', ARRAY['landscapes','travel','architecture','bright_sun','golden_hour']),
  ('kodak-colorplus-200', ARRAY['general_purpose','travel','bright_sun']),
  ('kodak-tri-x-400', ARRAY['street','portrait','general_purpose','documentary','low_light']),
  ('kodak-tmax-400', ARRAY['portrait','studio','landscapes','architecture','documentary']),
  ('kodak-tmax-100', ARRAY['landscapes','studio','portrait','architecture','bright_sun']),
  ('kodak-tmax-p3200', ARRAY['low_light','street','artificial_light','sports']),
  ('kodak-ektachrome-e100', ARRAY['landscapes','travel','portrait','architecture','bright_sun']),
  ('kodak-double-x', ARRAY['street','portrait','documentary']),
  ('fujifilm-superia-400', ARRAY['street','travel','general_purpose','documentary','low_light']),
  ('fujifilm-c200', ARRAY['general_purpose','travel','bright_sun']),
  ('fujifilm-pro-400h', ARRAY['portrait','weddings','golden_hour']),
  ('fujifilm-velvia-50', ARRAY['landscapes','architecture','bright_sun']),
  ('fujifilm-provia-100f', ARRAY['landscapes','portrait','travel','architecture','bright_sun']),
  ('fujifilm-acros-ii', ARRAY['landscapes','studio','architecture','documentary','bright_sun']),
  ('fujifilm-velvia-100', ARRAY['landscapes','travel','bright_sun']),
  ('fujifilm-superia-premium-400', ARRAY['general_purpose','travel','portrait','golden_hour']),
  ('fujifilm-natura-1600', ARRAY['low_light','general_purpose','street','artificial_light']),
  ('ilford-hp5-plus', ARRAY['street','portrait','general_purpose','documentary','low_light']),
  ('ilford-delta-3200', ARRAY['low_light','street','artificial_light','sports']),
  ('ilford-fp4-plus', ARRAY['landscapes','studio','architecture','documentary','bright_sun']),
  ('ilford-xp2-super', ARRAY['travel','general_purpose','architecture','documentary']),
  ('ilford-delta-100', ARRAY['landscapes','studio','portrait','architecture','bright_sun']),
  ('ilford-delta-400', ARRAY['portrait','street','landscapes','documentary']),
  ('ilford-pan-f-plus', ARRAY['landscapes','studio','architecture','bright_sun']),
  ('ilford-sfx-200', ARRAY['landscapes','experimental']),
  ('ilford-ortho-plus', ARRAY['landscapes','portrait','studio','experimental']),
  ('cinestill-800t', ARRAY['low_light','street','artificial_light','documentary']),
  ('cinestill-50d', ARRAY['portrait','landscapes','travel','bright_sun','architecture']),
  ('cinestill-400d', ARRAY['general_purpose','portrait','travel','documentary','golden_hour']),
  ('cinestill-bwxx', ARRAY['street','portrait','general_purpose','documentary']),
  ('lomography-color-negative-100', ARRAY['landscapes','travel','street','general_purpose','experimental']),
  ('lomography-color-negative-400', ARRAY['street','general_purpose','travel','portrait','experimental']),
  ('lomography-color-negative-800', ARRAY['low_light','street','general_purpose','travel','experimental']),
  ('lomography-lady-grey-400', ARRAY['portrait','street','general_purpose','experimental']),
  ('lomography-berlin-kino-400', ARRAY['street','portrait','low_light','experimental']),
  ('lomography-earl-grey-100', ARRAY['portrait','street','landscapes','general_purpose','experimental']),
  ('lomography-lomochrome-purple', ARRAY['landscapes','travel','portrait','general_purpose','experimental']),
  ('lomography-lomochrome-metropolis', ARRAY['street','portrait','travel','general_purpose','experimental']),
  ('lomography-potsdam-kino-100', ARRAY['portrait','studio','landscapes','experimental']),
  ('lomography-fantome-kino-8', ARRAY['landscapes','studio','portrait','architecture','experimental']),
  ('fomapan-100-classic', ARRAY['portrait','landscapes','street','general_purpose']),
  ('fomapan-200-creative', ARRAY['street','portrait','general_purpose','travel','experimental']),
  ('fomapan-400-action', ARRAY['street','general_purpose','low_light','travel','sports']),
  ('fomapan-r-100', ARRAY['landscapes','studio','portrait','architecture','bright_sun']),
  ('retropan-320-soft', ARRAY['portrait','landscapes','studio','golden_hour']),
  ('rollei-rpx-25', ARRAY['landscapes','portrait','studio','architecture','bright_sun']),
  ('rollei-rpx-100', ARRAY['landscapes','portrait','street','general_purpose']),
  ('rollei-rpx-400', ARRAY['street','general_purpose','low_light','travel']),
  ('rollei-infrared-400', ARRAY['landscapes','portrait','travel','experimental']),
  ('rollei-retro-80s', ARRAY['landscapes','portrait','street','documentary']),
  ('rollei-retro-400s', ARRAY['landscapes','street','travel','general_purpose']),
  ('rollei-superpan-200', ARRAY['landscapes','portrait','street','documentary']),
  ('adox-silvermax-100', ARRAY['portrait','landscapes','studio','documentary']),
  ('adox-cms-20-ii', ARRAY['landscapes','studio','portrait','architecture','bright_sun']),
  ('adox-chs-100-ii', ARRAY['portrait','landscapes','street','general_purpose']),
  ('adox-hr-50', ARRAY['landscapes','portrait','studio','architecture','bright_sun']),
  ('adox-color-mission-200', ARRAY['portrait','travel','street','general_purpose']),
  ('kentmere-pan-100', ARRAY['landscapes','portrait','general_purpose','bright_sun']),
  ('kentmere-pan-400', ARRAY['street','general_purpose','travel','documentary']),
  ('bergger-pancro-400', ARRAY['portrait','studio','landscapes','architecture','documentary']),
  ('agfa-apx-100', ARRAY['landscapes','portrait','studio','architecture','bright_sun']),
  ('agfa-apx-400', ARRAY['street','general_purpose','travel','documentary']),
  ('agfa-vista-plus-200', ARRAY['general_purpose','travel','landscapes','golden_hour']),
  ('jch-streetpan-400', ARRAY['street','low_light','travel','documentary']),
  ('washi-a', ARRAY['studio','landscapes','architecture','experimental']),
  ('washi-s', ARRAY['street','studio','experimental']),
  ('silberra-u100', ARRAY['landscapes','portrait','general_purpose','documentary']),
  ('orwo-wolfen-nc500', ARRAY['street','general_purpose','travel']),
  ('orwo-wolfen-np100', ARRAY['landscapes','portrait','general_purpose']),
  ('harman-phoenix-200', ARRAY['street','general_purpose','travel','experimental']),
  ('harman-red', ARRAY['portrait','street','general_purpose','golden_hour','experimental']),
  ('harman-switch-azure', ARRAY['landscapes','travel','general_purpose','experimental']),
  ('harman-phoenix-ii', ARRAY['street','general_purpose','travel','experimental']),
  ('dubblefilm-sunstroke', ARRAY['travel','general_purpose','portrait','golden_hour','bright_sun','experimental']),
  ('dubblefilm-monsoon', ARRAY['travel','general_purpose','landscapes','experimental']),
  ('revolog-streak', ARRAY['travel','portrait','general_purpose','experimental']),
  ('revolog-kolor', ARRAY['travel','portrait','general_purpose','experimental']),
  ('revolog-460nm', ARRAY['portrait','low_light','street','experimental']),
  ('street-candy-mtn-100', ARRAY['street','general_purpose','documentary','experimental']),
  ('ferrania-p30-alpha', ARRAY['street','portrait','landscapes','documentary']),
  ('kosmo-foto-mono-100', ARRAY['street','landscapes','general_purpose'])
) AS v(slug, best_for)
WHERE f.slug = v.slug;

-- 4. Add new constraint with allowed use case values
ALTER TABLE film_stocks ADD CONSTRAINT film_stocks_best_for_allowed
  CHECK (
    best_for IS NOT NULL
    AND best_for <@ ARRAY[
      'general_purpose', 'portrait', 'street', 'landscapes', 'architecture', 'documentary',
      'sports', 'travel', 'weddings', 'studio', 'bright_sun', 'golden_hour', 'low_light',
      'artificial_light', 'experimental'
    ]::text[]
  );
