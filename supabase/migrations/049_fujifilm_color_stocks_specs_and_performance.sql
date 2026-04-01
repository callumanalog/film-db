-- Update scale-based specs and Performance notes for all Fujifilm color stocks.
-- Scope: fujifilm-400, fujifilm-c200, fujifilm-natura-1600, fujifilm-pro-400h,
-- fujifilm-provia-100f, fujifilm-superia-premium-400, fujifilm-superia-400,
-- fujifilm-velvia-100, fujifilm-velvia-50.

-- fujifilm-400
UPDATE film_stocks SET
  grain = 3,
  contrast = 3,
  saturation = 3,
  latitude = 4,
  shooting_notes = '[
    {"header": "Skin Tones", "dek": "Natural and clean. Skin stays fairly neutral for a consumer stock, with enough warmth to feel healthy without the pink-magenta cast common in older Fuji emulsions."},
    {"header": "Color Bias", "dek": "Balanced and restrained. Blues stay crisp and greens read clean, but the overall palette is more muted and matter-of-fact than classic Superia."},
    {"header": "Push/Pull", "dek": "Decent flexibility. It handles a one-stop push better than slower consumer films, though grain and contrast rise quickly and the palette gets less nuanced."},
    {"header": "Shadow Detail", "dek": "Solid retention. For a budget 400-speed negative, it holds onto useful low-end detail when metered normally, but deep underexposure still turns shadows muddy."},
    {"header": "Highlight Roll-off", "dek": "Smooth enough. Highlights stay controlled in bright daylight and scan easily, with more forgiveness than slide film but less cushion than pro portrait negatives."}
  ]'::jsonb
WHERE slug = 'fujifilm-400';

-- fujifilm-c200
UPDATE film_stocks SET
  grain = 2,
  contrast = 2,
  saturation = 2,
  latitude = 4,
  shooting_notes = '[
    {"header": "Skin Tones", "dek": "Soft and gentle. Skin usually renders with a relaxed, slightly cool look that feels flattering in daylight rather than overtly rosy or golden."},
    {"header": "Color Bias", "dek": "Cool and pastel. C200 leans toward lighter greens and softer reds, producing a quieter palette than most Kodak consumer films."},
    {"header": "Push/Pull", "dek": "Best at box. It is happiest at rated speed or with slight overexposure; pushing tends to flatten color and leave the frame washed out."},
    {"header": "Shadow Detail", "dek": "Fairly open. It keeps more shadow information than its low contrast suggests, but once light drops off the image can lose separation and feel thin."},
    {"header": "Highlight Roll-off", "dek": "Pleasantly soft. Bright areas fade out gently when exposed with care, which helps the film keep its airy, everyday snapshot character."}
  ]'::jsonb
WHERE slug = 'fujifilm-c200';

-- fujifilm-natura-1600
UPDATE film_stocks SET
  grain = 3,
  contrast = 2,
  saturation = 3,
  latitude = 4,
  shooting_notes = '[
    {"header": "Skin Tones", "dek": "Warm and intimate. Skin holds together unusually well under practical light, preserving a believable ambient glow instead of turning sickly under mixed lighting."},
    {"header": "Color Bias", "dek": "Natural with warmth. The palette stays lifelike for such a fast film, with only a gentle warm shift that flatters nighttime interiors and city light."},
    {"header": "Push/Pull", "dek": "Surprisingly capable. Natura tolerates being pushed to 3200 better than most color negative stocks, although grain and density still build noticeably."},
    {"header": "Shadow Detail", "dek": "Impressively strong. It resolves low-light scenes with more usable information than its speed suggests, especially when given a little extra exposure."},
    {"header": "Highlight Roll-off", "dek": "Well controlled. Bright signs, lamps, and window light stay smoother than you would expect from a 1600-speed emulsion if exposure is not too aggressive."}
  ]'::jsonb
WHERE slug = 'fujifilm-natura-1600';

-- fujifilm-pro-400h
UPDATE film_stocks SET
  grain = 2,
  contrast = 2,
  saturation = 2,
  latitude = 5,
  shooting_notes = '[
    {"header": "Skin Tones", "dek": "Creamy and flattering. Pro 400H is prized for soft portrait rendering, giving skin a polished look with smooth transitions and very little harshness."},
    {"header": "Color Bias", "dek": "Cool with green. Its signature look comes from neutral mids and slightly greenish shadows, which make the palette feel airy rather than golden."},
    {"header": "Push/Pull", "dek": "Good overexposed. The film shines when rated a stop or two slower, while a one-stop push is serviceable but loses some of its trademark softness."},
    {"header": "Shadow Detail", "dek": "Excellent retention. Even in open shade or backlit scenes it keeps delicate tonal separation, which is part of why wedding photographers loved it."},
    {"header": "Highlight Roll-off", "dek": "Exceptionally smooth. Bright dresses, skies, and windows compress gently instead of clipping abruptly, giving the stock its forgiving professional feel."}
  ]'::jsonb
WHERE slug = 'fujifilm-pro-400h';

