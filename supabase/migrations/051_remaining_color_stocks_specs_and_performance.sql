-- Update scale-based specs and Performance notes for remaining conventional color stocks.
-- Excludes Fujifilm and Kodak color stocks, plus effect/experimental color stocks.

-- adox-color-mission-200
UPDATE film_stocks SET
  grain = 2,
  contrast = 3,
  saturation = 2,
  latitude = 4,
  shooting_notes = '[
    {"header": "Skin Tones", "dek": "Warm and honest. Color Mission 200 renders skin with a natural warmth that feels gentle and flattering rather than glossy or over-polished."},
    {"header": "Color Bias", "dek": "Subtle and restrained. The palette leans mildly warm with clean blues and a slightly vintage European softness instead of vivid modern punch."},
    {"header": "Push/Pull", "dek": "Best slightly over. It rewards a little extra exposure more than aggressive pushing, which helps the film stay smooth and keeps the color calm."},
    {"header": "Shadow Detail", "dek": "Nicely preserved. Shadows stay open and readable when the negative is exposed generously, giving the stock a forgiving all-round feel."},
    {"header": "Highlight Roll-off", "dek": "Smooth and gentle. Highlights taper away with an easy shoulder that suits portraits, travel scenes, and bright daylight."}
  ]'::jsonb
WHERE slug = 'adox-color-mission-200';

-- agfa-vista-plus-200
UPDATE film_stocks SET
  grain = 2,
  contrast = 3,
  saturation = 4,
  latitude = 4,
  shooting_notes = '[
    {"header": "Skin Tones", "dek": "Golden and lively. Vista Plus 200 gives skin a sunny consumer-film warmth that looks cheerful rather than especially neutral."},
    {"header": "Color Bias", "dek": "Warm with pop. Greens and warm tones come through with more energy than a muted stock, making outdoor scenes feel bright and nostalgic."},
    {"header": "Push/Pull", "dek": "Likes extra light. It behaves best at box speed or slightly overexposed, where the film smooths out and keeps its colorful consumer character."},
    {"header": "Shadow Detail", "dek": "Good for daylight. Shadows stay surprisingly open when exposure is generous, though it is happiest in brighter scenes than dim interiors."},
    {"header": "Highlight Roll-off", "dek": "Pleasantly forgiving. Bright areas hold together well and fade out with a soft, easy snapshot-film shoulder."}
  ]'::jsonb
WHERE slug = 'agfa-vista-plus-200';

-- cinestill-400d
UPDATE film_stocks SET
  grain = 2,
  contrast = 3,
  saturation = 3,
  latitude = 4,
  shooting_notes = '[
    {"header": "Skin Tones", "dek": "Soft and flattering. 400D gives skin a natural cinematic warmth with enough polish to feel professional without losing realism."},
    {"header": "Color Bias", "dek": "Balanced with warmth. It stays mostly neutral in daylight but carries a slight warm motion-picture richness, especially when overexposed a little."},
    {"header": "Push/Pull", "dek": "Quite flexible. The stock handles a push to 800 well, while slight overexposure gives smoother grain and a creamier overall look."},
    {"header": "Shadow Detail", "dek": "Strong retention. It holds onto darker tonal information better than many still-photo consumer films, which is part of its cinema-stock appeal."},
    {"header": "Highlight Roll-off", "dek": "Smooth and polished. Highlights compress gracefully in bright scenes, giving scans a refined, filmic shoulder."}
  ]'::jsonb
WHERE slug = 'cinestill-400d';

