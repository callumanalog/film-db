-- Update format, type, iso, development_process, grain, contrast, saturation, latitude,
-- and shooting_notes (Performance) for the listed Kodak film stocks.
-- Slugs: kodak-portra-400, kodak-portra-800, kodak-portra-160, kodak-ektar-100, kodak-colorplus-200,
-- kodak-ultramax-400, kodak-tmax-400, kodak-tmax-100, kodak-tri-x-400, kodak-tmax-p3200,
-- kodak-ektachrome-e100, kodak-double-x (Eastman Double-X).

-- kodak-portra-400
UPDATE film_stocks SET
  format = ARRAY['35mm','120','4x5','8x10']::film_format[],
  type = 'color_negative',
  iso = 400,
  development_process = 'c41',
  grain = 2,
  contrast = 2,
  saturation = 3,
  latitude = 5,
  shooting_notes = '[
    {"header": "Skin Tones", "dek": "The industry gold standard. It delivers natural, warm, and exceptionally smooth transitions in highlights and shadows, making it the most forgiving stock for portraiture."},
    {"header": "Color Bias", "dek": "Highly neutral with a slight leaning toward warm, golden undertones. It maintains a sophisticated palette that doesn''t oversaturate primary colors."},
    {"header": "Push/Pull", "dek": "Extremely versatile. Handles a +1 or +2 stop push with ease, maintaining manageable grain and professional color shifts."},
    {"header": "Shadow Detail", "dek": "Excellent. Even when underexposed, it retains a surprising amount of information, though shadows may shift slightly green if pushed too far into the dark."},
    {"header": "Highlight Roll-off", "dek": "Superior. It is nearly impossible to blow out highlights; they roll off with a creamy, organic texture even in direct sunlight."}
  ]'::jsonb
WHERE slug = 'kodak-portra-400';

-- kodak-portra-800
UPDATE film_stocks SET
  format = ARRAY['35mm','120']::film_format[],
  type = 'color_negative',
  iso = 800,
  development_process = 'c41',
  grain = 3,
  contrast = 3,
  saturation = 4,
  latitude = 4,
  shooting_notes = '[
    {"header": "Skin Tones", "dek": "Rich and vibrant. It is slightly more saturated than Portra 400, giving skin a healthy, \"pop\" look that works beautifully in low-light environments."},
    {"header": "Color Bias", "dek": "Leans toward a warmer, more vivid palette. It handles artificial lighting better than most daylight-balanced films, keeping colors punchy."},
    {"header": "Push/Pull", "dek": "Remarkable. Many photographers shoot this at 1600 or 3200 (pushing +1 or +2) to achieve a gritty, cinematic aesthetic without losing the \"Portra\" feel."},
    {"header": "Shadow Detail", "dek": "Very good for a high-speed film. It finds detail in the murk where 400-speed films would fail, though grain is more apparent in these regions."},
    {"header": "Highlight Roll-off", "dek": "Soft and graceful, though slightly more prone to clipping than its slower siblings if overexposed significantly."}
  ]'::jsonb
WHERE slug = 'kodak-portra-800';

-- kodak-portra-160
UPDATE film_stocks SET
  format = ARRAY['35mm','120','4x5','8x10']::film_format[],
  type = 'color_negative',
  iso = 160,
  development_process = 'c41',
  grain = 1,
  contrast = 2,
  saturation = 2,
  latitude = 5,
  shooting_notes = '[
    {"header": "Skin Tones", "dek": "Extremely pale and clean. This is the \"clinical\" choice for high-end fashion and studio work where total accuracy is required."},
    {"header": "Color Bias", "dek": "The most neutral in the Portra family. It avoids the heavy warmth of the 400 and 800 versions, offering a very realistic \"true-to-life\" look."},
    {"header": "Push/Pull", "dek": "Not its strength. While it can be pushed, the fine grain is the main selling point; pushing tends to defeat the purpose of selecting this stock."},
    {"header": "Shadow Detail", "dek": "Exceptional. Because of the fine grain, the transition from midtones to deep shadows is incredibly smooth."},
    {"header": "Highlight Roll-off", "dek": "Phenomenal. It handles high-key lighting and bright studio strobes with the most delicate roll-off of any color negative film."}
  ]'::jsonb
WHERE slug = 'kodak-portra-160';

-- kodak-ektar-100
UPDATE film_stocks SET
  format = ARRAY['35mm','120','4x5']::film_format[],
  type = 'color_negative',
  iso = 100,
  development_process = 'c41',
  grain = 1,
  contrast = 4,
  saturation = 5,
  latitude = 3,
  shooting_notes = '[
    {"header": "Skin Tones", "dek": "Can be tricky. Due to high saturation, it can make skin tones appear too red or \"sunburned\" if the lighting isn''t perfectly controlled."},
    {"header": "Color Bias", "dek": "Heavily saturated and vivid. It mimics the look of slide film (Ektachrome) with deep blues, vibrant reds, and electric greens."},
    {"header": "Push/Pull", "dek": "Generally not recommended. It is a high-contrast film by design, and pushing it further creates extremely harsh blacks and neon-like colors."},
    {"header": "Shadow Detail", "dek": "Lower than Portra. It requires precise exposure; shadows can \"block up\" quickly if underexposed by more than a stop."},
    {"header": "Highlight Roll-off", "dek": "Brisk but smooth. It doesn''t have the infinite headroom of Portra, but it maintains a clean transition for landscape photography."}
  ]'::jsonb
