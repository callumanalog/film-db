-- Update scale-based specs and effect-oriented Performance notes
-- for remaining experimental color stocks.

-- dubblefilm-monsoon
UPDATE film_stocks SET
  grain = 2,
  contrast = 3,
  saturation = 3,
  latitude = 3,
  shooting_notes = '[
    {"header": "Effect Character", "dek": "Cool atmospheric wash. Monsoon overlays scenes with blue, teal, and cyan tones that create a rainy, aquatic, twilight mood."},
    {"header": "Effect Intensity", "dek": "Moderately stylized. The look is obvious but still readable, so the effect usually supports the image instead of completely overwhelming it."},
    {"header": "Scene Pairing", "dek": "Best with cool scenes. Overcast weather, water, concrete, twilight, and moody travel frames all harmonize naturally with the blue cast."},
    {"header": "Exposure Flexibility", "dek": "Standard but limited. It behaves best around box speed with normal or slightly generous exposure rather than dramatic push processing."},
    {"header": "Highlight Behavior", "dek": "Soft and misty. Bright areas keep the cool overlay and tend to fade out with a damp, hazy atmosphere instead of a hard edge."}
  ]'::jsonb
WHERE slug = 'dubblefilm-monsoon';

-- dubblefilm-sunstroke
UPDATE film_stocks SET
  grain = 2,
  contrast = 3,
  saturation = 4,
  latitude = 3,
  shooting_notes = '[
    {"header": "Effect Character", "dek": "Warm leak glow. Sunstroke adds amber and orange pre-exposed flares that make each frame feel sun-drenched and dreamy."},
    {"header": "Effect Intensity", "dek": "Clearly visible. The effect is strong enough to define the mood, though the base image still reads well when given enough light."},
    {"header": "Scene Pairing", "dek": "Best in daylight. Bright sun, golden-hour portraits, beaches, holidays, and simple travel scenes give the warm leaks space to shine."},
    {"header": "Exposure Flexibility", "dek": "Likes extra light. Slight overexposure helps the warm overlays blend more smoothly, while dark scenes tend to make the stock feel muddy."},
    {"header": "Highlight Behavior", "dek": "Glowy and warm. Highlights bloom into the amber effect rather than separating cleanly, which is part of the film''s nostalgic charm."}
  ]'::jsonb
WHERE slug = 'dubblefilm-sunstroke';

-- harman-red
UPDATE film_stocks SET
  grain = 3,
  contrast = 4,
  saturation = 5,
  latitude = 3,
  shooting_notes = '[
    {"header": "Effect Character", "dek": "Redscale-like heat. Harman Red pushes the whole frame toward bold reds, oranges, and yellows for a cinematic altered-color look."},
    {"header": "Effect Intensity", "dek": "Very assertive. The red bias is not subtle, so the stock quickly becomes the dominant visual voice of the image."},
    {"header": "Scene Pairing", "dek": "Best with warmth. Daylight portraits, sunsets, street scenes, and already-warm subjects tend to turn the heavy red cast into a strength."},
    {"header": "Exposure Flexibility", "dek": "Works best at speed. It is more about embracing the palette than manipulating it heavily, though clean daylight exposure helps the effect stay usable."},
    {"header": "Highlight Behavior", "dek": "Hot and glowing. Bright values often intensify the red-orange look, giving highlights a feverish cinematic burn instead of neutral recovery."}
  ]'::jsonb
WHERE slug = 'harman-red';

-- harman-switch-azure
UPDATE film_stocks SET
  grain = 3,
  contrast = 3,
  saturation = 4,
  latitude = 3,
  shooting_notes = '[
    {"header": "Effect Character", "dek": "Hue-switch surrealism. Switch Azure remaps color relationships into cool azure and alternative tone shifts rather than simply adding a blue cast."},
    {"header": "Effect Intensity", "dek": "Strong but variable. The look can shift noticeably with subject matter and scanning, so each roll feels creatively unstable in a useful way."},
    {"header": "Scene Pairing", "dek": "Best with open color. Landscapes, water, travel scenes, and graphic subjects with clean color separation tend to show the switch effect most clearly."},
    {"header": "Exposure Flexibility", "dek": "Moderate tolerance. Normal daylight exposure works best, while extreme underexposure or heavy pushing tends to reduce the clarity of the color remap."},
    {"header": "Highlight Behavior", "dek": "Clean with tint. Highlights stay comparatively tidy, but they carry the altered azure palette rather than returning to neutral."}
  ]'::jsonb
WHERE slug = 'harman-switch-azure';

