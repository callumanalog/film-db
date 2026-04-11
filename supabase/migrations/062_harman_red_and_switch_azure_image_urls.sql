-- Harman Red 125 / Switch Azure 125: catalog pointed at /films/*.svg files that were never shipped; assets live at /films/*.jpg.
UPDATE film_stocks
SET
  image_url = '/films/harman-red.jpg',
  updated_at = now()
WHERE slug = 'harman-red';

UPDATE film_stocks
SET
  image_url = '/films/harman-switch-azure.jpg',
  updated_at = now()
WHERE slug = 'harman-switch-azure';