WHERE slug = 'kodak-ektar-100';

-- kodak-colorplus-200
UPDATE film_stocks SET
  format = ARRAY['35mm']::film_format[],
  type = 'color_negative',
  iso = 200,
  development_process = 'c41',
  grain = 3,
  contrast = 3,
  saturation = 3,
  latitude = 3,
  shooting_notes = '[
    {"header": "Skin Tones", "dek": "Warm and nostalgic. It has a classic \"family photo\" feel, leaning toward yellow and red tones that feel very 1980s/90s."},
    {"header": "Color Bias", "dek": "Definite yellow/red bias. It is less sophisticated than the professional stocks, often producing a \"warm wash\" over the entire image."},
    {"header": "Push/Pull", "dek": "Poor. Pushing ColorPlus leads to significant grain increase and muddy, brown-shifted shadows. Best shot at box speed or +1/2 over."},
    {"header": "Shadow Detail", "dek": "Moderate to low. It needs plenty of light to avoid becoming grainy and \"mushy\" in the darker regions."},
    {"header": "Highlight Roll-off", "dek": "Good. It retains the classic Kodak ability to handle bright skies without losing all detail."}
  ]'::jsonb
WHERE slug = 'kodak-colorplus-200';

-- kodak-ultramax-400
UPDATE film_stocks SET
  format = ARRAY['35mm']::film_format[],
  type = 'color_negative',
  iso = 400,
  development_process = 'c41',
  grain = 3,
  contrast = 4,
  saturation = 4,
  latitude = 4,
  shooting_notes = '[
    {"header": "Skin Tones", "dek": "Punchy and warm. It is more forgiving than Ektar but more vibrant than Gold 200, making it a great \"all-rounder\" for vacation photos."},
    {"header": "Color Bias", "dek": "Significant lean toward blues and yellows. It produces very saturated primary colors, particularly making skies and water look deep and \"electric.\""},
    {"header": "Push/Pull", "dek": "Surprisingly decent. It can handle a +1 push for low light, though the grain becomes quite pronounced."},
    {"header": "Shadow Detail", "dek": "Respectable. As a 400-speed consumer film, it is designed for point-and-shoots, so it holds up better in the shadows than ColorPlus."},
    {"header": "Highlight Roll-off", "dek": "Strong. It manages bright highlights well, keeping a consumer-friendly \"pop\" without losing detail in the clouds."}
  ]'::jsonb
WHERE slug = 'kodak-ultramax-400';

-- kodak-tmax-400 (T-Max 400)
UPDATE film_stocks SET
  format = ARRAY['35mm','120','4x5']::film_format[],
  type = 'bw_negative',
  iso = 400,
  development_process = 'bw',
  grain = 2,
  contrast = 3,
  saturation = 1,
  latitude = 4,
  shooting_notes = '[
    {"header": "Skin Tones", "dek": "Smooth and modern. Because of its T-Grain technology, skin looks polished and clean with very subtle texture."},
    {"header": "Tonal Range", "dek": "Linear and sophisticated. It provides a very wide range of grays, favoring a \"perfect\" technical look over the grit of traditional films."},
    {"header": "Push/Pull", "dek": "Excellent. It is widely considered one of the best B&W films to push, maintaining sharpness even at ISO 1600."},
    {"header": "Shadow Detail", "dek": "High. It picks up subtle textures in dark areas that traditional films like Tri-X might crush into pure black."},
    {"header": "Highlight Roll-off", "dek": "Controlled. It retains highlight detail exceptionally well, provided development times are accurate."}
  ]'::jsonb
WHERE slug = 'kodak-tmax-400';

-- kodak-tmax-100 (T-Max 100)
UPDATE film_stocks SET
  format = ARRAY['35mm','120','4x5']::film_format[],
  type = 'bw_negative',
  iso = 100,
  development_process = 'bw',
  grain = 1,
  contrast = 3,
  saturation = 1,
  latitude = 3,
  shooting_notes = '[
    {"header": "Skin Tones", "dek": "Porcelain-like. The grain is almost invisible, making skin look incredibly smooth, similar to a digital sensor but with more soul."},
    {"header": "Tonal Range", "dek": "Very precise. It offers a clean, surgical graduation of tones. It is the \"cleanest\" B&W film Kodak produces."},
    {"header": "Push/Pull", "dek": "Average. It is best used at box speed to maximize its extremely fine grain."},
    {"header": "Shadow Detail", "dek": "Very good, but requires precise exposure. It is less \"forgiving\" of underexposure than T-Max 400."},
    {"header": "Highlight Roll-off", "dek": "Sharp. Highlights stay crisp and well-defined, perfect for architectural or landscape work."}
  ]'::jsonb