-- lomography-lomochrome-metropolis
UPDATE film_stocks SET
  grain = 2,
  contrast = 2,
  saturation = 2,
  latitude = 4,
  shooting_notes = '[
    {"header": "Effect Character", "dek": "Desaturated cinema mood. Metropolis suppresses reds and warmth while steering the frame toward muted greens, teals, and steely urban color."},
    {"header": "Effect Intensity", "dek": "Subtle but decisive. The effect is quieter than redscale or pre-exposed films, but it strongly changes the emotional tone of the image."},
    {"header": "Scene Pairing", "dek": "Best with cities. Concrete, glass, overcast streets, modern architecture, and travel scenes with cool surfaces bring out the film''s dystopian charm."},
    {"header": "Exposure Flexibility", "dek": "Quite flexible. The stock can be shot across a broad effective range, and slight overexposure reveals more nuance without destroying the restrained look."},
    {"header": "Highlight Behavior", "dek": "Compressed and smooth. Highlights stay subdued and controlled, reinforcing the film''s flat cinematic curve instead of flaring brightly."}
  ]'::jsonb
WHERE slug = 'lomography-lomochrome-metropolis';

-- lomography-lomochrome-purple
UPDATE film_stocks SET
  grain = 2,
  contrast = 3,
  saturation = 5,
  latitude = 4,
  shooting_notes = '[
    {"header": "Effect Character", "dek": "False-color transformation. LomoChrome Purple remaps greens to purple, skies toward turquoise, and yellows toward pink for a surreal landscape effect."},
    {"header": "Effect Intensity", "dek": "Highly reactive. The strength of the transformation changes dramatically with subject matter and chosen EI, especially when foliage dominates the frame."},
    {"header": "Scene Pairing", "dek": "Best with vegetation. Parks, forests, gardens, travel landscapes, and any scene rich in green matter give the stock its most dramatic results."},
    {"header": "Exposure Flexibility", "dek": "Rate to taste. Shooting between 100 and 400 meaningfully changes how deep and aggressive the color shift appears."},
    {"header": "Highlight Behavior", "dek": "Bright and vivid. Sunlit areas hold the false-color effect clearly, though strong contrast can make the palette feel harsher and more psychedelic."}
  ]'::jsonb
WHERE slug = 'lomography-lomochrome-purple';

-- revolog-460nm
UPDATE film_stocks SET
  grain = 2,
  contrast = 3,
  saturation = 3,
  latitude = 3,
  shooting_notes = '[
    {"header": "Effect Character", "dek": "Monochromatic blue cast. 460nm washes the frame in a cool wavelength-driven tone that can feel underwater, moonlit, or dreamlike."},
    {"header": "Effect Intensity", "dek": "Consistently present. The blue effect is less chaotic than streak or splash films, but it still defines the emotional temperature of the image."},
    {"header": "Scene Pairing", "dek": "Best with mood. Night scenes, cool portraits, damp streets, and subjects with warm accents create the most compelling color tension."},
    {"header": "Exposure Flexibility", "dek": "Better slightly over. A little extra exposure softens the blue cast into pastel territory, while thin negatives can make it feel colder and harsher."},
    {"header": "Highlight Behavior", "dek": "Pale and misty. Highlights keep the cool cast and tend to fade into airy blues rather than bright neutral whites."}
  ]'::jsonb
WHERE slug = 'revolog-460nm';

-- revolog-kolor
UPDATE film_stocks SET
  grain = 2,
  contrast = 3,
  saturation = 5,
  latitude = 3,
  shooting_notes = '[
    {"header": "Effect Character", "dek": "Painterly color splashes. Kolor overlays frames with random organic patches of bright color that feel more like watercolor than light leaks."},
    {"header": "Effect Intensity", "dek": "Wildly unpredictable. Some frames get gentle accents while others are heavily interrupted by vivid washes, which is central to the stock''s appeal."},
    {"header": "Scene Pairing", "dek": "Best with simplicity. Bold subjects and uncluttered compositions give the random splashes enough room to read as intentional rather than messy."},
    {"header": "Exposure Flexibility", "dek": "Moderate with preference. Box speed or slight overexposure keeps the base image clear enough that the splashes feel layered instead of muddy."},
    {"header": "Highlight Behavior", "dek": "Color-dominant and loose. Bright regions can merge into the painted overlays, making highlights feel expressive rather than technically separate."}
  ]'::jsonb
WHERE slug = 'revolog-kolor';

-- revolog-streak
UPDATE film_stocks SET
  grain = 2,
  contrast = 3,
  saturation = 5,
  latitude = 3,
  shooting_notes = '[
    {"header": "Effect Character", "dek": "Rainbow streak overlays. Streak adds directional prismatic bands across every frame, turning ordinary scenes into something celebratory and graphic."},
    {"header": "Effect Intensity", "dek": "Bold and patterned. The effect is obvious on nearly every frame, but it reads more structured and intentional than the randomness of Kolor."},
    {"header": "Scene Pairing", "dek": "Best with contrast. Darker backgrounds, simple portraits, travel scenes, and graphic subjects help the rainbow bands stay legible and exciting."},
    {"header": "Exposure Flexibility", "dek": "Likes bright exposure. Good light or slight overexposure keeps the underlying frame visible enough for the streaks to enhance rather than obscure it."},
    {"header": "Highlight Behavior", "dek": "Prismatic and bright. Highlights interact with the rainbow bands instead of staying neutral, which makes the upper tonal range part of the special effect."}
  ]'::jsonb
WHERE slug = 'revolog-streak';
