-- Fujifilm 400 was seeded with a mistaken Kodak Kodacolor 100 storage URL.
-- Point catalog at the site-hosted canister image (same pattern as other stocks in 053_*).
UPDATE film_stocks
SET
  image_url = '/films/fujifilm-400.jpg',
  updated_at = now()
WHERE slug = 'fujifilm-400';