WHERE slug = 'kodak-tmax-100';

-- kodak-tri-x-400
UPDATE film_stocks SET
  format = ARRAY['35mm','120','4x5']::film_format[],
  type = 'bw_negative',
  iso = 400,
  development_process = 'bw',
  grain = 4,
  contrast = 4,
  saturation = 1,
  latitude = 5,
  shooting_notes = '[
    {"header": "Skin Tones", "dek": "Gritty and characterful. It emphasizes texture and lines, making it the favorite for documentary and \"street\" style portraiture."},
    {"header": "Tonal Range", "dek": "Dramatic. Known for its \"soot and chalk\" look, it provides deep blacks and brilliant whites with a punchy midsection."},
    {"header": "Push/Pull", "dek": "Legendary. It can be pushed to 3200 or even 6400, resulting in massive grain and high-contrast, iconic imagery."},
    {"header": "Shadow Detail", "dek": "Good, but it is famous for \"crushing\" shadows into a rich, deep black which adds to its moody aesthetic."},
    {"header": "Highlight Roll-off", "dek": "Forgiving. It has a massive latitude that allows it to survive extreme overexposure while keeping detail in the brightest areas."}
  ]'::jsonb
WHERE slug = 'kodak-tri-x-400';

-- kodak-tmax-p3200 (T-Max P3200)
UPDATE film_stocks SET
  format = ARRAY['35mm']::film_format[],
  type = 'bw_negative',
  iso = 3200,
  development_process = 'bw',
  grain = 5,
  contrast = 4,
  saturation = 1,
  latitude = 3,
  shooting_notes = '[
    {"header": "Skin Tones", "dek": "Very grainy. Skin will have a visible \"salt and pepper\" texture, which is great for moody, atmospheric low-light shots."},
    {"header": "Tonal Range", "dek": "Compressed. Because of the high speed, the range of grays is smaller, focusing more on high contrast and shadow separation."},
    {"header": "Push/Pull", "dek": "Native \"Push\" film. It is designed to be shot at 3200 but is actually an 800-speed film being pushed. It can be \"pushed\" further to 6400 for extreme darkness."},
    {"header": "Shadow Detail", "dek": "Low. In high-ISO situations, shadows are often sacrificed for midtone visibility."},
    {"header": "Highlight Roll-off", "dek": "Gritty. Highlights can become very dense and \"bloomed,\" adding to the low-light aesthetic."}
  ]'::jsonb
WHERE slug = 'kodak-tmax-p3200';

-- kodak-ektachrome-e100
UPDATE film_stocks SET
  format = ARRAY['35mm','120','4x5']::film_format[],
  type = 'color_reversal',
  iso = 100,
  development_process = 'e6',
  grain = 1,
  contrast = 5,
  saturation = 5,
  latitude = 1,
  shooting_notes = '[
    {"header": "Skin Tones", "dek": "Realistic but unforgiving. It captures skin exactly as it looks, but any exposure error will make skin look either way too dark or completely blown out."},
    {"header": "Color Bias", "dek": "Distinctly cool and blue. Unlike the warm Portra stocks, Ektachrome is famous for its \"clean\" whites and deep, true blues."},
    {"header": "Push/Pull", "dek": "Very limited. Slide film does not handle pushing/pulling well; it''s best to stick strictly to box speed."},
    {"header": "Shadow Detail", "dek": "Very poor. Shadows will fall to pure black almost instantly if underexposed by even half a stop."},
    {"header": "Highlight Roll-off", "dek": "Harsh. Unlike negative film, once the highlights are gone on Ektachrome, they are gone forever. It requires 100% accurate exposure."}
  ]'::jsonb
WHERE slug = 'kodak-ektachrome-e100';

-- kodak-double-x (Eastman Double-X)
UPDATE film_stocks SET
  format = ARRAY['35mm','120']::film_format[],
  type = 'bw_negative',
  iso = 250,
  development_process = 'bw',
  grain = 4,
  contrast = 4,
  saturation = 1,
  latitude = 4,
  shooting_notes = '[
    {"header": "Skin Tones", "dek": "Classic Hollywood. It provides a silver-screen look to skin with beautiful glow and distinct texture."},
    {"header": "Tonal Range", "dek": "Cinematic and moody. It has a unique \"glow\" in the midtones (halations) and a rich, deep black that feels very high-budget."},
    {"header": "Push/Pull", "dek": "Good. Pushing to 800 or 1600 brings out a heavy, beautiful grain that looks like 1960s noir cinema."},
    {"header": "Shadow Detail", "dek": "Moderate. It favors contrast over shadow recovery, giving it a punchy, \"graphic\" look."},
    {"header": "Highlight Roll-off", "dek": "Velvety. It handles highlights with a subtle \"bloom\" that is characteristic of motion picture stocks without an anti-halation backing."}
  ]'::jsonb
WHERE slug = 'kodak-double-x';
