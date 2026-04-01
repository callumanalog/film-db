-- Update scale-based specs and Performance notes for all black-and-white film stocks.
-- B&W rules for this migration:
--   - saturation = NULL
--   - shooting_notes contains exactly 4 items:
--     Tonal Range, Push/Pull, Shadow Detail, Highlight Roll-off

UPDATE film_stocks AS f
SET
  grain = v.grain,
  contrast = v.contrast,
  latitude = v.latitude,
  saturation = NULL,
  shooting_notes = v.shooting_notes
FROM (
  VALUES
    (
      'adox-chs-100-ii',
      2,
      3,
      3,
      '[
        {"header":"Tonal Range","dek":"Classic and rounded. CHS 100 II leans into a vintage cubic-grain look with rich midtones and a softer tonal curve than modern technical films."},
        {"header":"Push/Pull","dek":"Prefers gentle exposure. It rewards box speed or slight overexposure far more than aggressive pushing, which can make the image harder and less elegant."},
        {"header":"Shadow Detail","dek":"Nicely preserved. Given enough exposure it holds low-end detail with a warm, old-school softness rather than clinical separation."},
        {"header":"Highlight Roll-off","dek":"Smooth and gentle. Bright values taper off gracefully, which helps the stock keep its classic portrait and landscape character."}
      ]'::jsonb
    ),
    (
      'adox-cms-20-ii',
      1,
      4,
      1,
      '[
        {"header":"Tonal Range","dek":"Technical and narrow. CMS 20 II is capable of stunning resolution, but its tonal scale stays tight unless exposure and developer choice are controlled very carefully."},
        {"header":"Push/Pull","dek":"Very unforgiving. This is a precision film that wants exact metering and specialized development rather than creative pushing or casual rating changes."},
        {"header":"Shadow Detail","dek":"Fragile at speed. Shadows disappear quickly when exposure drifts, so deep tones need disciplined metering to stay readable."},
        {"header":"Highlight Roll-off","dek":"Abrupt and critical. Highlights can clip or turn harsh in a hurry, especially outside a compensating developer workflow."}
      ]'::jsonb
    ),
    (
      'adox-hr-50',
      1,
      3,
      3,
      '[
        {"header":"Tonal Range","dek":"Clean and precise. HR-50 delivers a modern high-resolution look with balanced contrast and sharper separation than more nostalgic emulsions."},
        {"header":"Push/Pull","dek":"Best near box. It responds well to careful exposure or a mild pull, while hard pushes tend to work against the film''s refined strengths."},
        {"header":"Shadow Detail","dek":"Respectably open. It keeps dark tones usable when exposure is accurate, though it is not as forgiving as a true wide-latitude stock."},
        {"header":"Highlight Roll-off","dek":"Even and tidy. Highlights stay controlled and crisp instead of blooming, which suits the film''s technical personality."}
      ]'::jsonb
    ),
    (
      'adox-silvermax-100',
      1,
      3,
      5,
      '[
        {"header":"Tonal Range","dek":"Long and luminous. Silvermax 100 is built around extended tonal scale, with deep blacks, bright mids, and unusually rich separation across the frame."},
        {"header":"Push/Pull","dek":"Favors careful exposure. It is strongest at box speed or slightly over, where the film can show its dynamic range instead of chasing extra speed."},
        {"header":"Shadow Detail","dek":"Exceptionally strong. Low values hold together with impressive depth, making the stock feel more open than most 100-speed films."},
        {"header":"Highlight Roll-off","dek":"Graceful and rich. Highlights fade out with a polished, luminous finish that is one of the film''s defining traits."}
      ]'::jsonb
    ),
    (
      'agfa-apx-100',
      1,
      3,
      3,
      '[
        {"header":"Tonal Range","dek":"Balanced and classic. APX 100 gives a neutral traditional scale with crisp detail and enough midtone richness to feel timeless rather than sterile."},
        {"header":"Push/Pull","dek":"Best at box. It likes accurate metering or slight overexposure more than aggressive pushes, which can harden the image without much benefit."},
        {"header":"Shadow Detail","dek":"Solid and natural. Shadows stay readable when exposure is sensible, though they do not have the huge cushion of more flexible emulsions."},
        {"header":"Highlight Roll-off","dek":"Clean and measured. Bright tones stay orderly and pleasant, with a classic straight print look instead of dramatic bloom."}
      ]'::jsonb
    ),
    (
      'agfa-apx-400',
      3,
      4,
      4,
      '[
        {"header":"Tonal Range","dek":"Punchy but useful. APX 400 has more bite than its 100-speed sibling, trading some refinement for stronger separation and a more energetic overall curve."},
        {"header":"Push/Pull","dek":"Quite flexible. It handles being pushed to 800 with confidence, while slight overexposure smooths the stock and opens darker tones."},
        {"header":"Shadow Detail","dek":"Good in practice. It keeps enough low-end information for everyday work, though deep shade can turn gritty if exposure gets thin."},
        {"header":"Highlight Roll-off","dek":"Firm but forgiving. Highlights stay bright and controlled, with enough tolerance for street and documentary use."}
      ]'::jsonb
    ),
    (
      'bergger-pancro-400',
      2,
      3,
      5,
      '[
        {"header":"Tonal Range","dek":"Expansive and creamy. Pancro 400 is known for long grayscale separation, luminous mids, and a polished tonal curve that feels richer than most 400-speed films."},
        {"header":"Push/Pull","dek":"Likes extra light. It rewards box speed or slight overexposure best, while pushing is possible but not really the heart of the film."},
        {"header":"Shadow Detail","dek":"Outstanding depth. Shadows stay full and textured, which is a major part of the stock''s premium look."},
        {"header":"Highlight Roll-off","dek":"Exceptionally soft. Highlights compress with a graceful, almost medium-format feel that makes the film especially attractive in bright scenes."}
      ]'::jsonb
    ),
    (
      'cinestill-bwxx',
      3,
      2,
      4,
      '[
        {"header":"Tonal Range","dek":"Cinematic and broad. BwXX has rich midtones, deep blacks, and a motion-picture scale that feels smoother than its gritty reputation suggests."},
        {"header":"Push/Pull","dek":"Pushes very well. It can move to 400 or 800 without losing its character, making it one of the more flexible creative stocks in the catalog."},
        {"header":"Shadow Detail","dek":"Strong and moody. It keeps useful information in darker regions while still delivering the dramatic atmosphere people want from the emulsion."},
        {"header":"Highlight Roll-off","dek":"Smooth with bloom. Highlights stay gentle and slightly glowing rather than clipping with a harsh still-photo edge."}
      ]'::jsonb
    ),
    (
      'ferrania-p30-alpha',
      2,
      4,
      3,
      '[
        {"header":"Tonal Range","dek":"Rich and cinematic. P30 Alpha produces dense blacks, glowing mids, and a silver-rich scale that feels dramatic without becoming crude."},
        {"header":"Push/Pull","dek":"Better near box. It thrives on careful exposure or slight overexposure, while hard pushes make the film denser and less nuanced."},
        {"header":"Shadow Detail","dek":"Moderate but attractive. Dark tones can bunch up if exposure is tight, though the result still feels elegant rather than broken."},
        {"header":"Highlight Roll-off","dek":"Smooth and polished. Highlights hold a refined glow that helps the stock keep its classic Italian cinema look."}
      ]'::jsonb
    ),
    (
      'washi-a',
      3,
      2,
      1,
      '[
        {"header":"Tonal Range","dek":"Textural and handmade. Washi A is more about surface character and mood than wide grayscale precision, giving images a soft artisanal feel."},
        {"header":"Push/Pull","dek":"Very limited. This stock wants gentle metering and respect for its quirks rather than major push or pull experiments."},
        {"header":"Shadow Detail","dek":"Delicate and sparse. Shadows can disappear quickly, so darker parts of the frame need generous exposure to survive."},
        {"header":"Highlight Roll-off","dek":"Soft and diffused. Bright areas taper away more gently than the narrow latitude might suggest, adding to the paper-like atmosphere."}
      ]'::jsonb
    ),
    (
      'washi-s',
      1,
      5,
      1,
      '[
        {"header":"Tonal Range","dek":"Graphic and stark. Washi S behaves like a repurposed sound-recording film, with extreme separation and very little gray comfort in the middle."},
        {"header":"Push/Pull","dek":"Needs restraint. It responds far better to careful exposure and compensating development than to any attempt to chase more speed."},
        {"header":"Shadow Detail","dek":"Very easily lost. Shadows collapse quickly unless the scene and development are kept under strict control."},
        {"header":"Highlight Roll-off","dek":"Hard and abrupt. Highlights clip fast, which is part of the stock''s severe specialty look."}
      ]'::jsonb
    ),
    (
      'fomapan-100-classic',
      3,
      3,
      3,
      '[
        {"header":"Tonal Range","dek":"Traditional and textured. Fomapan 100 has a classic cubic-grain look with pleasant mids and a slightly vintage feel rather than ultra-modern smoothness."},
        {"header":"Push/Pull","dek":"Works best gently. It responds nicely to box speed or a mild pull, while big pushes tend to trade away the film''s charm for roughness."},
        {"header":"Shadow Detail","dek":"Decent with care. Given enough exposure it keeps low values readable, though it does not hide underexposure gracefully."},
        {"header":"Highlight Roll-off","dek":"Straight and classic. Highlights stay attractive when exposed carefully, with a printed darkroom feel rather than a long digital-like shoulder."}
      ]'::jsonb
    ),
    (
      'fomapan-200-creative',
      3,
      3,
      4,
      '[
        {"header":"Tonal Range","dek":"Open and versatile. Fomapan 200 offers smoother gradation than the faster Foma stocks, making it a good middle ground between character and flexibility."},
        {"header":"Push/Pull","dek":"Quite adaptable. It tolerates rating changes and development shifts better than most traditional budget films, especially around its box-speed sweet spot."},
        {"header":"Shadow Detail","dek":"Good and usable. Shadows retain enough separation for everyday scenes, especially when the film is not starved for exposure."},
        {"header":"Highlight Roll-off","dek":"Gentle for Foma. Highlights hold together better than the punchier Foma emulsions, which helps the stock feel more forgiving overall."}
      ]'::jsonb
    ),
    (
      'fomapan-400-action',
      5,
      5,
      4,
      '[
        {"header":"Tonal Range","dek":"Gritty and bold. Fomapan 400 leans into chunky grain and punchy separation, giving images a rough documentary energy rather than refined subtlety."},
        {"header":"Push/Pull","dek":"Pushes with grit. It can be driven to higher speeds, but the payoff is more texture and contrast rather than smooth professional polish."},
        {"header":"Shadow Detail","dek":"Best with exposure. Shadows need a little generosity to stay open, because underexposure turns the film hard and murky quickly."},
        {"header":"Highlight Roll-off","dek":"Surprisingly tolerant. Highlights often survive better than the shadows, especially when the stock is rated a little slower than box."}
      ]'::jsonb
    ),
    (
      'fomapan-r-100',
      1,
      5,
      1,
      '[
        {"header":"Tonal Range","dek":"Bright and compressed. As a black-and-white reversal stock, Fomapan R 100 has a much tighter tonal envelope than typical negative films."},
        {"header":"Push/Pull","dek":"Little room. It rewards strict exposure and careful processing, with very little forgiveness for creative speed changes."},
        {"header":"Shadow Detail","dek":"Minimal tolerance. Dark values disappear quickly if the film is even slightly underexposed."},
        {"header":"Highlight Roll-off","dek":"Harsh and exacting. Highlights clip fast, so metering precision matters far more than recovery after the fact."}
      ]'::jsonb
    ),
    (
      'retropan-320-soft',
      1,
      1,
      4,
      '[
        {"header":"Tonal Range","dek":"Soft and compressed. Retropan 320 Soft is built for glow, haze, and lowered contrast rather than biting micro-contrast or hard separation."},
        {"header":"Push/Pull","dek":"Not a speed film. It is happiest when exposed for its intended look, since pushing works against the softness that makes it special."},
        {"header":"Shadow Detail","dek":"Open and forgiving. The low-contrast curve keeps darker tones surprisingly present, especially in portrait and atmospheric scenes."},
        {"header":"Highlight Roll-off","dek":"Very gentle. Highlights fade out with a dreamy softness that is central to the film''s identity."}
      ]'::jsonb
    ),
    (
      'fujifilm-acros-ii',
      1,
      3,
      3,
      '[
        {"header":"Tonal Range","dek":"Smooth and elegant. Acros II is prized for extremely fine grain and refined tonal transitions that feel polished without looking sterile."},
        {"header":"Push/Pull","dek":"Best at box. It is more of a precision film than a push monster, rewarding accurate exposure and excellent long-exposure behavior."},
        {"header":"Shadow Detail","dek":"Richly nuanced. Shadows stay detailed and calm when the film is exposed properly, with very little grain intrusion."},
        {"header":"Highlight Roll-off","dek":"Graceful and clean. Highlights hold a beautiful smoothness that suits architecture, night work, and careful landscape photography."}
      ]'::jsonb
    ),
    (
      'ilford-delta-100',
      1,
      3,
      3,
      '[
        {"header":"Tonal Range","dek":"Refined and modern. Delta 100 offers a clean tabular-grain scale with excellent separation and a disciplined, polished look."},
        {"header":"Push/Pull","dek":"Prefers precision. It is strongest at box speed or with slight overexposure, while heavy pushes are possible but not the film''s real strength."},
        {"header":"Shadow Detail","dek":"Strong and controlled. Deep values stay detailed when metering is accurate, making the stock excellent for careful landscape and studio work."},
        {"header":"Highlight Roll-off","dek":"Smooth and tidy. Highlights stay bright and elegant without blowing out into chalky harshness too quickly."}
      ]'::jsonb
    ),
    (
      'ilford-delta-3200',
      5,
      5,
      3,
      '[
        {"header":"Tonal Range","dek":"Compressed and atmospheric. Delta 3200 is built for low light and mood, with heavy texture and bold separation rather than delicate grayscale subtlety."},
        {"header":"Push/Pull","dek":"Built for speed. It can be rated across a useful range, but every move upward trades smooth tonality for grit and urgency."},
        {"header":"Shadow Detail","dek":"Better than expected. Given enough exposure it keeps more low-end information than many night films, though true darkness still gets rough fast."},
        {"header":"Highlight Roll-off","dek":"Bright and gritty. Highlights stay expressive but can look dense and glowing rather than creamy or restrained."}
      ]'::jsonb
    ),
    (
      'ilford-delta-400',
      2,
      3,
      4,
      '[
        {"header":"Tonal Range","dek":"Balanced and polished. Delta 400 has a cleaner, more modern look than HP5, with smooth transitions and refined gray separation."},
        {"header":"Push/Pull","dek":"Pushes confidently. It handles 800 and 1600 well, keeping more order and sharpness than many classic-grain 400-speed films."},
        {"header":"Shadow Detail","dek":"Strong when fed light. It rewards sensible exposure with very good shadow separation, though it is a little less forgiving than HP5."},
        {"header":"Highlight Roll-off","dek":"Controlled and modern. Highlights stay neat and even, giving the stock a polished all-purpose feel."}
      ]'::jsonb
    ),
    (
      'ilford-fp4-plus',
      1,
      3,
      4,
      '[
        {"header":"Tonal Range","dek":"Open and classic. FP4 Plus has a broad grayscale with fine grain and enough snap to feel crisp without losing subtle midtone work."},
        {"header":"Push/Pull","dek":"Likes careful exposure. It shines at box speed or slightly over, while big pushes are less compelling than simply using the film well."},
        {"header":"Shadow Detail","dek":"Consistently strong. It resolves dark areas with confidence, especially in landscapes and controlled light."},
        {"header":"Highlight Roll-off","dek":"Gentle and dependable. Bright tones ease off smoothly, helping prints and scans hold their shape in sunny scenes."}
      ]'::jsonb
    ),
    (
      'ilford-hp5-plus',
      3,
      3,
      5,
      '[
        {"header":"Tonal Range","dek":"Flexible and classic. HP5 Plus balances grain, contrast, and tonal openness in a way that makes it one of the easiest black-and-white films to live with."},
        {"header":"Push/Pull","dek":"Legendary flexibility. It takes pushes to 800, 1600, and beyond with real confidence, while still looking good when exposed generously at box speed."},
        {"header":"Shadow Detail","dek":"Very forgiving. Shadows stay more open than many gritty 400-speed films, especially when the negative gets a little extra exposure."},
        {"header":"Highlight Roll-off","dek":"Soft and tolerant. Highlights hold together gracefully, which is part of why the film works in almost any lighting condition."}
      ]'::jsonb
    ),
    (
      'ilford-ortho-plus',
      1,
      3,
      3,
      '[
        {"header":"Tonal Range","dek":"Distinctive and cool. Ortho Plus gives a clean fine-grain scale, but the orthochromatic response changes tonal relationships in ways that feel unusual and graphic."},
        {"header":"Push/Pull","dek":"Not highly flexible. It benefits more from careful metering and understanding its spectral response than from pushing for extra speed."},
        {"header":"Shadow Detail","dek":"Scene dependent. Shadows can look excellent, but red subjects and dark fabrics may sink unexpectedly because of the film''s color response."},
        {"header":"Highlight Roll-off","dek":"Crisp and clear. Highlights stay controlled, though the stock does not smooth tonal surprises caused by ortho sensitivity."}
      ]'::jsonb
    ),
    (
      'ilford-pan-f-plus',
      1,
      3,
      3,
      '[
        {"header":"Tonal Range","dek":"Silvery and precise. Pan F Plus has almost invisible grain and a luminous low-speed tonality that feels elegant in bright controlled light."},
        {"header":"Push/Pull","dek":"Needs accuracy. It is far better used carefully at speed than asked to stretch, especially once long exposures enter the picture."},
        {"header":"Shadow Detail","dek":"Good when nailed. Shadows can be beautiful and detailed, but only if the exposure is right because the film does not forgive laziness."},
        {"header":"Highlight Roll-off","dek":"Elegant and bright. Highlights stay attractive and crisp, helping the stock produce that classic fine-grain sparkle."}
      ]'::jsonb
    ),
    (
      'ilford-sfx-200',
      3,
      5,
      3,
      '[
        {"header":"Tonal Range","dek":"Stylized and dramatic. SFX 200 can look fairly normal without filters, but with deep red filtration it turns far punchier and more surreal."},
        {"header":"Push/Pull","dek":"Filter aware. Exposure changes matter less than proper compensation for the chosen filter, since that is what really shapes the final look."},
        {"header":"Shadow Detail","dek":"Can get sparse. Once the film is used for near-infrared style effects, shadows often thin out and become more graphic than descriptive."},
        {"header":"Highlight Roll-off","dek":"Bright with glow. Highlights can take on a luminous surreal edge, especially in foliage and high-contrast outdoor scenes."}
      ]'::jsonb
    ),
    (
      'ilford-xp2-super',
      1,
      3,
      5,
      '[
        {"header":"Tonal Range","dek":"Smooth and flexible. XP2 Super has a chromogenic look with very gentle grain and a broad tonal scale that scans and prints with ease."},
        {"header":"Push/Pull","dek":"Exceptionally tolerant. It can be rated across a wide practical range and still processed normally in C-41, which makes it unusually easy to expose."},
        {"header":"Shadow Detail","dek":"Very open. Dark areas hold together impressively well, especially compared with silver-rich films of similar speed."},
        {"header":"Highlight Roll-off","dek":"Soft and forgiving. Highlights compress gracefully, giving the film one of the friendliest shoulders in the catalog."}
      ]'::jsonb
    ),
    (
      'jch-streetpan-400',
      3,
      5,
      3,
      '[
        {"header":"Tonal Range","dek":"Graphic and punchy. StreetPan 400 leans toward deep blacks, bright highlights, and a hard-edged street aesthetic rather than delicate tonality."},
        {"header":"Push/Pull","dek":"Pushes with style. It handles extra speed well enough for the look people want, though the tradeoff is even stronger contrast and denser shadows."},
        {"header":"Shadow Detail","dek":"Intentionally limited. Dark regions are part of the film''s drama, so they can close up quickly if you do not expose generously."},
        {"header":"Highlight Roll-off","dek":"Snappy and abrupt. Highlights hit hard, which helps the emulsion deliver its surveillance-inspired graphic signature."}
      ]'::jsonb
    ),
    (
      'kentmere-pan-100',
      2,
      3,
      3,
      '[
        {"header":"Tonal Range","dek":"Straight and useful. Kentmere 100 offers an honest classic grayscale with enough smoothness for everyday work without trying to feel luxurious."},
        {"header":"Push/Pull","dek":"Best at speed. It does not beg for big rating changes, but careful exposure and a small pull can make it look especially clean."},
        {"header":"Shadow Detail","dek":"Competent and steady. Shadows are readable when metered sensibly, though they are not especially plush or expansive."},
        {"header":"Highlight Roll-off","dek":"Clean and neutral. Bright tones stay well behaved, giving the film its approachable budget all-rounder feel."}
      ]'::jsonb
    ),
    (
      'kentmere-pan-400',
      3,
      3,
      4,
      '[
        {"header":"Tonal Range","dek":"Practical and balanced. Kentmere 400 gives a straightforward 400-speed look with useful midtones and enough grain to remind you it is film."},
        {"header":"Push/Pull","dek":"Pushes quite well. It tolerates 800 and 1600 better than many low-cost films, especially if you embrace a little extra texture."},
        {"header":"Shadow Detail","dek":"Fairly forgiving. Low values hold together reasonably well, particularly when the film is not underexposed."},
        {"header":"Highlight Roll-off","dek":"Soft enough. Highlights stay friendly and manageable, helping the stock work across mixed everyday lighting."}
      ]'::jsonb
    ),
    (
      'kodak-double-x',
      4,
      4,
      4,
      '[
        {"header":"Tonal Range","dek":"Cinematic and moody. Double-X gives a silver-screen grayscale with glowing mids, strong blacks, and a dramatic but still expressive tonal curve."},
        {"header":"Push/Pull","dek":"Pushes beautifully. It handles extra speed with confidence, turning grain and contrast into part of the film''s unmistakable character."},
        {"header":"Shadow Detail","dek":"Moderate but attractive. Shadows are not endlessly open, but they keep enough information to feel rich instead of dead."},
        {"header":"Highlight Roll-off","dek":"Velvety with bloom. Highlights soften and glow in a very filmic way, especially in bright practical light."}
      ]'::jsonb
    ),
    (
      'kodak-tmax-100',
      1,
      3,
      3,
      '[
        {"header":"Tonal Range","dek":"Precise and clean. T-Max 100 offers extremely fine grain and a modern grayscale that feels almost clinical in the best sense."},
        {"header":"Push/Pull","dek":"Best at box. It can move a little, but the main reason to choose it is maximum precision, not dramatic push flexibility."},
        {"header":"Shadow Detail","dek":"Very well resolved. Dark tones hold subtle detail when the negative is exposed accurately, making the stock excellent for careful work."},
        {"header":"Highlight Roll-off","dek":"Crisp and controlled. Highlights stay bright and well defined, with less softness than a more old-fashioned emulsion."}
      ]'::jsonb
    ),
    (
      'kodak-tmax-400',
      2,
      3,
      4,
      '[
        {"header":"Tonal Range","dek":"Wide and polished. T-Max 400 balances speed with modern tabular grain, producing a refined grayscale and strong overall separation."},
        {"header":"Push/Pull","dek":"Excellent under pressure. It is one of the better push films in the catalog, keeping structure and sharpness even as speed goes up."},
        {"header":"Shadow Detail","dek":"Strong and modern. Shadows stay more detailed than many classic 400-speed stocks, especially when the film is given honest exposure."},
        {"header":"Highlight Roll-off","dek":"Controlled and smooth. Bright areas hold together cleanly without the brittle edge that faster push films often develop."}
      ]'::jsonb
    ),
    (
      'kodak-tmax-p3200',
      5,
      4,
      3,
      '[
        {"header":"Tonal Range","dek":"Dense and urgent. T-Max P3200 is built for darkness and atmosphere, with compressed tonality that favors survival over elegance."},
        {"header":"Push/Pull","dek":"Made for pushing. The film exists to be rated fast, and it can stretch further still if you are willing to trade smoothness for raw energy."},
        {"header":"Shadow Detail","dek":"Limited by design. Deep shadows fall away quickly, especially once the stock is pushed into truly dim conditions."},
        {"header":"Highlight Roll-off","dek":"Gritty and bright. Highlights can bloom and go dense, adding to the late-night look rather than staying silky."}
      ]'::jsonb
    ),
    (
      'kodak-tri-x-400',
      4,
      4,
      5,
      '[
        {"header":"Tonal Range","dek":"Classic and punchy. Tri-X combines gritty grain with a broad enough scale to stay expressive while still delivering its famous soot-and-chalk drama."},
        {"header":"Push/Pull","dek":"Legendary flexibility. Few films take pushes as confidently, which is why Tri-X remains a reference point for documentary and street work."},
        {"header":"Shadow Detail","dek":"Good with intent. Shadows can crush for effect, but there is still real latitude underneath if the exposure is handled with care."},
        {"header":"Highlight Roll-off","dek":"Remarkably forgiving. Highlights stay alive longer than the contrast suggests, helping the film survive difficult real-world light."}
      ]'::jsonb
    ),
    (
      'kosmo-foto-mono-100',
      1,
      3,
      3,
      '[
        {"header":"Tonal Range","dek":"Balanced and classic. Kosmo Mono 100 gives a straightforward fine-grain black-and-white look with steady mids and no extreme tonal tricks."},
        {"header":"Push/Pull","dek":"Likes normal exposure. It is happiest around box speed, where the stock delivers the dependable rendering it is known for."},
        {"header":"Shadow Detail","dek":"Good and honest. Shadows stay readable with normal metering, though they do not stretch far beyond that."},
        {"header":"Highlight Roll-off","dek":"Clean and conventional. Bright values hold together neatly, reinforcing the film''s everyday reliability."}
      ]'::jsonb
    ),
    (
      'lomography-berlin-kino-400',
      4,
      5,
      2,
      '[
        {"header":"Tonal Range","dek":"Harsh and graphic. Berlin Kino 400 is designed for bold blacks, bright whites, and a city-at-night attitude more than smooth middle grays."},
        {"header":"Push/Pull","dek":"Pushes for drama. Extra speed suits the film''s personality, while pulling it down tends to dilute the rough edge people choose it for."},
        {"header":"Shadow Detail","dek":"Purposefully sparse. Shadows crush readily, which is part of the stock''s stylized urban look."},
        {"header":"Highlight Roll-off","dek":"Bright and abrupt. Highlights hit hard and fast, adding to the film''s graphic cinema-inspired signature."}
      ]'::jsonb
    ),
    (
      'lomography-earl-grey-100',
      2,
      3,
      3,
      '[
        {"header":"Tonal Range","dek":"Smooth and versatile. Earl Grey 100 aims for an approachable classic grayscale with finer grain and calmer contrast than Lomo''s rougher stocks."},
        {"header":"Push/Pull","dek":"Best used gently. It responds well to box speed and slight overexposure, but it is not especially compelling as a hard push film."},
        {"header":"Shadow Detail","dek":"Nicely readable. Dark values hold enough texture for portraits and everyday scenes without demanding perfect metering."},
        {"header":"Highlight Roll-off","dek":"Soft and pleasant. Highlights taper away cleanly, giving the film a friendly all-purpose look."}
      ]'::jsonb
    ),
    (
      'lomography-fantome-kino-8',
      1,
      3,
      2,
      '[
        {"header":"Tonal Range","dek":"Delicate and luminous. Fantome Kino 8 offers ultra-fine grain and an unusually smooth low-speed scale when the exposure is treated carefully."},
        {"header":"Push/Pull","dek":"Needs precise light. It is not a stock for chasing speed, since its charm comes from disciplined exposure and calm development."},
        {"header":"Shadow Detail","dek":"Subtle but limited. Shadows can look beautiful when metered well, yet there is not much room for error at such a slow speed."},
        {"header":"Highlight Roll-off","dek":"Beautifully gentle. Highlights glow in a refined way that makes the film feel almost luxurious in bright light."}
      ]'::jsonb
    ),
    (
      'lomography-lady-grey-400',
      3,
      2,
      4,
      '[
        {"header":"Tonal Range","dek":"Soft and accessible. Lady Grey 400 has a forgiving low-contrast curve that feels friendlier and less severe than many dramatic 400-speed stocks."},
        {"header":"Push/Pull","dek":"Fairly flexible. It tolerates rating changes reasonably well, though the film is nicest when used for its smooth box-speed elegance."},
        {"header":"Shadow Detail","dek":"Open and flattering. Shadows retain plenty of tone, which helps the film work well for portraits and everyday scenes."},
        {"header":"Highlight Roll-off","dek":"Gentle and easy. Highlights soften gracefully instead of jumping into harsh white, reinforcing the stock''s approachable personality."}
      ]'::jsonb
    ),
    (
      'lomography-potsdam-kino-100',
      1,
      3,
      4,
      '[
        {"header":"Tonal Range","dek":"Refined and cinematic. Potsdam Kino 100 combines fine grain with a smooth classic scale that feels cleaner and more polished than many vintage-style films."},
        {"header":"Push/Pull","dek":"Best near box. It rewards careful exposure or a slight pull more than it rewards trying to turn it into a faster emulsion."},
        {"header":"Shadow Detail","dek":"Strong and nuanced. Dark areas stay textured and elegant, especially in controlled or moderately contrasty light."},
        {"header":"Highlight Roll-off","dek":"Creamy and soft. Highlights ease off with a graceful cinema-like finish that suits portrait and studio work."}
      ]'::jsonb
    ),
    (
      'orwo-wolfen-np100',
      2,
      3,
      3,
      '[
        {"header":"Tonal Range","dek":"Neutral and classic. Wolfen NP100 gives a straightforward grayscale with crisp detail and a practical old-school black-and-white feel."},
        {"header":"Push/Pull","dek":"Better at box. It is more of a dependable standard stock than a creative pushing platform, though small exposure changes are manageable."},
        {"header":"Shadow Detail","dek":"Steady and usable. Shadows keep respectable detail as long as the film is metered honestly."},
        {"header":"Highlight Roll-off","dek":"Clean and direct. Highlights stay controlled without the extra softness of more premium long-scale films."}
      ]'::jsonb
    ),
    (
      'rollei-infrared-400',
      3,
      5,
      2,
      '[
        {"header":"Tonal Range","dek":"Stylized and extreme. Infrared 400 can look fairly normal unfiltered, but in IR-style use the tonal curve turns hard, surreal, and highly contrasty."},
        {"header":"Push/Pull","dek":"Exposure matters more. Filter compensation and scene choice shape the result much more than traditional pushing or pulling."},
        {"header":"Shadow Detail","dek":"Limited in IR mode. Deep tones can disappear quickly once the film is used for dramatic foliage and dark-sky effects."},
        {"header":"Highlight Roll-off","dek":"Glowing but sharp. Highlights can bloom with a distinctive infrared aura, though they are not especially forgiving."}
      ]'::jsonb
    ),
    (
      'rollei-retro-400s',
      3,
      4,
      3,
      '[
        {"header":"Tonal Range","dek":"Snappy and distinctive. Retro 400S mixes a practical 400-speed grayscale with extended red sensitivity that gives scenes a slightly stylized edge."},
        {"header":"Push/Pull","dek":"Pushes capably. It can move upward with confidence, though the result becomes harder and more graphic as speed increases."},
        {"header":"Shadow Detail","dek":"Moderate but usable. Shadows hold enough information for real-world work, but the film does not hide thin exposure."},
        {"header":"Highlight Roll-off","dek":"Clean and brisk. Highlights stay orderly, though they taper less softly than the most forgiving classic emulsions."}
      ]'::jsonb
    ),
    (
      'rollei-retro-80s',
      1,
      4,
      3,
      '[
        {"header":"Tonal Range","dek":"Crisp and specialized. Retro 80S has very fine grain and a distinct extended-red response that changes tonal relationships in an appealingly graphic way."},
        {"header":"Push/Pull","dek":"Likes careful use. It is best enjoyed at box speed with filters or deliberate scene choices rather than pushed for convenience."},
        {"header":"Shadow Detail","dek":"Good with metering. Dark areas stay detailed when exposure is accurate, but there is not much reason to waste the film on sloppy shooting."},
        {"header":"Highlight Roll-off","dek":"Bright and crisp. Highlights keep a clean edge that matches the film''s high-acutance character."}
      ]'::jsonb
    ),
    (
      'rollei-rpx-100',
      2,
      3,
      4,
      '[
        {"header":"Tonal Range","dek":"Balanced and dependable. RPX 100 delivers a neutral fine-grain grayscale with enough openness to work across portrait, travel, and general shooting."},
        {"header":"Push/Pull","dek":"Moderately flexible. It tolerates small rating changes well, though its strongest quality is reliable box-speed rendering rather than dramatic adaptation."},
        {"header":"Shadow Detail","dek":"Strong and tidy. Shadows stay readable with pleasant separation, especially when the film is given honest exposure."},
        {"header":"Highlight Roll-off","dek":"Smooth and consistent. Highlights hold their shape without becoming overly brittle, which helps the stock feel easy to scan and print."}
      ]'::jsonb
    ),
    (
      'rollei-rpx-25',
      1,
      3,
      3,
      '[
        {"header":"Tonal Range","dek":"Long and luminous. RPX 25 offers extremely fine grain and elegant grayscale separation when used in the bright light it was built for."},
        {"header":"Push/Pull","dek":"Needs patience. It is better slightly overexposed than pushed, since the film is really about precision, resolution, and low-speed beauty."},
        {"header":"Shadow Detail","dek":"Good when careful. Shadows can be rich and articulate, but the slow speed means metering discipline still matters."},
        {"header":"Highlight Roll-off","dek":"Graceful and polished. Highlights stay bright and attractive, making the film excellent for sunny scenes and crisp prints."}
      ]'::jsonb
    ),
    (
      'rollei-rpx-400',
      3,
      4,
      4,
      '[
        {"header":"Tonal Range","dek":"Solid and practical. RPX 400 gives a no-nonsense 400-speed grayscale with enough punch for street work and enough order for general shooting."},
        {"header":"Push/Pull","dek":"Pushes well enough. It handles higher ratings competently, especially if you are comfortable with a little extra grain and contrast."},
        {"header":"Shadow Detail","dek":"Good with extra light. Low values stay useful, but the film responds best when it is not underfed."},
        {"header":"Highlight Roll-off","dek":"Firm but fair. Highlights keep their shape in bright scenes, though they are less creamy than more premium all-rounders."}
      ]'::jsonb
    ),
    (
      'rollei-superpan-200',
      2,
      3,
      4,
      '[
        {"header":"Tonal Range","dek":"Distinctive and open. Superpan 200 has a smooth overall grayscale with enough spectral character to make landscapes feel a little different from standard panchromatic films."},
        {"header":"Push/Pull","dek":"Moderately adaptable. It tolerates some rating changes, but its real appeal is the native tonal rendering rather than extreme flexibility."},
        {"header":"Shadow Detail","dek":"Good in landscape light. Shadows stay reasonably open, especially when the stock is used where its extended sensitivity can shine."},
        {"header":"Highlight Roll-off","dek":"Clean and gentle. Highlights remain well behaved, giving the film a balanced and versatile finish."}
      ]'::jsonb
    ),
    (
      'silberra-u100',
      1,
      3,
      3,
      '[
        {"header":"Tonal Range","dek":"Neutral and clean. Silberra U100 offers a straightforward fine-grain grayscale that feels honest, modern, and easy to work with."},
        {"header":"Push/Pull","dek":"Best kept simple. It is more of a dependable box-speed stock than a specialist push or pull emulsion."},
        {"header":"Shadow Detail","dek":"Steady and readable. Shadows hold enough information for everyday shooting without asking for heroic metering."},
        {"header":"Highlight Roll-off","dek":"Orderly and calm. Highlights stay balanced, reinforcing the film''s controlled all-purpose nature."}
      ]'::jsonb
    ),
    (
      'street-candy-mtn-100',
      1,
      5,
      2,
      '[
        {"header":"Tonal Range","dek":"Hard and graphic. MTN 100 is built around sharp edges, high contrast, and a surveillance-film look rather than gentle grayscale subtlety."},
        {"header":"Push/Pull","dek":"Not very elastic. It is best used for its native harsh-light personality, since pushing or pulling does little to make it gentler."},
        {"header":"Shadow Detail","dek":"Purposefully limited. Dark tones can block quickly, which is part of the stock''s stark urban signature."},
        {"header":"Highlight Roll-off","dek":"Quick and bright. Highlights hit fast with a crisp white snap that suits the film''s graphic character."}
      ]'::jsonb
    )
) AS v(slug, grain, contrast, latitude, shooting_notes)
WHERE f.slug = v.slug;
