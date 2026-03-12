-- Film stocks: Release date, DX coding, Development process, Use case
-- Add these columns so the specs can be stored and displayed from Supabase.
-- Uses IF NOT EXISTS so safe to run even if some columns already exist (e.g. from 002 or 009).

-- Release date: year the stock was introduced/released (e.g. 1998). Displayed as "Release Date" in specs.
ALTER TABLE film_stocks
  ADD COLUMN IF NOT EXISTS year_introduced INTEGER;

-- DX coding: whether the film supports DX auto-coding (common for 35mm). Displayed as "DX Coding" in specs (Yes/No).
ALTER TABLE film_stocks
  ADD COLUMN IF NOT EXISTS dx_coding BOOLEAN;

-- Development process: C-41, E-6, B&W, or ECN-2. Displayed as "Development Process" in specs.
ALTER TABLE film_stocks
  ADD COLUMN IF NOT EXISTS development_process TEXT
  CHECK (development_process IS NULL OR development_process IN ('c41', 'e6', 'bw', 'ecn2'));

-- Use case: array of best-use categories (e.g. portrait, landscape, street, night). Displayed as "Use case" in specs.
-- Allowed values: portrait, landscape, street, wedding, travel, night, studio, everyday
ALTER TABLE film_stocks
  ADD COLUMN IF NOT EXISTS best_for TEXT[] DEFAULT '{}';

-- Backfill from known data (seed-data / researched values). Only updates rows that exist and match slug.
UPDATE film_stocks AS f
SET
  year_introduced = v.year_introduced,
  dx_coding = v.dx_coding,
  development_process = v.development_process,
  best_for = v.best_for