-- fujifilm-provia-100f
UPDATE film_stocks SET
  grain = 1,
  contrast = 4,
  saturation = 4,
  latitude = 2,
  shooting_notes = '[
    {"header": "Skin Tones", "dek": "Clean but exacting. Skin can look very natural on Provia, but because it is slide film the exposure has to be right or faces turn dull or overly bright fast."},
    {"header": "Color Bias", "dek": "Neutral with snap. Compared with Velvia it is more balanced and cooler-headed, favoring faithful color over exaggerated warmth or hyper-saturation."},
    {"header": "Push/Pull", "dek": "Usably pushable. Provia handles a one-stop push better than most E-6 films and can stretch further in a pinch, though contrast climbs and tolerance shrinks."},
    {"header": "Shadow Detail", "dek": "Moderately limited. It holds dark tones better than Velvia, but underexposure still causes shadows to close quickly in high-contrast scenes."},
    {"header": "Highlight Roll-off", "dek": "Tight but manageable. Highlights need careful metering, yet they behave more gracefully than Velvia when the scene has bright clouds or reflective surfaces."}
  ]'::jsonb
WHERE slug = 'fujifilm-provia-100f';

-- fujifilm-superia-premium-400
UPDATE film_stocks SET
  grain = 2,
  contrast = 3,
  saturation = 4,
  latitude = 4,
  shooting_notes = '[
    {"header": "Skin Tones", "dek": "Lively and rosy. Portraits come out brighter and prettier than standard Superia, though the magenta lean can make some complexions look extra pink."},
    {"header": "Color Bias", "dek": "Warm with magenta. It keeps Fuji''s crisp greens and blues but adds a sunnier, slightly more polished cast than X-TRA 400."},
    {"header": "Push/Pull", "dek": "Best overexposed. A little extra light smooths the grain and keeps the color rich, while underexposure quickly brings muddier shadows and less attractive casts."},
    {"header": "Shadow Detail", "dek": "Good in practice. It hangs onto low-end detail well for a consumer 400 stock, but shadows can shift greenish if the negative is starved for light."},
    {"header": "Highlight Roll-off", "dek": "Nicely forgiving. Bright highlights stay colorful and recover well in scans, which helps the film look premium despite its consumer roots."}
  ]'::jsonb
WHERE slug = 'fujifilm-superia-premium-400';

-- fujifilm-superia-400
UPDATE film_stocks SET
  grain = 3,
  contrast = 4,
  saturation = 4,
  latitude = 4,
  shooting_notes = '[
    {"header": "Skin Tones", "dek": "Punchy but tricky. Skin often comes out lively and smooth, though the stock can push reds and magentas harder than portrait-focused emulsions."},
    {"header": "Color Bias", "dek": "Cool and vivid. The classic Superia look favors greens, blues, and crisp contrast, with less of the amber warmth associated with Kodak stocks."},
    {"header": "Push/Pull", "dek": "Accepts a stop. It tolerates a modest push for low light, but grain becomes more obvious and the cool bias can get stronger."},
    {"header": "Shadow Detail", "dek": "Generally solid. There is enough latitude to keep shadow information in everyday scenes, although deep shade can pick up a greenish cast."},
    {"header": "Highlight Roll-off", "dek": "Strong for consumer film. Bright skies and reflective surfaces stay under control if exposure is sensible, preserving the stock''s crisp travel-film look."}
  ]'::jsonb
WHERE slug = 'fujifilm-superia-400';

-- fujifilm-velvia-100
UPDATE film_stocks SET
  grain = 1,
  contrast = 5,
  saturation = 5,
  latitude = 1,
  shooting_notes = '[
    {"header": "Skin Tones", "dek": "Bold but unforgiving. Skin tends toward warm orange-red and quickly looks unnatural unless the light is carefully chosen and exposure is nailed."},
    {"header": "Color Bias", "dek": "Rich and intense. Velvia 100 pushes greens, blues, and warm hues toward maximum drama, delivering a polished slide look with deep blacks."},
    {"header": "Push/Pull", "dek": "Limited tolerance. It can handle small E-6 adjustments or a controlled push, but every step away from box speed increases contrast and risk."},
    {"header": "Shadow Detail", "dek": "Very compressed. Dark areas drop off quickly, so underexposure turns subtle detail into dense blocks sooner than negative film would."},
    {"header": "Highlight Roll-off", "dek": "Abrupt and critical. Once highlights are gone they are gone, so bright clouds and specular light demand very disciplined metering."}
  ]'::jsonb
WHERE slug = 'fujifilm-velvia-100';

-- fujifilm-velvia-50
UPDATE film_stocks SET
  grain = 1,
  contrast = 5,
  saturation = 5,
  latitude = 1,
  shooting_notes = '[
    {"header": "Skin Tones", "dek": "Not very forgiving. Velvia 50 can make skin look overly red or stylized, which is why it is rarely the first choice for portraits."},
    {"header": "Color Bias", "dek": "Hyper-saturated and vivid. Greens, reds, and blues all intensify dramatically, giving landscapes the iconic Velvia glow."},
    {"header": "Push/Pull", "dek": "Best at box. Like most slide films it rewards exact exposure far more than processing tricks, and pushing only narrows tolerance further."},
    {"header": "Shadow Detail", "dek": "Minimal latitude. Shadows close rapidly with even slight underexposure, especially in contrasty daylight or dense foliage."},
    {"header": "Highlight Roll-off", "dek": "Harsh but precise. Highlights clip quickly, so success comes from exposing with extreme care rather than relying on recovery later."}
  ]'::jsonb
WHERE slug = 'fujifilm-velvia-50';