-- cinestill-50d
UPDATE film_stocks SET
  grain = 1,
  contrast = 3,
  saturation = 4,
  latitude = 4,
  shooting_notes = '[
    {"header": "Skin Tones", "dek": "Clean and luminous. 50D renders skin beautifully in daylight, with polished natural color and very little grain distraction."},
    {"header": "Color Bias", "dek": "Neutral with richness. It stays daylight-accurate but carries a cinematic depth that makes color look vivid without turning synthetic."},
    {"header": "Push/Pull", "dek": "Best in bright light. This stock is more about careful exposure and gorgeous low-speed color than chasing flexibility through pushing."},
    {"header": "Shadow Detail", "dek": "Excellent when exposed. In the light it was built for, shadows stay detailed and clean with very refined tonal separation."},
    {"header": "Highlight Roll-off", "dek": "Exceptional control. Bright highlights hold together beautifully, which is why the film feels so polished in sunlit scenes."}
  ]'::jsonb
WHERE slug = 'cinestill-50d';

-- cinestill-800t
UPDATE film_stocks SET
  grain = 3,
  contrast = 3,
  saturation = 3,
  latitude = 4,
  shooting_notes = '[
    {"header": "Skin Tones", "dek": "Great under tungsten. In artificial light 800T can make skin look surprisingly natural, though daylight pushes it cooler unless corrected."},
    {"header": "Color Bias", "dek": "Cool with neon. The film is tuned for tungsten, so city lights and mixed night scenes feel cinematic while daylight tends to skew blue."},
    {"header": "Push/Pull", "dek": "Built for low light. It handles pushes to 1600 or even 3200 well if you accept more grain and let the stock lean into its night-film character."},
    {"header": "Shadow Detail", "dek": "Very capable at speed. It protects darker regions better than most high-speed color films, especially when metered for the shadows."},
    {"header": "Highlight Roll-off", "dek": "Dramatic with halation. Bright highlights bloom and glow rather than disappearing cleanly, which is part of the stock''s signature look."}
  ]'::jsonb
WHERE slug = 'cinestill-800t';

-- harman-phoenix-200
UPDATE film_stocks SET
  grain = 5,
  contrast = 4,
  saturation = 4,
  latitude = 3,
  shooting_notes = '[
    {"header": "Skin Tones", "dek": "Warm and unruly. Phoenix 200 tends to push skin toward reds and oranges, so portraits feel lively but not especially neutral."},
    {"header": "Color Bias", "dek": "Bold and fiery. The palette leans heavily into warm reds, yellows, and oranges, with a raw homemade energy rather than polished balance."},
    {"header": "Push/Pull", "dek": "Best slightly over. It responds better to a little extra exposure than to being pushed, which helps calm the shadows and keep the color usable."},
    {"header": "Shadow Detail", "dek": "Needs careful light. Shadows can get rough and noisy quickly, so the film rewards exposing generously instead of trying to rescue darkness later."},
    {"header": "Highlight Roll-off", "dek": "Glowy and loose. Highlights can bloom and flare in a way that feels expressive rather than smooth or technically controlled."}
  ]'::jsonb
WHERE slug = 'harman-phoenix-200';

-- harman-phoenix-ii
UPDATE film_stocks SET
  grain = 4,
  contrast = 4,
  saturation = 4,
  latitude = 3,
  shooting_notes = '[
    {"header": "Skin Tones", "dek": "Warmer but cleaner. Phoenix II still leans warm on skin, but it is better controlled and less chaotic than the original version."},
    {"header": "Color Bias", "dek": "Warm with control. The stock keeps the bold orange-red Phoenix family look, but color separation is improved and easier to scan."},
    {"header": "Push/Pull", "dek": "Still likes extra light. It is happiest around EI 100 to 200, where the improved emulsion keeps its character without roughening the frame too much."},
    {"header": "Shadow Detail", "dek": "Better than before. Shadows remain expressive and textured, but they hold together more reliably than the first Phoenix release."},
    {"header": "Highlight Roll-off", "dek": "Improved but lively. Highlights are better behaved and more scan-friendly, though they still carry a bold halation-prone edge."}
  ]'::jsonb
WHERE slug = 'harman-phoenix-ii';