FROM (VALUES
  ('kodak-portra-400', 2010, true, 'c41', ARRAY['portrait','wedding','travel','everyday']),
  ('kodak-portra-800', 2001, NULL, NULL, ARRAY['portrait','wedding','night']),
  ('kodak-portra-160', 2010, NULL, NULL, ARRAY['portrait','wedding','studio']),
  ('kodak-gold-200', 1986, NULL, NULL, ARRAY['travel','everyday','street']),
  ('kodak-ultramax-400', 2007, NULL, NULL, ARRAY['travel','everyday','street']),
  ('kodak-proimage-100', 1997, NULL, 'c41', ARRAY['portrait','wedding','travel','everyday']),
  ('kodak-ektar-100', 2008, NULL, NULL, ARRAY['landscape','travel']),
  ('kodak-colorplus-200', 1988, NULL, NULL, ARRAY['everyday','travel']),
  ('kodak-tri-x-400', 1954, NULL, NULL, ARRAY['street','portrait','everyday']),
  ('kodak-tmax-400', 1986, NULL, NULL, ARRAY['portrait','studio','landscape']),
  ('kodak-tmax-100', 1986, NULL, NULL, ARRAY['landscape','studio','portrait']),
  ('kodak-tmax-p3200', 1988, NULL, NULL, ARRAY['night','street']),
  ('kodak-ektachrome-e100', 2018, NULL, NULL, ARRAY['landscape','travel','portrait']),
  ('kodak-double-x', 1959, NULL, NULL, ARRAY['street','portrait']),
  ('fujifilm-superia-400', 1998, NULL, NULL, ARRAY['street','travel','everyday']),
  ('fujifilm-c200', 1998, NULL, NULL, ARRAY['everyday','travel']),
  ('fujifilm-pro-400h', 2004, NULL, NULL, ARRAY['portrait','wedding']),
  ('fujifilm-velvia-50', 1990, NULL, NULL, ARRAY['landscape']),
  ('fujifilm-provia-100f', 2003, NULL, NULL, ARRAY['landscape','portrait','travel']),
  ('fujifilm-acros-ii', 2019, NULL, NULL, ARRAY['landscape','studio']),
  ('fujifilm-velvia-100', 2003, NULL, NULL, ARRAY['landscape','travel']),
  ('fujifilm-superia-premium-400', 2002, NULL, NULL, ARRAY['everyday','travel','portrait']),
  ('fujifilm-natura-1600', 2004, NULL, NULL, ARRAY['night','everyday','street']),
  ('ilford-hp5-plus', 1989, NULL, NULL, ARRAY['street','portrait','everyday']),
  ('ilford-delta-3200', 1998, NULL, NULL, ARRAY['night','street']),
  ('ilford-fp4-plus', 1990, NULL, NULL, ARRAY['landscape','studio']),
  ('ilford-xp2-super', 1998, NULL, NULL, ARRAY['travel','everyday']),
  ('ilford-delta-100', 2002, NULL, NULL, ARRAY['landscape','studio','portrait']),
  ('ilford-delta-400', 1990, NULL, NULL, ARRAY['portrait','street','landscape']),
  ('ilford-pan-f-plus', 2004, NULL, NULL, ARRAY['landscape','studio']),
  ('ilford-sfx-200', 2004, NULL, NULL, ARRAY['landscape']),
  ('ilford-ortho-plus', 2004, NULL, NULL, ARRAY['landscape','portrait','studio']),
  ('cinestill-800t', 2013, true, 'c41', ARRAY['night','street']),
  ('cinestill-50d', 2015, NULL, NULL, ARRAY['portrait','landscape','travel']),
  ('cinestill-400d', 2017, NULL, NULL, ARRAY['everyday','portrait','travel']),
  ('cinestill-bwxx', 2016, NULL, NULL, ARRAY['street','portrait','everyday']),
  ('lomography-color-negative-100', 2012, NULL, NULL, ARRAY['landscape','travel','street','everyday']),
  ('lomography-color-negative-400', 2012, NULL, NULL, ARRAY['street','everyday','travel','portrait']),
  ('lomography-color-negative-800', 2012, NULL, NULL, ARRAY['night','street','everyday','travel']),
  ('lomography-lady-grey-400', 2014, NULL, NULL, ARRAY['portrait','street','everyday']),
  ('lomography-berlin-kino-400', 2017, NULL, NULL, ARRAY['street','portrait','night']),
  ('lomography-earl-grey-100', 2014, NULL, NULL, ARRAY['portrait','street','landscape','everyday']),
  ('lomography-lomochrome-purple', 2013, NULL, NULL, ARRAY['landscape','travel','portrait','everyday']),
  ('lomography-lomochrome-metropolis', 2019, NULL, NULL, ARRAY['street','portrait','travel','everyday']),
  ('lomography-potsdam-kino-100', 2018, NULL, NULL, ARRAY['portrait','studio','landscape']),
  ('lomography-fantome-kino-8', 2019, NULL, NULL, ARRAY['landscape','studio','portrait']),
  ('fomapan-100-classic', 1995, NULL, NULL, ARRAY['portrait','landscape','street','everyday']),
  ('fomapan-200-creative', 1995, NULL, NULL, ARRAY['street','portrait','everyday','travel']),
  ('fomapan-400-action', 1995, NULL, NULL, ARRAY['street','everyday','night','travel']),
  ('fomapan-r-100', 2008, NULL, NULL, ARRAY['landscape','studio','portrait']),
  ('retropan-320-soft', 2015, NULL, NULL, ARRAY['portrait','landscape','studio']),
  ('rollei-rpx-25', 2013, NULL, NULL, ARRAY['landscape','portrait','studio']),
  ('rollei-rpx-100', 2011, NULL, NULL, ARRAY['landscape','portrait','street','everyday']),
  ('rollei-rpx-400', 2011, NULL, NULL, ARRAY['street','everyday','night','travel']),
  ('rollei-infrared-400', 2012, NULL, NULL, ARRAY['landscape','portrait','travel']),
  ('rollei-retro-80s', 2014, NULL, NULL, ARRAY['landscape','portrait','street']),
  ('rollei-retro-400s', 2014, NULL, NULL, ARRAY['landscape','street','travel','everyday']),
  ('rollei-superpan-200', 2015, NULL, NULL, ARRAY['landscape','portrait','street']),
  ('adox-silvermax-100', 2013, NULL, NULL, ARRAY['portrait','landscape','studio']),
  ('adox-cms-20-ii', 2012, NULL, NULL, ARRAY['landscape','studio','portrait']),
  ('adox-chs-100-ii', 2010, NULL, NULL, ARRAY['portrait','landscape','street','everyday']),
  ('adox-hr-50', 2014, NULL, NULL, ARRAY['landscape','portrait','studio']),
  ('adox-color-mission-200', 2019, NULL, NULL, ARRAY['portrait','travel','street','everyday']),
  ('kentmere-pan-100', 2007, NULL, NULL, ARRAY['landscape','portrait','everyday']),
  ('kentmere-pan-400', 2007, NULL, NULL, ARRAY['street','everyday','travel']),
  ('bergger-pancro-400', 2010, NULL, NULL, ARRAY['portrait','studio','landscape']),
  ('agfa-apx-100', 2005, NULL, NULL, ARRAY['landscape','portrait','studio']),
  ('agfa-apx-400', 2005, NULL, NULL, ARRAY['street','everyday','travel']),
  ('agfa-vista-plus-200', 2003, NULL, NULL, ARRAY['everyday','travel','landscape']),
  ('jch-streetpan-400', 2015, NULL, NULL, ARRAY['street','night','travel']),
  ('washi-a', 2013, NULL, NULL, ARRAY['studio','landscape']),
  ('washi-s', 2015, NULL, NULL, ARRAY['street','studio']),
  ('silberra-u100', 2016, NULL, NULL, ARRAY['landscape','portrait','everyday']),
  ('orwo-wolfen-nc500', 2018, NULL, NULL, ARRAY['street','everyday','travel']),
  ('orwo-wolfen-np100', 2018, NULL, NULL, ARRAY['landscape','portrait','everyday']),
  ('harman-phoenix-200', 2024, NULL, NULL, ARRAY['street','everyday','travel']),
  ('harman-red', 2024, NULL, 'c41', ARRAY['portrait','street','everyday']),
  ('harman-switch-azure', 2024, NULL, 'c41', ARRAY['landscape','travel','everyday']),
  ('harman-phoenix-ii', 2025, NULL, NULL, ARRAY['street','everyday','travel']),
  ('dubblefilm-sunstroke', 2018, NULL, NULL, ARRAY['travel','everyday','portrait']),
  ('dubblefilm-monsoon', 2018, NULL, NULL, ARRAY['travel','everyday','landscape']),
  ('revolog-streak', 2012, NULL, NULL, ARRAY['travel','portrait','everyday']),
  ('revolog-kolor', 2014, NULL, NULL, ARRAY['travel','portrait','everyday']),
  ('revolog-460nm', 2016, NULL, NULL, ARRAY['portrait','night','street']),
  ('street-candy-mtn-100', 2015, NULL, NULL, ARRAY['street','everyday']),
  ('ferrania-p30-alpha', 2017, NULL, NULL, ARRAY['street','portrait','landscape']),
  ('kosmo-foto-mono-100', 2020, NULL, NULL, ARRAY['street','landscape','everyday'])
) AS v(slug, year_introduced, dx_coding, development_process, best_for)
WHERE f.slug = v.slug;
