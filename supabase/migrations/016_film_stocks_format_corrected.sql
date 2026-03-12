-- Update format (35mm, 120, 4x5, 8x10) for all film stocks.
-- Researched from manufacturer and retailer listings; fixes e.g. Kodak Gold 200 (add 120).
-- format column type: film_format[] (enum: 35mm, 120, 4x5, 8x10, 110, instant).

UPDATE film_stocks AS f
SET format = v.format
FROM (VALUES
  -- Kodak
  ('kodak-portra-400', ARRAY['35mm','120']::film_format[]),
  ('kodak-portra-800', ARRAY['35mm','120']::film_format[]),
  ('kodak-portra-160', ARRAY['35mm','120']::film_format[]),
  ('kodak-gold-200', ARRAY['35mm','120']::film_format[]),
  ('kodak-ultramax-400', ARRAY['35mm']::film_format[]),
  ('kodak-proimage-100', ARRAY['35mm']::film_format[]),
  ('kodak-ektar-100', ARRAY['35mm','120']::film_format[]),
  ('kodak-colorplus-200', ARRAY['35mm']::film_format[]),
  ('kodak-tri-x-400', ARRAY['35mm','120']::film_format[]),
  ('kodak-tmax-400', ARRAY['35mm','120']::film_format[]),
  ('kodak-tmax-100', ARRAY['35mm','120','4x5']::film_format[]),
  ('kodak-tmax-p3200', ARRAY['35mm','120']::film_format[]),
  ('kodak-ektachrome-e100', ARRAY['35mm','120','4x5','8x10']::film_format[]),
  ('kodak-double-x', ARRAY['35mm']::film_format[]),
  -- Fujifilm
  ('fujifilm-superia-400', ARRAY['35mm','120']::film_format[]),
  ('fujifilm-c200', ARRAY['35mm']::film_format[]),
  ('fujifilm-pro-400h', ARRAY['35mm','120']::film_format[]),
  ('fujifilm-velvia-50', ARRAY['35mm','120','4x5']::film_format[]),
  ('fujifilm-provia-100f', ARRAY['35mm','120','4x5','8x10']::film_format[]),
  ('fujifilm-acros-ii', ARRAY['35mm','120']::film_format[]),
  ('fujifilm-velvia-100', ARRAY['35mm','120','4x5']::film_format[]),
  ('fujifilm-superia-premium-400', ARRAY['35mm']::film_format[]),
  ('fujifilm-natura-1600', ARRAY['35mm']::film_format[]),
  -- Ilford
  ('ilford-hp5-plus', ARRAY['35mm','120','4x5','8x10']::film_format[]),
  ('ilford-delta-3200', ARRAY['35mm','120']::film_format[]),
  ('ilford-fp4-plus', ARRAY['35mm','120','4x5','8x10']::film_format[]),
  ('ilford-xp2-super', ARRAY['35mm','120']::film_format[]),
  ('ilford-delta-100', ARRAY['35mm','120','4x5']::film_format[]),
  ('ilford-delta-400', ARRAY['35mm','120','4x5']::film_format[]),
  ('ilford-pan-f-plus', ARRAY['35mm','120']::film_format[]),
  ('ilford-sfx-200', ARRAY['35mm','120']::film_format[]),
  ('ilford-ortho-plus', ARRAY['35mm','120','4x5']::film_format[]),
  -- CineStill
  ('cinestill-800t', ARRAY['35mm','120']::film_format[]),
  ('cinestill-50d', ARRAY['35mm','120']::film_format[]),
  ('cinestill-400d', ARRAY['35mm','120']::film_format[]),
  ('cinestill-bwxx', ARRAY['35mm','120']::film_format[]),
  -- Lomography
  ('lomography-color-negative-100', ARRAY['35mm','120']::film_format[]),
  ('lomography-color-negative-400', ARRAY['35mm','120']::film_format[]),
  ('lomography-color-negative-800', ARRAY['35mm','120']::film_format[]),
  ('lomography-lady-grey-400', ARRAY['35mm']::film_format[]),
  ('lomography-berlin-kino-400', ARRAY['35mm','120']::film_format[]),
  ('lomography-earl-grey-100', ARRAY['35mm','120']::film_format[]),
  ('lomography-lomochrome-purple', ARRAY['35mm','120']::film_format[]),
  ('lomography-lomochrome-metropolis', ARRAY['35mm','120']::film_format[]),
  ('lomography-potsdam-kino-100', ARRAY['35mm','120']::film_format[]),
  ('lomography-fantome-kino-8', ARRAY['35mm']::film_format[]),
  -- Foma
  ('fomapan-100-classic', ARRAY['35mm','120','4x5']::film_format[]),
  ('fomapan-200-creative', ARRAY['35mm','120','4x5']::film_format[]),
  ('fomapan-400-action', ARRAY['35mm','120','4x5']::film_format[]),
  ('fomapan-r-100', ARRAY['35mm']::film_format[]),
  ('retropan-320-soft', ARRAY['35mm','120']::film_format[]),
  -- Rollei
  ('rollei-rpx-25', ARRAY['35mm','120']::film_format[]),
  ('rollei-rpx-100', ARRAY['35mm','120']::film_format[]),
  ('rollei-rpx-400', ARRAY['35mm','120']::film_format[]),
  ('rollei-infrared-400', ARRAY['35mm']::film_format[]),
  ('rollei-retro-80s', ARRAY['35mm','120']::film_format[]),
  ('rollei-retro-400s', ARRAY['35mm','120']::film_format[]),
  ('rollei-superpan-200', ARRAY['35mm','120']::film_format[]),
  -- ADOX
  ('adox-silvermax-100', ARRAY['35mm']::film_format[]),
  ('adox-cms-20-ii', ARRAY['35mm','120']::film_format[]),
  ('adox-chs-100-ii', ARRAY['35mm','120']::film_format[]),
  ('adox-hr-50', ARRAY['35mm']::film_format[]),
  ('adox-color-mission-200', ARRAY['35mm']::film_format[]),
  -- Kentmere (35mm only)
  ('kentmere-pan-100', ARRAY['35mm']::film_format[]),
  ('kentmere-pan-400', ARRAY['35mm']::film_format[]),
  -- Bergger
  ('bergger-pancro-400', ARRAY['35mm','120','4x5']::film_format[]),
  -- Agfa
  ('agfa-apx-100', ARRAY['35mm','120']::film_format[]),
  ('agfa-apx-400', ARRAY['35mm','120']::film_format[]),
  ('agfa-vista-plus-200', ARRAY['35mm']::film_format[]),
  -- JCH, Washi, Silberra, ORWO
  ('jch-streetpan-400', ARRAY['35mm','120']::film_format[]),
  ('washi-a', ARRAY['35mm']::film_format[]),
  ('washi-s', ARRAY['35mm']::film_format[]),
  ('silberra-u100', ARRAY['35mm','120']::film_format[]),
  ('orwo-wolfen-nc500', ARRAY['35mm']::film_format[]),
  ('orwo-wolfen-np100', ARRAY['35mm']::film_format[]),
  -- Harman
  ('harman-phoenix-200', ARRAY['35mm','120']::film_format[]),
  ('harman-red', ARRAY['35mm','120']::film_format[]),
  ('harman-switch-azure', ARRAY['35mm','120']::film_format[]),
  ('harman-phoenix-ii', ARRAY['35mm','120']::film_format[]),
  -- Dubblefilm, Revolog, Street Candy, Ferrania, Kosmo Foto (35mm only)
  ('dubblefilm-sunstroke', ARRAY['35mm']::film_format[]),
  ('dubblefilm-monsoon', ARRAY['35mm']::film_format[]),
  ('revolog-streak', ARRAY['35mm']::film_format[]),
  ('revolog-kolor', ARRAY['35mm']::film_format[]),
  ('revolog-460nm', ARRAY['35mm']::film_format[]),
  ('street-candy-mtn-100', ARRAY['35mm']::film_format[]),
  ('ferrania-p30-alpha', ARRAY['35mm']::film_format[]),
  ('kosmo-foto-mono-100', ARRAY['35mm']::film_format[])
) AS v(slug, format)
WHERE f.slug = v.slug;