-- lomography-color-negative-100
UPDATE film_stocks SET
  grain = 1,
  contrast = 3,
  saturation = 4,
  latitude = 3,
  shooting_notes = '[
    {"header": "Skin Tones", "dek": "Warm and lively. Color Negative 100 gives skin a bright upbeat warmth that feels more fun and stylized than strictly neutral."},
    {"header": "Color Bias", "dek": "Vivid with warmth. Reds, greens, and blues all come through with healthy punch, especially in sunlit travel and landscape scenes."},
    {"header": "Push/Pull", "dek": "Prefers slight over. It behaves best when given a little extra light, which smooths the already fine grain and keeps the color rich."},
    {"header": "Shadow Detail", "dek": "Good in daylight. Shadows stay readable, though the film is not as forgiving as cinema-derived stocks when light gets tricky."},
    {"header": "Highlight Roll-off", "dek": "Clean and bright. Highlights stay attractive with sensible exposure, giving the film a cheerful consumer-color finish."}
  ]'::jsonb
WHERE slug = 'lomography-color-negative-100';

-- lomography-color-negative-400
UPDATE film_stocks SET
  grain = 3,
  contrast = 3,
  saturation = 4,
  latitude = 4,
  shooting_notes = '[
    {"header": "Skin Tones", "dek": "Warm and colorful. Skin has a lively consumer-film feel, with more stylization and color than a neutral portrait stock."},
    {"header": "Color Bias", "dek": "Warm with punch. Yellows, reds, and greens all come through energetically, making the film feel bold without turning surreal."},
    {"header": "Push/Pull", "dek": "Likes extra exposure. A stop of overexposure smooths the grain and deepens the color nicely, which is where the stock often looks best."},
    {"header": "Shadow Detail", "dek": "Solid for a 400. It keeps enough low-end information for everyday scenes, especially when it is not underexposed."},
    {"header": "Highlight Roll-off", "dek": "Nicely forgiving. Highlights stay colorful and approachable, helping the film perform well as an all-round consumer stock."}
  ]'::jsonb
WHERE slug = 'lomography-color-negative-400';

-- lomography-color-negative-800
UPDATE film_stocks SET
  grain = 5,
  contrast = 4,
  saturation = 4,
  latitude = 4,
  shooting_notes = '[
    {"header": "Skin Tones", "dek": "Warm and atmospheric. Skin tends to pick up a glowing low-light warmth, with more mood and texture than clean neutrality."},
    {"header": "Color Bias", "dek": "Warm with amber. The palette leans heavily into warm nighttime color, making tungsten and neon scenes feel energetic and cinematic."},
    {"header": "Push/Pull", "dek": "Handles more speed. It can be pushed to 1600 if needed, though the real trick is giving it a touch of extra exposure to tame the grain."},
    {"header": "Shadow Detail", "dek": "Good for 800 speed. It keeps more low-light information than its strong grain might suggest, though shadows still feel rougher than finer stocks."},
    {"header": "Highlight Roll-off", "dek": "Acceptably smooth. Highlights hold together well enough in night scenes, but they do not have the elegant control of the CineStill films."}
  ]'::jsonb
WHERE slug = 'lomography-color-negative-800';

-- orwo-wolfen-nc500
UPDATE film_stocks SET
  grain = 3,
  contrast = 3,
  saturation = 2,
  latitude = 4,
  shooting_notes = '[
    {"header": "Skin Tones", "dek": "Cool and moody. NC500 can make skin look subdued and atmospheric rather than rosy or conventionally flattering."},
    {"header": "Color Bias", "dek": "Muted with coolness. The stock has a desaturated European palette with cooler undertones and a deliberately vintage cast."},
    {"header": "Push/Pull", "dek": "Best exposed generously. It rewards extra light far more than pushing, which helps the film stay open and keeps the palette from getting too muddy."},
    {"header": "Shadow Detail", "dek": "Good with exposure. Shadows hold more information than the muted look suggests, especially when the negative is not starved for light."},
    {"header": "Highlight Roll-off", "dek": "Soft and gentle. Highlights roll off smoothly, reinforcing the film''s nostalgic low-key color signature."}
  ]'::jsonb
WHERE slug = 'orwo-wolfen-nc500';
