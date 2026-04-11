-- Kodak Pro Image 100: seed had null image_url; catalog asset lives at /films/kodak-proimage-100.jpg.
UPDATE film_stocks
SET
  image_url = '/films/kodak-proimage-100.jpg',
  updated_at = now()
WHERE slug = 'kodak-proimage-100';
