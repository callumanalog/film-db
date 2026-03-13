-- Backfill Performance (shooting_notes) for Kodak Gold 200 with the original hed + dek copy.
UPDATE film_stocks
SET shooting_notes = '[
  {"header": "Skin Tones", "dek": "Healthy and warm. It favors yellow/orange undertones, giving subjects a \"sun-kissed\" look. While not as clinical as Portra, it is very flattering for casual portraits."},
  {"header": "Color Bias", "dek": "Strong leaning toward warmth. It excels in golden hour light, accentuating yellows, reds, and oranges. Blues often take on a slight cyan/teal tint in the shadows."},
  {"header": "Push/Pull", "dek": "Not recommended for significant pushing. While it can handle +1 stop if needed, the grain becomes considerably more \"gritty\" and the shadows can turn muddy/brown."},
  {"header": "Shadow Detail", "dek": "Moderate. Gold 200 loves light; if shadows are underexposed by more than 1–2 stops, they tend to lose detail and shift toward a warm, grainy green-brown."},
  {"header": "Highlight Roll-off", "dek": "Exceptional. Like most Kodak negative films, it is very difficult to \"blow out\" highlights. It handles bright sun and harsh reflections with a smooth, pleasing transition."}
]'::jsonb
WHERE slug = 'kodak-gold-200';
