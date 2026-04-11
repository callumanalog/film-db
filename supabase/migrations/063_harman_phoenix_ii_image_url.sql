-- Harman Phoenix II 200: some environments had image_url set to Kodak Kodacolor 200 (script placeholder) or a missing /films/*.svg path.
UPDATE film_stocks
SET
  image_url = '/films/harman-phoenix-ii.jpg',
  updated_at = now()
WHERE slug = 'harman-phoenix-ii';
