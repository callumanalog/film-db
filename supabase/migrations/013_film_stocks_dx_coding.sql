-- Backfill DX coding (dx_coding) for all film stocks.
-- DX coding = conductive pattern on 35mm canister so cameras can auto-read ISO.
-- Only 35mm cassettes have DX; when a stock is sold in 35mm we set true if the canister is DX-coded.
-- Re-spooled, artisan, or repurposed 35mm without standard cassettes → false.

UPDATE film_stocks AS f
SET dx_coding = v.dx_coding
FROM (VALUES
  -- Kodak: all factory 35mm has DX (Kodak introduced the standard). Double-X is re-spooled from cinema → false.
  ('kodak-portra-400', true),
  ('kodak-portra-800', true),
  ('kodak-portra-160', true),
  ('kodak-gold-200', true),
  ('kodak-ultramax-400', true),
  ('kodak-proimage-100', true),
  ('kodak-ektar-100', true),
  ('kodak-colorplus-200', true),
  ('kodak-tri-x-400', true),
  ('kodak-tmax-400', true),
  ('kodak-tmax-100', true),
  ('kodak-tmax-p3200', true),
  ('kodak-ektachrome-e100', true),
  ('kodak-double-x', false),
  -- Fuji: all factory 35mm has DX
  ('fujifilm-superia-400', true),
  ('fujifilm-c200', true),
  ('fujifilm-pro-400h', true),
  ('fujifilm-velvia-50', true),
  ('fujifilm-provia-100f', true),
  ('fujifilm-acros-ii', true),
  ('fujifilm-velvia-100', true),
  ('fujifilm-superia-premium-400', true),
  ('fujifilm-natura-1600', true),
  -- Ilford / Harman: all factory 35mm has DX
  ('ilford-hp5-plus', true),
  ('ilford-delta-3200', true),
  ('ilford-fp4-plus', true),
  ('ilford-xp2-super', true),
  ('ilford-delta-100', true),
  ('ilford-delta-400', true),
  ('ilford-pan-f-plus', true),
  ('ilford-sfx-200', true),
  ('ilford-ortho-plus', true),
  -- CineStill: factory 35mm has DX (seed has dx_coding true for 800T)
  ('cinestill-800t', true),
  ('cinestill-50d', true),
  ('cinestill-400d', true),
  ('cinestill-bwxx', true),
  -- Lomography: factory 35mm cassettes are DX-coded
  ('lomography-color-negative-100', true),
  ('lomography-color-negative-400', true),
  ('lomography-color-negative-800', true),
  ('lomography-lady-grey-400', true),
  ('lomography-berlin-kino-400', true),
  ('lomography-earl-grey-100', true),
  ('lomography-lomochrome-purple', true),
  ('lomography-lomochrome-metropolis', true),
  ('lomography-potsdam-kino-100', true),
  ('lomography-fantome-kino-8', true),
  -- Foma: factory 35mm has DX
  ('fomapan-100-classic', true),
  ('fomapan-200-creative', true),
  ('fomapan-400-action', true),
  ('fomapan-r-100', true),
  ('retropan-320-soft', true),
  -- Rollei: factory 35mm has DX
  ('rollei-rpx-25', true),
  ('rollei-rpx-100', true),
  ('rollei-rpx-400', true),
  ('rollei-infrared-400', true),
  ('rollei-retro-80s', true),
  ('rollei-retro-400s', true),
  ('rollei-superpan-200', true),
  -- ADOX: factory 35mm has DX
  ('adox-silvermax-100', true),
  ('adox-cms-20-ii', true),
  ('adox-chs-100-ii', true),
  ('adox-hr-50', true),
  ('adox-color-mission-200', true),
  -- Kentmere (Harman): factory 35mm has DX
  ('kentmere-pan-100', true),
  ('kentmere-pan-400', true),
  -- Bergger, Agfa: factory 35mm has DX
  ('bergger-pancro-400', true),
  ('agfa-apx-100', true),
  ('agfa-apx-400', true),
  ('agfa-vista-plus-200', true),
  -- JCH StreetPan: sold in 35mm with standard cassettes
  ('jch-streetpan-400', true),
  -- Film Washi: artisan, hand-coated / sound film; non-standard cassettes → no DX
  ('washi-a', false),
  ('washi-s', false),
  -- Silberra, ORWO: factory 35mm
  ('silberra-u100', true),
  ('orwo-wolfen-nc500', true),
  ('orwo-wolfen-np100', true),
  -- Harman color: factory 35mm
  ('harman-phoenix-200', true),
  ('harman-red', true),
  ('harman-switch-azure', true),
  ('harman-phoenix-ii', true),
  -- Dubblefilm, Revolog: pre-exposed on standard 35mm cassettes
  ('dubblefilm-sunstroke', true),
  ('dubblefilm-monsoon', true),
  ('revolog-streak', true),
  ('revolog-kolor', true),
  ('revolog-460nm', true),
  -- Street Candy: repurposed surveillance film, re-spooled → no standard DX
  ('street-candy-mtn-100', false),
  -- Ferrania, Kosmo Foto: factory 35mm
  ('ferrania-p30-alpha', true),
  ('kosmo-foto-mono-100', true)
) AS v(slug, dx_coding)
WHERE f.slug = v.slug;
